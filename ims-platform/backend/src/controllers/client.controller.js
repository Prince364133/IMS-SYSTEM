'use strict';

const { logAction } = require('../middleware/audit');
const { triggerN8nWebhook } = require('../routes/webhook.routes');
const AutomationService = require('../services/automation.service');

exports.getClients = async (req, res, next) => {
    try {
        const Client = req.tenantDb.model('Client');
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
        const Client = req.tenantDb.model('Client');
        if (!req.body.clientId) {
            const count = await Client.countDocuments();
            req.body.clientId = `CLT-${String(count + 1).padStart(4, '0')}`;
        }
        const client = await Client.create(req.body);
        await logAction(req.user._id, 'CREATE_CLIENT', 'client', client._id, { name: client.name }, req);

        // Trigger Automation for new client
        await AutomationService.trigger({
            eventType: 'client_created',
            triggeredBy: req.user._id,
            targetUser: client._id,
            relatedItem: { itemId: client._id, itemModel: 'Client' },
            description: `New client account created for ${client.name} (${client.company})`,
            metadata: { clientName: client.name, company: client.company }
        });

        // Trigger n8n automation for new client onboarding (Optional/Legacy)
        await triggerN8nWebhook('new-client', {
            clientId: client._id,
            name: client.name,
            company: client.company,
            email: client.email
        }).catch(() => { });

        res.status(201).json({ client });
    } catch (err) { next(err); }
};

exports.getClientById = async (req, res, next) => {
    try {
        const Client = req.tenantDb.model('Client');
        const client = await Client.findById(req.params.id)
            .populate('projectIds', 'name status priority deadline progress').lean();
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) { next(err); }
};

exports.updateClient = async (req, res, next) => {
    try {
        const Client = req.tenantDb.model('Client');
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json({ client });
    } catch (err) { next(err); }
};

exports.deleteClient = async (req, res, next) => {
    try {
        const Client = req.tenantDb.model('Client');
        await Client.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        await logAction(req.user._id, 'DELETE_CLIENT', 'client', req.params.id, {}, req);
        res.json({ message: 'Client deleted' });
    } catch (err) { next(err); }
};
