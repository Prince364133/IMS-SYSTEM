require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const CompanyConfig = require('./src/models/CompanyConfig');
const CronService = require('./src/services/cron.service');
const Salary = require('./src/models/Salary');
const EmailService = require('./src/services/email.service');
const ctrl = require('./src/controllers/salary.controller');


async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to DB');

        // Clear existing salaries for the test month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        await Salary.deleteMany({ month: monthName });
        console.log(`Cleared existing salaries for ${monthName}`);

        // Set Release Date to today to trigger salary generation
        const company = await CompanyConfig.findOne();
        if (company) {
            const oldDate = company.salaryReleaseDate;
            company.salaryReleaseDate = today.getDate();
            await company.save();
            console.log(`Updated CompanyConfig Release Date to today (${today.getDate()})`);
        }

        console.log('--- Running Cron Salary Generation ---');
        await CronService.monthlySalaryGeneration();

        // Check and verify Drafts
        const drafts = await Salary.find({ month: monthName, status: 'pending' }).populate('employeeId');
        console.log(`Generated ${drafts.length} Pending Salary Drafts.`);

        if (drafts.length > 0) {
            const draft = drafts[0];
            console.log(`Testing HR Approval for draft ID: ${draft._id}`);

            // Mock req, res
            const reqHrApprove = {
                params: { id: draft._id },
                body: { deductions: 50, bonuses: 200, notes: 'Good job!' }
            };
            const resHrApprove = {
                json: (data) => console.log('HR Approve Response:', data),
                status: (code) => ({ json: (data) => console.log(`HTTP ${code}:`, data) })
            };

            await ctrl.hrApproveSalary(reqHrApprove, resHrApprove, (err) => console.error(err));

            const hrApprovedDraft = await Salary.findById(draft._id);
            console.log(`Salary Status after HR Approve: ${hrApprovedDraft.status}`);

            console.log(`Testing Admin Mark Paid for draft ID: ${draft._id}`);
            // Mock req, res
            const reqMarkPaid = { params: { id: draft._id } };
            const resMarkPaid = {
                json: (data) => console.log('Mark Paid Response:', data),
                status: (code) => ({ json: (data) => console.log(`HTTP ${code}:`, data) })
            };

            // Before calling markPaid, let's spy on EmailService
            const oldSend = EmailService.sendEmail;
            EmailService.sendEmail = async (to, sub, type, context) => {
                console.log(`[MOCK EMAIL] Sent to: ${to}, Context:`, context);
            };

            await ctrl.markPaid(reqMarkPaid, resMarkPaid, (err) => console.error(err));

            const paidDraft = await Salary.findById(draft._id);
            console.log(`Final Salary Status: ${paidDraft.status}`);

            // cleanup mock
            EmailService.sendEmail = oldSend;
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB');
    }
}

runTest();
