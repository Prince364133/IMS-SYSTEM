'use strict';
const mongoose = require('mongoose');

const tenantUserMappingSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

module.exports = mongoose.model('TenantUserMapping', tenantUserMappingSchema);
