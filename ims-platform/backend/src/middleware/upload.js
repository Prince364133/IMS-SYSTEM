'use strict';

const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');

// In-memory storage — we immediately upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${file.mimetype}' not allowed`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
});

/**
 * Express middleware to upload req.file to Cloudinary.
 * Attaches result to req.cloudinaryResult.
 * @param {string} folder - Cloudinary folder (employees|projects|contracts|reports|general)
 */
function uploadToCloud(folder = 'general') {
    return async (req, res, next) => {
        if (!req.file) return next();
        try {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: `ims/${folder}`,
                resourceType: req.file.mimetype.startsWith('image') ? 'image' : 'raw',
            });
            req.cloudinaryResult = result;
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = { upload, uploadToCloud };
