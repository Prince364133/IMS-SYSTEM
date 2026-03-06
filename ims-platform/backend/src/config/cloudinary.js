'use strict';

const cloudinary = require('cloudinary').v2;

/**
 * Configure cloudinary with provided credentials or env fallback
 */
function configureCloudinary(config = {}) {
    cloudinary.config({
        cloud_name: config.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
        api_key: config.apiKey || process.env.CLOUDINARY_API_KEY,
        api_secret: config.apiSecret || process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    return cloudinary;
}

// Initial config with env fallback
configureCloudinary();

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {Object} options - { folder, resourceType, config }
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadToCloudinary(buffer, options = {}) {
    const { folder = 'ims', resourceType = 'auto', config = {} } = options;

    // Ensure we are using the latest config if provided
    const instance = config.cloudName ? configureCloudinary(config) : cloudinary;

    return new Promise((resolve, reject) => {
        const stream = instance.uploader.upload_stream(
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
async function deleteFromCloudinary(publicId, resourceType = 'image', config = {}) {
    const instance = config.cloudName ? configureCloudinary(config) : cloudinary;
    return instance.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { cloudinary, configureCloudinary, uploadToCloudinary, deleteFromCloudinary };
