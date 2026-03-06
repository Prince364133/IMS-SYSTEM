'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['admin', 'superadmin'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    text: { type: String, required: true },
    attachmentUrl: { type: String },
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyName: { type: String },
    raisedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String },
        email: { type: String },
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['billing', 'technical', 'feature_request', 'account', 'other'],
        default: 'other',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
        default: 'open',
    },
    messages: [messageSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
}, { timestamps: true });

supportTicketSchema.index({ companyId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });

// Static: count tickets for a company in the current calendar month
supportTicketSchema.statics.getMonthlyCount = async function (companyId) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return this.countDocuments({ companyId, createdAt: { $gte: start, $lte: end } });
};

const MONTHLY_LIMIT = 9;
supportTicketSchema.statics.MONTHLY_LIMIT = MONTHLY_LIMIT;

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
