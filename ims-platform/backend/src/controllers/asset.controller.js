const Asset = require('../models/Asset');
const User = require('../models/User');

// GET all assets with filtering
exports.getAssets = async (req, res, next) => {
    try {
        const { type, status, search } = req.query;
        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { provider: { $regex: search, $options: 'i' } }
            ];
        }

        const assets = await Asset.find(query)
            .populate('owner', 'name')
            .sort('-createdAt');

        res.json({ assets });
    } catch (err) { next(err); }
};

// GET asset stats for dashboard
exports.getAssetStats = async (req, res, next) => {
    try {
        const stats = await Asset.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalCost: { $sum: '$cost' }
                }
            }
        ]);

        const activeIntegrationsCount = await Asset.countDocuments({
            type: { $in: ['api', 'service'] },
            status: 'active'
        });

        res.json({ stats, activeIntegrationsCount });
    } catch (err) { next(err); }
};

// GET single asset
exports.getAssetById = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('owner', 'name');
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        res.json({ asset });
    } catch (err) { next(err); }
};

// CREATE asset
exports.createAsset = async (req, res, next) => {
    try {
        const asset = await Asset.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json({ asset });
    } catch (err) { next(err); }
};

// UPDATE asset
exports.updateAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        res.json({ asset });
    } catch (err) { next(err); }
};

// DELETE asset
exports.deleteAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (err) { next(err); }
};
