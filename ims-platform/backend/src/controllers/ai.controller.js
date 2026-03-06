const AIService = require('../services/ai.service');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Leave = require('../models/Leave');
const { Job, Application } = require('../models/Job');
const Attendance = require('../models/Attendance');

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
