'use strict';

const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { getIo, onlineUsers } = require('../sockets');
const { logAction } = require('../middleware/audit');
const { triggerN8nWebhook } = require('../routes/webhook.routes');

exports.getProjects = async (req, res, next) => {
    try {
        const { search, status, page = 1, limit = 50 } = req.query;
        const query = {};

        // Employees only see projects they're members of
        if (req.user.role === 'employee') {
            query.memberIds = req.user._id;
        }
        // Clients only see their linked projects
        if (req.user.role === 'client') {
            query.clientId = req.user._id;
        }
        if (status) query.status = status;
        if (search) query.$text = { $search: search };

        const skip = (Number(page) - 1) * Number(limit);
        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('ownerId', 'name email photoUrl')
                .populate('clientId', 'name company')
                .populate('memberIds', 'name email photoUrl role')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Project.countDocuments(query),
        ]);

        res.json({ projects, total, page: Number(page) });
    } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
    try {
        const project = await Project.create({ ...req.body, ownerId: req.user._id });
        await logAction(req.user._id, 'CREATE_PROJECT', 'project', project._id, { name: project.name }, req);

        // Notify added members
        if (project.memberIds && project.memberIds.length > 0) {
            const io = getIo();
            const User = require('../models/User');
            const EmailService = require('../services/email.service');
            const members = await User.find({ _id: { $in: project.memberIds } });

            for (const member of members) {
                // Send background email
                if (member.email) {
                    EmailService.sendProjectAssignedEmail(
                        member.email,
                        member.name,
                        project.name,
                        `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/projects/${project._id}`
                    ).catch(err => console.error(`Failed to send assignment email to ${member.email}:`, err.message));
                }

                if (member._id.toString() === req.user._id.toString()) continue;

                // Send in-app notification
                const notif = await Notification.create({
                    userId: member._id,
                    type: 'project_update',
                    title: 'New Project Assignment',
                    message: `You were added to project: ${project.name}`,
                    actionUrl: `/dashboard/projects/${project._id}`
                });

                const sockets = onlineUsers.get(member._id.toString());
                if (sockets) {
                    for (const sid of sockets) io.to(sid).emit('notification:new', notif);
                }
            }
        }

        // Trigger n8n webhook for critical projects
        if (project.priority === 'Critical') {
            await triggerN8nWebhook('critical-project', {
                projectId: project._id,
                name: project.name,
                ownerId: project.ownerId
            });
        }

        res.status(201).json({ project });
    } catch (err) { next(err); }
};

exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'name email photoUrl')
            .populate('clientId', 'name company email')
            .populate('memberIds', 'name email photoUrl role position')
            .lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        ).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        await logAction(req.user._id, 'UPDATE_PROJECT', 'project', project._id, {}, req);
        res.json({ project });
    } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
    try {
        await Project.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        await logAction(req.user._id, 'DELETE_PROJECT', 'project', req.params.id, {}, req);
        res.json({ message: 'Project deleted' });
    } catch (err) { next(err); }
};

exports.updateMembers = async (req, res, next) => {
    try {
        const { memberIds } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id, { memberIds }, { new: true }
        ).populate('memberIds', 'name email photoUrl role').lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) { next(err); }
};

exports.getProjectTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ projectId: req.params.id })
            .populate('assigneeId', 'name email photoUrl')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ tasks });
    } catch (err) { next(err); }
};

exports.getProjectNotes = async (req, res, next) => {
    try {
        const notes = await Note.find({ projectId: req.params.id })
            .populate('createdBy', 'name email photoUrl role')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ notes });
    } catch (err) { next(err); }
};

exports.createProjectNote = async (req, res, next) => {
    try {
        const note = await Note.create({
            content: req.body.content,
            projectId: req.params.id,
            createdBy: req.user._id,
        });

        // Trigger population before sending back to frontend
        await note.populate('createdBy', 'name email photoUrl role');

        await logAction(req.user._id, 'CREATE_NOTE', 'project', req.params.id, {}, req);
        res.status(201).json({ note });
    } catch (err) { next(err); }
};
