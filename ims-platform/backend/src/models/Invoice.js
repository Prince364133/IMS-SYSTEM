'use strict';
const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, default: '' }, // denormalized
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    lineItems: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate invoice number before validate
invoiceSchema.pre('validate', async function () {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
