'use strict';

require('dotenv').config();

// ─── Sentry must be initialized FIRST ────────────────────────────────────────
const Sentry = require('./src/config/sentry');

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/sockets');
const { initQueues } = require('./src/services/queue.service');
const CronService = require('./src/services/cron.service');
const errorHandler = require('./src/middleware/error');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const projectRoutes = require('./src/routes/project.routes');
const taskRoutes = require('./src/routes/task.routes');
const clientRoutes = require('./src/routes/client.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const hrmsRoutes = require('./src/routes/hrms.routes');
const chatRoutes = require('./src/routes/chat.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const fileRoutes = require('./src/routes/file.routes');
const goalRoutes = require('./src/routes/goal.routes');
const jobRoutes = require('./src/routes/job.routes');
const applicationRoutes = require('./src/routes/application.routes');
const salaryRoutes = require('./src/routes/salary.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const healthRoutes = require('./src/routes/health.routes');
const aiRoutes = require('./src/routes/ai.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const leaveRoutes = require('./src/routes/leave.routes');
const superAdminRoutes = require('./src/routes/superadmin.routes');
const supportRoutes = require('./src/routes/support.routes');
const billingRoutes = require('./src/routes/billing.routes');
const SubscriptionCronService = require('./src/services/subscriptionCron.service');

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error('Not allowed by CORS'));
        }
        : '*',
    credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later.' },
});
app.use(globalLimiter);

// ─── Sentry request handler ───────────────────────────────────────────────────
app.use(Sentry.Handlers.requestHandler());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/public', require('./src/routes/public.routes'));
app.use('/api/emails', require('./src/routes/email.routes'));
app.use('/api/audit', require('./src/routes/audit.routes'));
app.use('/api/calendar', require('./src/routes/calendar.routes'));
app.use('/api/timelogs', require('./src/routes/timelog.routes'));
app.use('/api/expenses', require('./src/routes/expense.routes'));
app.use('/api/invoices', require('./src/routes/invoice.routes'));
app.use('/api/onboarding', require('./src/routes/onboarding.routes'));
app.use('/api/reviews', require('./src/routes/review.routes'));
app.use('/api/milestones', require('./src/routes/milestone.routes'));
app.use('/api/inventory', require('./src/routes/inventory.routes'));
app.use('/api/assets', require('./src/routes/asset.routes'));
app.use('/api/company-config', require('./src/routes/company-config.routes'));
app.use('/api/setup', require('./src/routes/setup.routes'));

// ─── Super Admin (isolated) ────────────────────────────────────────────────────
app.use('/api/superadmin', superAdminRoutes);

// ─── Company-side Support Tickets ─────────────────────────────────────────────
app.use('/api/support/tickets', supportRoutes);

// ─── Billing & Subscription ────────────────────────────────────────────────────
app.use('/api/billing', billingRoutes);

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '🚀 Internal Management System API v2.0 is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ─── Sentry error handler ─────────────────────────────────────────────────────
app.use(Sentry.Handlers.errorHandler());

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function bootstrap() {
    try {
        await connectDB();
        initSocket(server);
        await initQueues();
        CronService.init(); // Initialize Scheduled Tasks
        SubscriptionCronService.start(); // Subscription expiry + reminder emails
        server.listen(PORT, () => {
            console.log(`\n🚀 IMS API running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV}`);
            console.log(`🌐 CORS origin: ${allowedOrigins.join(', ')}\n`);
        });
    } catch (err) {
        console.error('❌ Bootstrap failed:', err);
        process.exit(1);
    }
}

bootstrap();

module.exports = app;
