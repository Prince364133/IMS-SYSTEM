'use strict';

const Item = require('../models/Item');
const Category = require('../models/Category');
const InventoryTransaction = require('../models/InventoryTransaction');

// CATEGORIES
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort('name');
        res.json({ categories });
    } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ category });
    } catch (err) { next(err); }
};

// ITEMS
exports.getItems = async (req, res, next) => {
    try {
        const { category, status, search } = req.query;
        let query = {};
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await Item.find(query).populate('category', 'name').sort('-createdAt');
        res.json({ items });
    } catch (err) { next(err); }
};

exports.getItemById = async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id).populate('category', 'name');
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ item });
    } catch (err) { next(err); }
};

exports.createItem = async (req, res, next) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json({ item });
    } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ item });
    } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { next(err); }
};

// TRANSACTIONS
exports.getTransactions = async (req, res, next) => {
    try {
        const { itemId } = req.query;
        let query = {};
        if (itemId) query.item = itemId;

        const transactions = await InventoryTransaction.find(query)
            .populate('item', 'name sku')
            .populate('performedBy', 'name')
            .sort('-date');
        res.json({ transactions });
    } catch (err) { next(err); }
};

exports.addTransaction = async (req, res, next) => {
    try {
        const { itemId, type, quantity, notes, reference } = req.body;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        // Update item quantity
        if (type === 'in' || type === 'return') {
            item.totalQuantity += Number(quantity);
        } else if (type === 'out') {
            if (item.totalQuantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            item.totalQuantity -= Number(quantity);
        } else if (type === 'adjustment') {
            item.totalQuantity = Number(quantity); // For adjustments, quantity is the NEW total
        }

        await item.save();

        const transaction = await InventoryTransaction.create({
            item: itemId,
            type,
            quantity: type === 'adjustment' ? (Number(quantity) - item.totalQuantity) : Number(quantity),
            notes,
            reference,
            performedBy: req.user._id
        });

        // Notify HR/Admin about stock movements/adjustments
        try {
            const { createNotification } = require('../utils/notify');
            const { getIo } = require('../sockets');
            const User = require('../models/User');

            const admins = await User.find({ role: { $in: ['admin', 'hr'] } }).select('_id');
            const io = getIo();

            for (const admin of admins) {
                // Adjustment alert
                if (type === 'adjustment') {
                    await createNotification({
                        userId: admin._id,
                        type: 'alert',
                        title: 'Stock Adjusted 📦',
                        message: `Inventory item "${item.name}" was manually adjusted to ${item.totalQuantity} units.`,
                        actionUrl: '/dashboard/inventory',
                        io,
                    });
                }

                // Low stock alert
                if (item.totalQuantity <= (item.minStockLevel || 5)) {
                    await createNotification({
                        userId: admin._id,
                        type: 'alert',
                        title: 'Low Stock Warning ⚠️',
                        message: `Item "${item.name}" is low on stock (${item.totalQuantity} remaining).`,
                        actionUrl: '/dashboard/inventory',
                        io,
                    });
                }
            }
        } catch (e) { /* swallow */ }

        res.status(201).json({ transaction, item });
    } catch (err) { next(err); }
};
