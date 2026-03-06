'use strict';

const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const googleDriveService = require('../services/google-drive.service');
const Settings = require('../models/Settings');
const fs = require('fs');
const path = require('path');

// In-memory storage — we primarily upload to cloud
const storage = multer.memoryStorage();

// Disk storage for fallback
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
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
    },
});

function handleUpload(folder = 'general') {
    return async (req, res, next) => {
        if (!req.file) return next();

        try {
            const settings = await Settings.findOne({}).lean();
            const preferredMode = settings?.storageMode || 'google_drive'; // Default to Google Drive as requested

            let result = null;
            let errorOccurred = false;

            // Attempt Preferred Storage
            if (preferredMode === 'google_drive') {
                try {
                    const driveResult = await googleDriveService.uploadFile(req.file.buffer, {
                        name: req.file.originalname,
                        mimeType: req.file.mimetype,
                    });
                    result = {
                        fileUrl: driveResult.webViewLink || driveResult.webContentLink,
                        fileId: driveResult.id,
                        storageType: 'google_drive'
                    };
                } catch (err) {
                    console.warn('Google Drive upload failed, trying fallback:', err.message);
                    errorOccurred = true;
                }
            } else if (preferredMode === 'cloudinary') {
                try {
                    const cloudResult = await uploadToCloudinary(req.file.buffer, {
                        folder: `ims/${folder}`,
                        resourceType: req.file.mimetype.startsWith('image') ? 'image' : 'raw',
                    });
                    result = {
                        fileUrl: cloudResult.secure_url,
                        fileId: cloudResult.public_id,
                        storageType: 'cloudinary'
                    };
                } catch (err) {
                    console.warn('Cloudinary upload failed, trying fallback:', err.message);
                    errorOccurred = true;
                }
            }

            // Fallback to Local Storage if preferred failed or not configured
            if (!result) {
                const uploadDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const fileName = uniqueSuffix + '-' + req.file.originalname;
                const filePath = path.join(uploadDir, fileName);

                fs.writeFileSync(filePath, req.file.buffer);

                const protocol = req.protocol;
                const host = req.get('host');
                const fileUrl = `${protocol}://${host}/uploads/${fileName}`;

                result = {
                    fileUrl,
                    fileId: fileName,
                    storageType: 'local',
                    isFallback: true,
                    localPath: filePath
                };
            }

            req.storageResult = result;
            next();
        } catch (err) {
            console.error('Upload middleware error:', err);
            next(err);
        }
    };
}

module.exports = { upload, handleUpload };
