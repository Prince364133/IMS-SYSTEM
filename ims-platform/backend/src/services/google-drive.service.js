'use strict';

const { google } = require('googleapis');
const { Readable } = require('stream');
const Settings = require('../models/Settings');

class GoogleDriveService {
    constructor() {
        this.drive = null;
    }

    async #init() {
        try {
            const settings = await Settings.findOne({}).lean();
            if (!settings || !settings.googleDriveServiceAccount) {
                throw new Error('Google Drive service account credentials not configured in settings');
            }

            const credentials = JSON.parse(settings.googleDriveServiceAccount);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            this.drive = google.drive({ version: 'v3', auth });
            this.folderId = settings.googleDriveFolderId;
        } catch (err) {
            console.error('Failed to initialize Google Drive Service:', err);
            throw err;
        }
    }

    /**
     * Upload a file buffer to Google Drive
     * @param {Buffer} buffer 
     * @param {Object} fileMeta - { name, mimeType }
     * @returns {Promise<Object>} - { fileId, webContentLink, webViewLink }
     */
    async uploadFile(buffer, fileMeta) {
        if (!this.drive) await this.#init();

        const fileMetadata = {
            name: fileMeta.name,
            parents: this.folderId ? [this.folderId] : [],
        };

        const media = {
            mimeType: fileMeta.mimeType,
            body: Readable.from(buffer),
        };

        const response = await this.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webContentLink, webViewLink',
        });

        // Make file readable to anyone with the link (optional but recommended for easy viewing)
        try {
            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
        } catch (err) {
            console.warn('Failed to set public permissions for file:', err.message);
        }

        return response.data;
    }

    /**
     * Delete a file from Google Drive
     * @param {string} fileId 
     */
    async deleteFile(fileId) {
        if (!this.drive) await this.#init();
        await this.drive.files.delete({ fileId });
    }

    /**
     * Test connection to Google Drive
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            if (!this.drive) await this.#init();
            await this.drive.files.list({ pageSize: 1 });
            return true;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new GoogleDriveService();
