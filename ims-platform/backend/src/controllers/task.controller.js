'use strict';

const EmailService = require('../services/email.service');
const { getIo, onlineUsers } = require('../sockets');
const { logAction } = require('../middleware/audit');
const AutomationService = require('../services/automation.service');

exports.getTasks = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const { projectId, assigneeId, status, page = 1, limit = 100 } = req.query;
        const query = {};
        if (projectId) query.projectId = projectId;
        if (assigneeId) query.assigneeId = assigneeId;
        if (status) query.status = status;
        if (req.user.role === 'employee') query.assigneeId = req.user._id;

        const skip = (Number(page) - 1) * Number(limit);
        const [tasks, total] = await Promise.all([
            Task.find(query)
                .populate('assigneeId', 'name email photoUrl')
                .populate('projectId', 'name status')
                .sort({ dueDate: 1, createdAt: -1 })
                .skip(skip).limit(Number(limit)).lean(),
            Task.countDocuments(query),
        ]);
        res.json({ tasks, total });
    } catch (err) { next(err); }
};

exports.createTask = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const Project = req.tenantDb.model('Project');
        const task = await Task.create({ ...req.body, createdBy: req.user._id });
        await logAction(req.user._id, 'CREATE_TASK', 'task', task._id, { title: task.title }, req);

        // Notify assignee via Automation Service
        if (task.assigneeId && task.assigneeId.toString() !== req.user._id.toString()) {
            await AutomationService.trigger({
                eventType: 'task_assigned',
                triggeredBy: req.user._id,
                targetUser: task.assigneeId,
                relatedItem: { itemId: task._id, itemModel: 'Task' },
                description: `You were assigned to task: ${task.title}`,
                metadata: { taskName: task.title, projectName: task.projectId ? (await Project.findById(task.projectId).select('name'))?.name : 'Personal' }
            });
        }

        if (task.projectId) {
            await updateProjectProgress(task.projectId, req.tenantDb);
        }

        res.status(201).json({ task });
    } catch (err) { next(err); }
};

exports.getTaskById = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const task = await Task.findById(req.params.id)
            .populate('assigneeId', 'name email photoUrl')
            .populate('projectId', 'name status').lean();
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ task });
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const Project = req.tenantDb.model('Project');
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ error: 'Task not found' });

        // IDOR Check: Only admin, creator, or assignee can update
        const isAdmin = req.user.role === 'admin';
        const isCreator = oldTask.createdBy?.toString() === req.user._id.toString();
        const isAssignee = oldTask.assigneeId?.toString() === req.user._id.toString();

        if (!isAdmin && !isCreator && !isAssignee) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to edit this task.' });
        }

        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        await logAction(req.user._id, 'UPDATE_TASK', 'task', task._id, {}, req);

        // Trigger reassignment automation
        if (req.body.assigneeId && req.body.assigneeId !== oldTask.assigneeId?.toString()) {
            await AutomationService.trigger({
                eventType: 'task_assigned',
                triggeredBy: req.user._id,
                targetUser: req.body.assigneeId,
                relatedItem: { itemId: task._id, itemModel: 'Task' },
                description: `You were reassigned to task: ${task.title}`,
                metadata: { taskName: task.title, projectName: task.projectId ? (await Project.findById(task.projectId).select('name'))?.name : 'Personal' }
            });
        }

        // Trigger completion automation
        if (req.body.status === 'Completed' && oldTask.status !== 'Completed') {
            await AutomationService.trigger({
                eventType: 'task_completed',
                triggeredBy: req.user._id,
                relatedItem: { itemId: task._id, itemModel: 'Task' },
                description: `Task "${task.title}" has been completed.`,
                metadata: { taskName: task.title }
            });
        }

        if (task.projectId) {
            await updateProjectProgress(task.projectId, req.tenantDb);
        }

        res.json({ task });
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const Task = req.tenantDb.model('Task');
        const task = await Task.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        if (task && task.projectId) {
            await updateProjectProgress(task.projectId, req.tenantDb);
        }
        await logAction(req.user._id, 'DELETE_TASK', 'task', req.params.id, {}, req);
        res.json({ message: 'Task deleted' });
    } catch (err) { next(err); }
};

const updateProjectProgress = async (projectId, tenantDb) => {
    if (!projectId || !tenantDb) return;
    try {
        const Task = tenantDb.model('Task');
        const Project = tenantDb.model('Project');
        const stats = await Task.aggregate([
            { $match: { projectId: new (require('mongoose').Types.ObjectId)(String(projectId)), deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
                }
            }
        ]);

        const progress = stats.length > 0 ? Math.round((stats[0].completed / stats[0].total) * 100) : 0;
        await Project.findByIdAndUpdate(projectId, { progress });
        console.log(`Optimized Progress Update: Project ${projectId} -> ${progress}%`);
    } catch (err) {
        console.error('Error updating project progress:', err.message);
    }
};

module.exports = exports;
