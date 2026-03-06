const Settings = require('../models/Settings');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');
const Goal = require('../models/Goal');
const Job = require('../models/Job');
const Application = require('../models/Onboarding');
const CalendarEvent = require('../models/CalendarEvent');
const InventoryTransaction = require('../models/InventoryTransaction');
const Milestone = require('../models/Milestone');
const Review = require('../models/Review');

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Auto-create initial settings if they don't exist yet
        if (!settings) {
            settings = await Settings.create({
                companyName: 'Internal Management System',
                logoUrl: '',
                themeColor: '#4f46e5',
            });
        }

        // Inject obscured Mongo URI for admin to view
        let mongoUriDisplay = 'Not Configured';
        if (process.env.MONGO_URI) {
            mongoUriDisplay = process.env.MONGO_URI.replace(/:([^:@]+)@/, ':********@');
        }

        const responseSettings = settings.toObject();
        responseSettings.mongoUriDisplay = mongoUriDisplay;

        res.json({ settings: responseSettings });
    } catch (error) {
        console.error('Get Settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update platform settings' });
        }

        const {
            companyName, logoUrl, themeColor, webhookUrl, webhookSecret,
            smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom,
            aiProvider, openaiKey, groqKey, geminiKey,
            storageMode, googleDriveServiceAccount, googleDriveFolderId
        } = req.body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (companyName !== undefined) settings.companyName = companyName;
        if (logoUrl !== undefined) settings.logoUrl = logoUrl;
        if (themeColor !== undefined) settings.themeColor = themeColor;
        if (webhookUrl !== undefined) settings.webhookUrl = webhookUrl;
        if (webhookSecret !== undefined) settings.webhookSecret = webhookSecret;

        // SMTP Settings
        if (smtpHost !== undefined) settings.smtpHost = smtpHost;
        if (smtpPort !== undefined) settings.smtpPort = smtpPort;
        if (smtpUser !== undefined) settings.smtpUser = smtpUser;
        if (smtpPass !== undefined) settings.smtpPass = smtpPass;
        if (smtpSecure !== undefined) settings.smtpSecure = smtpSecure;
        if (emailFrom !== undefined) settings.emailFrom = emailFrom;

        // AI Settings
        if (aiProvider !== undefined) settings.aiProvider = aiProvider;
        if (openaiKey !== undefined) settings.openaiKey = openaiKey;
        if (groqKey !== undefined) settings.groqKey = groqKey;
        if (geminiKey !== undefined) settings.geminiKey = geminiKey;

        // Storage Settings
        if (storageMode !== undefined) settings.storageMode = storageMode;
        if (googleDriveServiceAccount !== undefined) settings.googleDriveServiceAccount = googleDriveServiceAccount;
        if (googleDriveFolderId !== undefined) settings.googleDriveFolderId = googleDriveFolderId;

        await settings.save();
        res.json({ settings, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update Settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

exports.testAiConnection = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can test AI connection' });
        }

        const settings = await Settings.findOne();
        if (!settings || !settings.aiProvider || settings.aiProvider === 'none') {
            return res.status(400).json({ error: 'AI provider is not selected' });
        }

        const provider = settings.aiProvider;
        let testSuccess = false;

        if (provider === 'gemini') {
            if (!settings.geminiKey) throw new Error('Gemini API Key missing');
            const { GoogleGenAI } = require('@google/genai');
            const genAI = new GoogleGenAI(settings.geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Say 'Connection Successful'");
            if (result.response.text()) testSuccess = true;
        } else if (provider === 'openai') {
            if (!settings.openaiKey) throw new Error('OpenAI API Key missing');
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: settings.openaiKey });
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: "Say 'Connection Successful'" }],
                model: "gpt-3.5-turbo",
            });
            if (completion.choices[0].message.content) testSuccess = true;
        } else if (provider === 'groq') {
            if (!settings.groqKey) throw new Error('Groq API Key missing');
            const Groq = require('groq-sdk');
            const groq = new Groq({ apiKey: settings.groqKey });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Say 'Connection Successful'" }],
                model: "llama3-8b-8192",
            });
            if (completion.choices[0].message.content) testSuccess = true;
        }

        if (testSuccess) {
            settings.lastAiTestStatus = 'success';
            settings.lastAiTestDate = new Date();
            settings.lastAiTestError = null;
            await settings.save();
            res.json({ message: `${provider.toUpperCase()} connection successful!`, settings });
        } else {
            throw new Error('Test failed to return a response');
        }
    } catch (error) {
        console.error('AI connection test failed:', error);
        const settings = await Settings.findOne();
        if (settings) {
            settings.lastAiTestStatus = 'failure';
            settings.lastAiTestDate = new Date();
            settings.lastAiTestError = error.message;
            await settings.save();
        }
        res.status(500).json({ error: 'AI connection test failed', details: error.message });
    }
};

exports.testEmailConnection = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can test email connection' });
        }

        const settings = await Settings.findOne();
        if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
            return res.status(400).json({ error: 'SMTP settings are not fully configured' });
        }

        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpSecure,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
        });

        await transporter.verify();

        await transporter.sendMail({
            from: settings.emailFrom,
            to: settings.smtpUser,
            subject: 'Internal Management System - SMTP Connection Test',
            text: `Connection test successful! Date: ${new Date().toLocaleString()}`,
            html: `<h3>Connection successful!</h3><p>Your SMTP settings are correctly configured for <b>Internal Management System</b>.</p><p>Tested on: ${new Date().toLocaleString()}</p>`,
        });

        settings.lastEmailTestStatus = 'success';
        settings.lastEmailTestDate = new Date();
        settings.lastEmailTestError = null;
        await settings.save();

        res.json({ message: 'Test email sent successfully! Please check your inbox.', settings });
    } catch (error) {
        console.error('Email connection test failed:', error);

        const settings = await Settings.findOne();
        if (settings) {
            settings.lastEmailTestStatus = 'failure';
            settings.lastEmailTestDate = new Date();
            settings.lastEmailTestError = error.message;
            await settings.save();
        }

        res.status(500).json({
            error: 'Email connection test failed',
            details: error.message
        });
    }
};

exports.testStorageConnection = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can test storage connection' });
        }

        const settings = await Settings.findOne();
        if (!settings || settings.storageMode === 'local') {
            return res.status(400).json({ error: 'Storage mode is set to local or not configured' });
        }

        if (settings.storageMode === 'google_drive') {
            const googleDriveService = require('../services/google-drive.service');
            await googleDriveService.testConnection();

            settings.lastStorageTestStatus = 'success';
            settings.lastStorageTestDate = new Date();
            settings.lastStorageTestError = null;
            await settings.save();

            return res.json({ message: 'Google Drive connection successful!', settings });
        }

        if (settings.storageMode === 'cloudinary') {
            const { cloudinary } = require('../config/cloudinary');
            const result = await cloudinary.api.ping();
            if (result.status === 'ok') {
                settings.lastStorageTestStatus = 'success';
                settings.lastStorageTestDate = new Date();
                settings.lastStorageTestError = null;
                await settings.save();
                return res.json({ message: 'Cloudinary connection successful!', settings });
            }
            throw new Error('Cloudinary ping failed');
        }

        res.status(400).json({ error: 'Unsupported storage mode for testing' });
    } catch (error) {
        console.error('Storage connection test failed:', error);
        const settings = await Settings.findOne();
        if (settings) {
            settings.lastStorageTestStatus = 'failure';
            settings.lastStorageTestDate = new Date();
            settings.lastStorageTestError = error.message;
            await settings.save();
        }
        res.status(500).json({ error: 'Storage connection test failed', details: error.message });
    }
};

exports.clearDatabase = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can perform this action' });
        }

        const { password, startDate, endDate, clearAll } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Administrator password is required' });
        }

        // Verify password
        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid administrator password' });
        }

        const modelsToClear = [
            Attendance, AuditLog, Task, Project, Client, Expense, Salary,
            Leave, Notification, Chat, Document, TimeLog, Invoice, Goal,
            Job, Application, CalendarEvent, InventoryTransaction, Milestone, Review
        ];

        let query = {};
        if (!clearAll) {
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and end date are required for range deletion' });
            }
            query = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const results = {};
        for (const model of modelsToClear) {
            const result = await model.deleteMany(query);
            results[model.modelName] = result.deletedCount;
        }

        // Log the nuclear action in a new audit log
        await AuditLog.create({
            userId: req.user._id,
            action: 'CLEAR_DATABASE',
            title: 'Bulk Data Deletion',
            message: `Admin cleared ${clearAll ? 'all' : 'range-based'} system data. Result: ${JSON.stringify(results)}`,
            ipAddress: req.ip
        });

        res.json({
            message: `Successfully deleted system data ${clearAll ? 'completely' : 'in the selected range'}.`,
            results
        });

    } catch (error) {
        console.error('Clear database error:', error);
        res.status(500).json({ error: 'Critical failure during data deletion' });
    }
};
