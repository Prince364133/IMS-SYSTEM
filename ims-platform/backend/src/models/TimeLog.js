'use strict';
const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 }, // computed on stop
    date: { type: String }, // YYYY-MM-DD for quick filtering
    status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
}, { timestamps: true });

timeLogSchema.index({ userId: 1, date: 1 });
module.exports = mongoose.model('TimeLog', timeLogSchema);
