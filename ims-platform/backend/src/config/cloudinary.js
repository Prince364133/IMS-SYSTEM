'use strict';

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('✅ Cloudinary configured');
} else {
    console.warn('⚠️  Cloudinary credentials not set — file uploads will fail');
}

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {Object} options - { folder, resourceType }
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadToCloudinary(buffer, options = {}) {
    const { folder = 'ims', resourceType = 'auto' } = options;
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType, quality: 'auto', fetch_format: 'auto' },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

/**
 * Delete a file from Cloudinary by public_id
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
