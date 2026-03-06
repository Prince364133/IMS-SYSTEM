'use strict';

const cron = require('node-cron');
const AutomationService = require('./automation.service');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const Meeting = require('../models/CalendarEvent');
const mongoose = require('mongoose');
const AIAutomationService = require('./ai-automation.service');

/**
 * Cron Service - Handles all scheduled tasks
 */
class CronService {
    init() {
        console.info('Initializing Cron Service...');

        // 1. Every Hour: Check for approaching deadlines (Projects & Tasks)
        cron.schedule('0 * * * *', () => this.checkDeadlines());

        // 2. Daily at 23:55: Mark Absences for employees who didn't login
        cron.schedule('55 23 * * *', () => this.dailyAttendanceCheck());

        // 3. 1st of every month at 00:05: Generate Salaries (Drafts)
        cron.schedule('5 0 1 * *', () => this.monthlySalaryGeneration());

        // 4. Every 15 minutes: Check for upcoming meetings in next 30 minutes
        cron.schedule('*/15 * * * *', () => this.meetingReminders());

        // 5. Daily at 01:00: Run AI Risk Analysis for all active projects
        cron.schedule('0 1 * * *', () => this.runProjectRiskAnalysis());

        // 6. Daily at 10:30: Check for late attendance (assuming shift starts at 09:30)
        cron.schedule('30 10 * * *', () => this.lateAttendanceCheck());

        console.info('Cron Jobs Scheduled Successfully.');
    }

    /**
     * Check for projects and tasks with deadlines in the next 24 hours
     */
    async checkDeadlines() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Project Deadlines
        const projects = await Project.find({
            dueDate: { $lte: tomorrow, $gt: new Date() },
            status: { $ne: 'Completed' }
        }).populate('members');

        for (const project of projects) {
            for (const member of project.members) {
                await AutomationService.trigger({
                    eventType: 'project_deadline',
                    targetUser: member._id,
                    relatedItem: { itemId: project._id, itemModel: 'Project' },
                    description: `Deadline approaching for project: ${project.name}`,
                    metadata: { projectName: project.name, dueDate: project.dueDate }
                });
            }
        }

        // Task Deadlines
        const tasks = await Task.find({
            dueDate: { $lte: tomorrow, $gt: new Date() },
            status: { $ne: 'Completed' }
        }).populate('assignedTo');

        for (const task of tasks) {
            if (task.assignedTo) {
                await AutomationService.trigger({
                    eventType: 'task_reminder',
                    targetUser: task.assignedTo._id,
                    relatedItem: { itemId: task._id, itemModel: 'Task' },
                    description: `Task "${task.title}" is due soon.`,
                    metadata: { taskName: task.title, dueDate: task.dueDate }
                });
            }
        }
    }

    /**
     * Mark users as absent if no attendance record exists for today
     */
    async dailyAttendanceCheck() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const employees = await User.find({ role: 'employee', status: 'active' });

        for (const emp of employees) {
            const attendance = await Attendance.findOne({
                user: emp._id,
                date: { $gte: today }
            });

            if (!attendance) {
                await Attendance.create({
                    user: emp._id,
                    date: today,
                    status: 'absent'
                });

                await AutomationService.trigger({
                    eventType: 'attendance_absence',
                    targetUser: emp._id,
                    description: `You were marked absent for ${today.toDateString()}.`,
                    metadata: { date: today }
                });
            }
        }
    }

    /**
     * Auto-generate Monthly Salary Drafts
     */
    async monthlySalaryGeneration() {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        const employees = await User.find({ role: 'employee', status: 'active' });

        for (const emp of employees) {
            // Logic to calculate working days, deductions etc would go here
            // For now, we create a draft salary record
            const salary = await Salary.create({
                user: emp._id,
                month: monthName,
                amount: emp.salary || 0,
                status: 'pending'
            });

            await AutomationService.trigger({
                eventType: 'salary_generated',
                targetUser: emp._id,
                relatedItem: { itemId: salary._id, itemModel: 'Salary' },
                description: `Your salary slip for ${monthName} has been generated.`,
                metadata: { month: monthName, amount: emp.salary }
            });
        }
    }

    /**
     * Run AI Risk Analysis for all active projects
     */
    async runProjectRiskAnalysis() {
        console.info('Running AI Project Risk Analysis...');
        const activeProjects = await Project.find({ status: { $in: ['In Progress', 'On Hold'] } });

        for (const project of activeProjects) {
            const tasks = await Task.find({ projectId: project._id }).select('status dueDate').lean();
            if (tasks.length === 0) continue;

            try {
                const aiResult = await AIAutomationService.predictProjectRisk(tasks);
                if (aiResult.risk === 'High' || aiResult.risk === 'Medium') {
                    // Notify project manager/admin
                    await AutomationService.trigger({
                        eventType: 'project_risk_alert',
                        relatedItem: { itemId: project._id, itemModel: 'Project' },
                        description: `Risk identified for project "${project.name}": ${aiResult.risk} level.`,
                        metadata: { projectName: project.name, riskLevel: aiResult.risk }
                    });
                }
            } catch (e) {
                console.error(`Risk analysis failed for project ${project._id}:`, e.message);
            }
        }
    }

    /**
     * Notify users who haven't checked in by 10:30 AM
     */
    async lateAttendanceCheck() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const employees = await User.find({ role: 'employee', status: 'active' });

        for (const emp of employees) {
            const attendance = await Attendance.findOne({
                user: emp._id,
                date: { $gte: today }
            });

            if (!attendance) {
                await AutomationService.trigger({
                    eventType: 'attendance_late',
                    targetUser: emp._id,
                    description: `Reminder: You haven't checked in for today yet.`,
                    metadata: { currentTime: new Date().toLocaleTimeString() }
                });
            }
        }
    }
}

module.exports = new CronService();
