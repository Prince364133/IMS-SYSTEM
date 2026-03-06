'use strict';

const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const EmailService = require('../services/email.service');
const { getIo, onlineUsers } = require('../sockets');
const { logAction } = require('../middleware/audit');
const AutomationService = require('../services/automation.service');

exports.getTasks = async (req, res, next) => {
    try {
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

        res.status(201).json({ task });
    } catch (err) { next(err); }
};

exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigneeId', 'name email photoUrl')
            .populate('projectId', 'name status').lean();
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ task });
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ error: 'Task not found' });

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
        // Notify if status changed and not updated by assignee
        if (req.body.status && req.body.status !== oldTask.status && oldTask.assigneeId?.toString() === req.user._id.toString()) {
            // Mention logic could go here to notify PM/creator
        }

        res.json({ task });
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        await logAction(req.user._id, 'DELETE_TASK', 'task', req.params.id, {}, req);
        res.json({ message: 'Task deleted' });
    } catch (err) { next(err); }
};
