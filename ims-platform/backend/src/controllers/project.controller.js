'use strict';

const { getIo, onlineUsers } = require('../sockets');
const { logAction } = require('../middleware/audit');
const { triggerN8nWebhook } = require('../routes/webhook.routes');
const AutomationService = require('../services/automation.service');

exports.getProjects = async (req, res, next) => {
    try {
        const Project = req.tenantDb.model('Project');
        const Client = req.tenantDb.model('Client');
        const { search, status, page = 1, limit = 50 } = req.query;
        const query = {};

        // Employees only see projects they're members of
        if (req.user.role === 'employee') {
            query.memberIds = req.user._id;
        }
        // Clients only see their linked projects
        if (req.user.role === 'client') {
            const client = await Client.findOne({ userId: req.user._id });
            if (client) {
                query.clientIds = client._id;
            } else {
                return res.json({ projects: [], total: 0, page: Number(page) });
            }
        }
        if (status) query.status = status;
        // Smart search fallback if $text index is not ready or complex
        if (search) query.name = { $regex: search, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('ownerId', 'name email photoUrl')
                .populate('clientIds', 'name company email')
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
        const Project = req.tenantDb.model('Project');
        const project = await Project.create({ ...req.body, ownerId: req.user._id });
        await logAction(req.user._id, 'CREATE_PROJECT', 'project', project._id, { name: project.name }, req);

        // Notify added members via Automation Service
        if (project.memberIds && project.memberIds.length > 0) {
            for (const memberId of project.memberIds) {
                await AutomationService.trigger({
                    eventType: 'project_assigned',
                    triggeredBy: req.user._id,
                    targetUser: memberId,
                    relatedItem: { itemId: project._id, itemModel: 'Project' },
                    description: `You were assigned to the project: ${project.name}`,
                    metadata: { projectName: project.name }
                });
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
        const Project = req.tenantDb.model('Project');
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'name email photoUrl')
            .populate('clientIds', 'name company email phone')
            .populate('memberIds', 'name email photoUrl role position')
            .lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
    try {
        const Project = req.tenantDb.model('Project');
        const oldProject = await Project.findById(req.params.id);
        if (!oldProject) return res.status(404).json({ error: 'Project not found' });

        // IDOR Check: Only admin or owner can update
        const isAdmin = req.user.role === 'admin';
        const isOwner = oldProject.ownerId?.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Access denied. Only the project owner or administrator can modify project details.' });
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        ).lean();

        // Trigger status change automation
        if (req.body.status && req.body.status !== oldProject.status) {
            await AutomationService.trigger({
                eventType: 'project_status_changed',
                triggeredBy: req.user._id,
                relatedItem: { itemId: project._id, itemModel: 'Project' },
                description: `Project status changed to ${req.body.status}`,
                metadata: { projectName: project.name, newStatus: req.body.status }
            });
        }

        await logAction(req.user._id, 'UPDATE_PROJECT', 'project', project._id, {}, req);
        res.json({ project });
    } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
    try {
        const Project = req.tenantDb.model('Project');
        const Task = req.tenantDb.model('Task');
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // IDOR Check
        if (req.user.role !== 'admin' && project.ownerId?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        await Project.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        // Soft delete all tasks as well
        await Task.updateMany({ projectId: req.params.id }, { deletedAt: new Date() });

        await logAction(req.user._id, 'DELETE_PROJECT', 'project', req.params.id, {}, req);
        res.json({ message: 'Project and associated tasks deleted' });
    } catch (err) { next(err); }
};

exports.updateMembers = async (req, res, next) => {
    try {
        const Project = req.tenantDb.model('Project');
        const { memberIds } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id, { memberIds }, { new: true }
        ).populate('memberIds', 'name email photoUrl role').lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) { next(err); }
};

exports.updateClients = async (req, res, next) => {
    try {
        const Project = req.tenantDb.model('Project');
        const { clientIds } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id, { clientIds }, { new: true }
        ).populate('clientIds', 'name company email').lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) { next(err); }
};

exports.getProjectTasks = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const tasks = await Task.find({ projectId: req.params.id })
            .populate('assigneeId', 'name email photoUrl')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ tasks });
    } catch (err) { next(err); }
};

exports.getProjectNotes = async (req, res, next) => {
    try {
        // Fallback for missing/optional models like Note
        let Note;
        try { Note = req.tenantDb.model('Note'); } catch (e) { return res.json({ notes: [] }); }

        const notes = await Note.find({ projectId: req.params.id })
            .populate('createdBy', 'name email photoUrl role')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ notes });
    } catch (err) { next(err); }
};

exports.createProjectNote = async (req, res, next) => {
    try {
        let Note;
        try { Note = req.tenantDb.model('Note'); } catch (e) { return res.status(400).json({ error: 'Notes feature not supported in current DB version' }); }

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
