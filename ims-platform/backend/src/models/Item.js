const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    unitPrice: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 5 },
    location: { type: String }, // Warehouse shelf or office floor
    status: {
        type: String,
        enum: ['active', 'low_stock', 'out_of_stock', 'discontinued'],
        default: 'active'
    },
    specifications: { type: Map, of: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

itemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    if (this.totalQuantity <= 0) this.status = 'out_of_stock';
    else if (this.totalQuantity <= this.minStockLevel) this.status = 'low_stock';
    else this.status = 'active';
    next();
});

module.exports = mongoose.model('Item', itemSchema);
