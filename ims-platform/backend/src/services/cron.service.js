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
const AnalyticsService = require('./analytics.service');
const AIAutomationService = require('./ai-automation.service');
const CompanyConfig = require('../models/CompanyConfig');

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

        // 6. Daily at 10:30: Check for late attendance
        cron.schedule('30 10 * * *', () => this.lateAttendanceCheck());

        // 7. 1st of every month at 01:00: Attendance Pattern Analysis
        cron.schedule('0 1 1 * *', () => this.monthlyAttendancePatternCheck());

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
        }).populate('memberIds');

        for (const project of projects) {
            try {
                for (const memberId of project.memberIds) {
                    await AutomationService.trigger({
                        eventType: 'project_deadline',
                        targetUser: memberId,
                        relatedItem: { itemId: project._id, itemModel: 'Project' },
                        description: `Deadline approaching for project: ${project.name}`,
                        metadata: { projectName: project.name, dueDate: project.dueDate }
                    });
                }
            } catch (err) {
                console.error(`Error processing project deadline for ${project._id}:`, err.message);
            }
        }

        // Task Deadlines
        const tasks = await Task.find({
            dueDate: { $lte: tomorrow, $gt: new Date() },
            status: { $ne: 'Completed' }
        }).populate('assigneeId');

        for (const task of tasks) {
            try {
                if (task.assigneeId) {
                    await AutomationService.trigger({
                        eventType: 'task_reminder',
                        targetUser: task.assigneeId._id,
                        relatedItem: { itemId: task._id, itemModel: 'Task' },
                        description: `Task "${task.title}" is due soon.`,
                        metadata: { taskName: task.title, dueDate: task.dueDate }
                    });
                }

                // Automatic Task Escalation Check
                if (AnalyticsService.shouldEscalateTask(task)) {
                    await AutomationService.trigger({
                        eventType: 'task_escalated',
                        targetUser: task.assigneeId ? task.assigneeId._id : null,
                        description: `URGENT: Task "${task.title}" is past due and has been escalated.`,
                        metadata: { taskName: task.title, status: 'overdue' }
                    });
                    console.log(`Task escalated: ${task.title}`);
                }
            } catch (err) {
                console.error(`Error processing task deadline for ${task._id}:`, err.message);
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
     * Auto-generate Monthly Salary Drafts based on Release Date
     */
    async monthlySalaryGeneration() {
        const today = new Date();
        const config = await CompanyConfig.findOne();
        const releaseDate = config?.salaryReleaseDate || 1;
        const workingDays = config?.workingDaysPerMonth || 22;

        // Only run on the defined release date
        if (today.getDate() !== releaseDate) return;

        // Calculate for previous month
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        const employees = await User.find({ role: 'employee', status: 'active' });

        for (const emp of employees) {
            // Check if already generated
            const existing = await Salary.findOne({ employeeId: emp._id, month: monthName });
            if (existing) continue;

            // Calculate absences
            const absences = await Attendance.countDocuments({
                user: emp._id,
                date: { $gte: lastMonth, $lte: endOfLastMonth },
                status: 'absent'
            });

            const baseSalary = emp.salary || 0;
            const netSalary = AnalyticsService.calculateNetSalary(baseSalary, workingDays, absences, 0, 0, 0);

            const salary = await Salary.create({
                employeeId: emp._id,
                month: monthName,
                baseSalary: baseSalary,
                netSalary: netSalary,
                deductions: 0, // Manual deductions placeholder
                bonuses: 0,
                status: 'pending' // Drafts are pending HR review
            });

            // Notify HR/Admins
            const hrs = await User.find({ role: { $in: ['hr', 'admin'] } }).select('_id');
            for (const hr of hrs) {
                await AutomationService.trigger({
                    eventType: 'salary_generated',
                    targetUser: hr._id,
                    relatedItem: { itemId: salary._id, itemModel: 'Salary' },
                    description: `Salary draft for ${emp.name} (${monthName}) is ready for review.`,
                    metadata: { month: monthName, employeeName: emp.name }
                });
            }
        }
        console.log(`Salary generation completed for ${monthName}`);
    }

    /**
     * Run AI Risk Analysis for all active projects
     */
    async runProjectRiskAnalysis() {
        console.info('Running Algorithmic Project Risk Analysis...');
        const activeProjects = await Project.find({ status: { $in: ['in_progress', 'on_hold'] } });

        for (const project of activeProjects) {
            const tasks = await Task.find({ projectId: project._id }).select('status dueDate').lean();
            if (tasks.length === 0) continue;

            const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
            const delayDays = project.deadline ? Math.max(0, Math.ceil((new Date() - new Date(project.deadline)) / (1000 * 60 * 60 * 24))) : 0;

            // Calculate Risk Score (Suggestion 15)
            const riskScore = AnalyticsService.calculateProjectRiskScore(delayDays, overdueTasks, 1); // 1 = placeholder for load

            if (riskScore > 10) {
                await AutomationService.trigger({
                    eventType: 'project_risk_alert',
                    relatedItem: { itemId: project._id, itemModel: 'Project' },
                    description: `High risk detected for project "${project.name}" (Score: ${riskScore}).`,
                    metadata: { projectName: project.name, riskScore }
                });
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

    /**
     * Monthly Check for Attendance Patterns (Suggestion 6)
     */
    async monthlyAttendancePatternCheck() {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const employees = await User.find({ role: 'employee', status: 'active' });

        for (const emp of employees) {
            const lateCount = await Attendance.countDocuments({
                user: emp._id,
                date: { $gte: firstDayOfMonth },
                status: 'late'
            });

            if (AnalyticsService.isAttendanceIssue(lateCount)) {
                // Send HR Alert
                const hrAdmins = await User.find({ role: 'admin' }).select('_id');
                for (const admin of hrAdmins) {
                    await AutomationService.trigger({
                        eventType: 'attendance_alert',
                        targetUser: admin._id,
                        description: `Attendance Alert: Employee ${emp.name} has ${lateCount} late entries this month.`,
                        metadata: { employeeName: emp.name, lateCount }
                    });
                }
            }
        }
    }
}

module.exports = new CronService();
