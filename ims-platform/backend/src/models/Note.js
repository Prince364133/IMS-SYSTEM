'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        content: { type: String, required: [true, 'Note content is required'] },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
