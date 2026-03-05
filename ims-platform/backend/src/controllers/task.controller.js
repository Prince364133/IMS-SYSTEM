'use strict';

const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { getIo, onlineUsers } = require('../sockets');
const { logAction } = require('../middleware/audit');

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

        // Notify assignee if someone else created it
        if (task.assigneeId && task.assigneeId.toString() !== req.user._id.toString()) {
            const notif = await Notification.create({
                userId: task.assigneeId,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You were assigned to: ${task.title}`,
                actionUrl: '/dashboard/tasks'
            });
            try {
                const io = getIo();
                const sockets = onlineUsers.get(task.assigneeId.toString());
                if (sockets) {
                    for (const sid of sockets) io.to(sid).emit('notification:new', notif);
                }
            } catch (e) { console.error('Socket emit error:', e.message); }
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

        // Notify if assignee changed
        if (req.body.assigneeId && req.body.assigneeId !== oldTask.assigneeId?.toString() && req.body.assigneeId !== req.user._id.toString()) {
            const notif = await Notification.create({
                userId: req.body.assigneeId,
                type: 'task_assigned',
                title: 'Reassigned Task',
                message: `You were reassigned to: ${task.title}`,
                actionUrl: '/dashboard/tasks'
            });
            try {
                const io = getIo();
                const sockets = onlineUsers.get(req.body.assigneeId);
                if (sockets) {
                    for (const sid of sockets) io.to(sid).emit('notification:new', notif);
                }
            } catch (e) { }
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
