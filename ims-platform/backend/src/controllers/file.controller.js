'use strict';

const Document = require('../models/Document');
const { deleteFromCloudinary } = require('../config/cloudinary');

exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.cloudinaryResult) {
            return res.status(400).json({ error: 'File upload failed — Cloudinary not configured' });
        }
        const { name, folder = 'general', relatedId, relatedModel, description } = req.body;
        const doc = await Document.create({
            name: name || req.file.originalname,
            cloudinaryUrl: req.cloudinaryResult.secure_url,
            cloudinaryPublicId: req.cloudinaryResult.public_id,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            folder,
            uploadedBy: req.user._id,
            relatedId: relatedId || null,
            relatedModel: relatedModel || '',
            description: description || '',
        });
        res.status(201).json({ document: doc, url: doc.cloudinaryUrl });
    } catch (err) { next(err); }
};

exports.getFiles = async (req, res, next) => {
    try {
        const { folder, relatedId } = req.query;
        const query = {};
        if (folder) query.folder = folder;
        if (relatedId) query.relatedId = relatedId;
        const files = await Document.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 }).lean();
        res.json({ files });
    } catch (err) { next(err); }
};

exports.deleteFile = async (req, res, next) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'File not found' });
        await deleteFromCloudinary(doc.cloudinaryPublicId, doc.fileType.startsWith('image') ? 'image' : 'raw');
        await Document.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        res.json({ message: 'File deleted from Cloudinary and database' });
    } catch (err) { next(err); }
};
