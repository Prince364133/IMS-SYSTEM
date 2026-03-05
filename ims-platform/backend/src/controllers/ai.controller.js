'use strict';

const { GoogleGenAI } = require('@google/genai');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Initialize the API only if the key is present
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy-key' });

exports.getDashboardInsights = async (req, res, next) => {
    try {
        // Return mock data directly for demo purposes
        return res.json({
            insight: "DEMO AI INSIGHT: Instaura IMS is currently operating smoothly. Project velocity remains high with multiple concurrent developments on track. Keep an eye on overdue tasks, but overall organizational health is optimal."
        });
    } catch (err) {
        next(err);
    }
};

exports.getProjectInsights = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        return res.json({
            insight: `DEMO PROJECT RISK ANALYSIS for ${project.name}: The project is progressing well. No major risks identified right now, although certain flexible deadlines should be monitored closely to ensure on-time delivery.`
        });
    } catch (err) {
        next(err);
    }
};
