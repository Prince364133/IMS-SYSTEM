'use strict';

const Client = require('../models/Client');
const { logAction } = require('../middleware/audit');
const { triggerN8nWebhook } = require('../routes/webhook.routes');

exports.getClients = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (search) query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
        const skip = (Number(page) - 1) * Number(limit);
        const [clients, total] = await Promise.all([
            Client.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }).lean(),
            Client.countDocuments(query),
        ]);
        res.json({ clients, total });
    } catch (err) { next(err); }
};

exports.createClient = async (req, res, next) => {
    try {
        const client = await Client.create(req.body);
        await logAction(req.user._id, 'CREATE_CLIENT', 'client', client._id, { name: client.name }, req);

        // Trigger n8n automation for new client onboarding
        await triggerN8nWebhook('new-client', {
            clientId: client._id,
            name: client.name,
            company: client.company,
            email: client.email
        });

        res.status(201).json({ client });
    } catch (err) { next(err); }
};

exports.getClientById = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('projectIds', 'name status priority deadline progress').lean();
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) { next(err); }
};

exports.updateClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) { next(err); }
};

exports.deleteClient = async (req, res, next) => {
    try {
        await Client.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        await logAction(req.user._id, 'DELETE_CLIENT', 'client', req.params.id, {}, req);
        res.json({ message: 'Client deleted' });
    } catch (err) { next(err); }
};
