const AIService = require('../services/ai.service');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Leave = require('../models/Leave');
const { Job, Application } = require('../models/Job');
const Attendance = require('../models/Attendance');
const Document = require('../models/Document');
const googleDriveService = require('../services/google-drive.service');
const axios = require('axios');

exports.getDashboardInsights = async (req, res, next) => {
    try {
        const [projectCount, taskCount, overdueCount] = await Promise.all([
            Project.countDocuments({ status: { $ne: 'completed' } }),
            Task.countDocuments({ status: { $ne: 'done' } }),
            Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'done' } })
        ]);

        const prompt = `Analyze organizational health. 
Active Projects: ${projectCount}
Pending Tasks: ${taskCount}
Overdue Items: ${overdueCount}
Provide a brief, professional organizational health summary (2-3 sentences). Focus on efficiency and urgency.`;

        const insight = await AIService.getInsights(prompt);
        return res.json({ insight });
    } catch (err) {
        next(err);
    }
};

exports.getProjectInsights = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const prompt = `Analyze project risks and progress for project "${project.name}". Description: ${project.description || 'N/A'}. Status: ${project.status}. Provide a concise 2-sentence risk analysis.`;
        const insight = await AIService.getInsights(prompt);
        return res.json({ insight });
    } catch (err) {
        next(err);
    }
};

exports.chatWithAI = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        const user = req.user;

        // Gather system context
        let contextText = `System Context:\n`;
        contextText += `Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        contextText += `User Name: ${user.name}, Role: ${user.role}, Department: ${user.department || 'N/A'}\n\n`;

        // Role-based data gathering
        if (['admin', 'hr', 'manager'].includes(user.role)) {
            const [
                empCount, activeProjects, pendingTasks,
                openJobs, pendingCandidates, pendingLeaves, unpaidInvoices
            ] = await Promise.all([
                User.countDocuments({ isActive: true }),
                Project.countDocuments({ status: { $ne: 'completed' } }),
                Task.countDocuments({ status: { $ne: 'done' } }),
                Job.countDocuments({ status: 'open' }),
                Application.countDocuments({ status: { $in: ['applied', 'screening', 'interview'] } }),
                Leave.countDocuments({ status: 'pending' }),
                Invoice.countDocuments({ status: { $in: ['sent', 'overdue'] } })
            ]);
            contextText += `Company Overview:\n- Total Active Employees: ${empCount}\n- Active Projects: ${activeProjects}\n- Pending/In-Progress Tasks: ${pendingTasks}\n- Open Jobs: ${openJobs} (with ${pendingCandidates} pending candidates)\n- Pending Leave Requests: ${pendingLeaves}\n- Unpaid Invoices: ${unpaidInvoices}\n\n`;
        } else {
            const todayStr = new Date().toISOString().slice(0, 10);
            const [
                myTasks, myProjects, myLeaves, myAttendance
            ] = await Promise.all([
                Task.countDocuments({ assignees: user._id, status: { $ne: 'done' } }),
                Project.countDocuments({ members: user._id, status: { $ne: 'completed' } }),
                Leave.countDocuments({ employeeId: user._id, status: 'pending' }),
                Attendance.findOne({ employeeId: user._id, date: todayStr })
            ]);
            const attStatus = myAttendance ? myAttendance.status : 'Not marked yet';
            contextText += `Your Current Status:\n- Your Pending Tasks: ${myTasks}\n- Your Active Projects: ${myProjects}\n- Your Pending Leave Requests: ${myLeaves}\n- Your Attendance Today: ${attStatus}\n\n`;
        }

        contextText += `Instructions: You are the helpful AI Assistant for this company. You have access to real-time company data as shown above. Use the provided context to answer the user accurately. Keep your responses structured, professional, yet friendly. Format with Markdown. If the user asks about system specifics not in the context, answer generally and mention you only have summarized stats right now.\n\n`;

        let chatHistory = "Recent Conversation:\n";
        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-5);
            recentHistory.forEach(msg => {
                chatHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
        }

        const finalPrompt = `${contextText}\n${chatHistory}\nUser: ${message}\nAssistant:`;

        const reply = await AIService.getInsights(finalPrompt);
        return res.json({ reply });
    } catch (err) {
        next(err);
    }
};

exports.analyzeDocument = async (req, res, next) => {
    try {
        const { documentId, message, summarizeOnly } = req.body;
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        let content = "";

        if (doc.storageType === 'google_drive') {
            try {
                content = await googleDriveService.getFileContent(doc.fileId);
            } catch (err) {
                console.warn('Failed to fetch from Drive, falling back to summary of meta:', err.message);
                content = `Document Name: ${doc.name}\nDescription: ${doc.description || 'None'}`;
            }
        } else if (doc.fileUrl && (doc.fileUrl.endsWith('.html') || doc.fileType === 'link')) {
            try {
                // If it's a web link or uploaded HTML, try to fetch it
                const response = await axios.get(doc.fileUrl);
                content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
                // Strip HTML tags for cleaner AI input
                content = content.replace(/<[^>]*>?/gm, ' ').slice(0, 10000);
            } catch (err) {
                content = `Document Name: ${doc.name}\nDescription: ${doc.description || 'None'}`;
            }
        } else {
            content = `Document Name: ${doc.name}\nDescription: ${doc.description || 'None'}\nType: ${doc.fileType}`;
        }

        const prompt = summarizeOnly
            ? `Please provide a concise, professional summary (3-5 bullet points) of the following document content:\n\n${content}`
            : `You are a document assistant. Based on the following document content, answer the user's question accurately.\n\nDOCUMENT CONTENT:\n${content}\n\nUSER QUESTION: ${message}`;

        const reply = await AIService.getInsights(prompt);
        return res.json({ reply });
    } catch (err) {
        next(err);
    }
};

exports.generateEmailDraft = async (req, res, next) => {
    try {
        const { idea, recipientName, tone = 'professional', context = '' } = req.body;

        const prompt = `You are an expert business communicator and professional email writer. 
Your goal is to draft a high-quality email based on the user's requirements.

RECIPIENT: ${recipientName || 'Valued Recipient'}
TONE: ${tone}
CONTEXT/GOAL: ${idea}
ADDITIONAL CONTEXT: ${context}

Draft the email with a clear subject line and a professional body. Use [Placeholder] for any missing info. No extra talk, just the email draft.`;

        const draft = await AIService.getInsights(prompt);
        return res.json({ draft });
    } catch (err) {
        next(err);
    }
};
