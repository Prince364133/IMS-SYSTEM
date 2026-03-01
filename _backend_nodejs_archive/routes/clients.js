const express = require('express');
const Client = require('../models/Client');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
        const clients = await Client.find(filter).sort({ name: 1 });
        res.json({ clients, count: clients.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const client = await Client.create({ ...req.body, addedBy: req.user._id });
        res.status(201).json({ client });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true,
        });
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
