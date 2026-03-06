'use strict';

const Document = require('../models/Document');
const { deleteFromCloudinary } = require('../config/cloudinary');
const googleDriveService = require('../services/google-drive.service');

exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.storageResult) {
            return res.status(400).json({ error: 'File upload failed — Storage not configured' });
        }
        let taggedUsers = [];
        try {
            if (req.body.taggedUsers) {
                taggedUsers = typeof req.body.taggedUsers === 'string' ? JSON.parse(req.body.taggedUsers) : req.body.taggedUsers;
            }
        } catch (e) {
            console.error('Error parsing taggedUsers in uploadFile:', e);
            // Optionally, handle the error more gracefully, e.g., return an error response
            // For now, we'll proceed with an empty taggedUsers array if parsing fails
        }
        const { name, folder = 'general', relatedId, relatedModel, description } = req.body;
        const doc = await Document.create({
            name: name || req.file.originalname,
            fileUrl: req.storageResult.fileUrl,
            fileId: req.storageResult.fileId,
            storageType: req.storageResult.storageType,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            folder,
            uploadedBy: req.user._id,
            relatedId: relatedId || null,
            relatedModel: relatedModel || '',
            description: description || '',
            isLinkOnly: false
        });
        const storageMsg = req.storageResult.isFallback
            ? `NOTE: Cloud storage unavailable. File stored securely on local system: ${req.storageResult.fileId}`
            : `File stored successfully on ${req.storageResult.storageType === 'google_drive' ? 'Google Drive' : 'Cloudinary'}`;

        res.status(201).json({
            document: doc,
            url: doc.fileUrl,
            message: storageMsg
        });
    } catch (err) { next(err); }
};

exports.addFileLink = async (req, res, next) => {
    try {
        const { name, fileUrl, folder = 'general', relatedId, relatedModel, description } = req.body;
        if (!fileUrl) return res.status(400).json({ error: 'File URL is required' });

        const doc = await Document.create({
            name,
            fileUrl,
            fileId: '', // No ID for external links usually
            storageType: 'external',
            fileType: 'link',
            fileSize: 0,
            folder,
            uploadedBy: req.user._id,
            relatedId: relatedId || null,
            relatedModel: relatedModel || '',
            description: description || '',
            isLinkOnly: true
        });
        res.status(201).json({ document: doc });
    } catch (err) { next(err); }
};

exports.getFiles = async (req, res, next) => {
    try {
        const { folder, relatedId, relatedModel } = req.query;
        const query = {};
        if (folder) query.folder = folder;
        if (relatedId) query.relatedId = relatedId;
        if (relatedModel) query.relatedModel = relatedModel;
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

        if (doc.storageType === 'cloudinary') {
            await deleteFromCloudinary(doc.fileId, doc.fileType.startsWith('image') ? 'image' : 'raw');
        } else if (doc.storageType === 'google_drive') {
            try {
                await googleDriveService.deleteFile(doc.fileId);
            } catch (err) {
                console.warn('Failed to delete from Google Drive:', err.message);
            }
        }

        await Document.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        res.json({ message: 'File deleted successfully' });
    } catch (err) { next(err); }
};
