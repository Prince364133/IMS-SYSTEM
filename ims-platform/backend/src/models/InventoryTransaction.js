const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    type: {
        type: String,
        enum: ['in', 'out', 'return', 'adjustment'],
        required: true
    },
    quantity: { type: Number, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String }, // e.g., Purchase Order ID or Task ID
    notes: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
