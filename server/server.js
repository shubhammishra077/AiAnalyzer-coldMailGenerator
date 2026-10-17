const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before anything reads them
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const statsRoutes = require('./routes/statsRoutes');
const accountRoutes = require('./routes/accountRoutes');
const billingRoutes = require('./routes/billingRoutes');
const { razorpayWebhook } = require('./controllers/billingController');
const { apiLimiter } = require('./middleware/rateLimiters');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

connectDB();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Behind Render/Heroku/etc. the real client IP is in X-Forwarded-For;
// without this every user shares one rate-limit bucket.
app.set('trust proxy', 1);

// Google Identity Services needs its script, iframe and popups allowed when this server
// also serves the built client.
const cspDefaults = helmet.contentSecurityPolicy.getDefaultDirectives();
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...cspDefaults,
            'script-src': ["'self'", 'https://accounts.google.com/gsi/client'],
            'frame-src': ["'self'", 'https://accounts.google.com/gsi/'],
            'connect-src': ["'self'", 'https://accounts.google.com/gsi/'],
            'img-src': ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// In production only the configured frontend may call the API.
app.use(cors({
    origin: process.env.FRONTEND_URL || (isProd ? false : true),
    credentials: true
}));

// Razorpay signs the exact raw webhook body; register this before JSON parsing.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/billing', billingRoutes);

// Unknown API routes get JSON, not a hanging request or the SPA shell
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Optional: serve the built client when it exists (single-host deployments)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) res.status(404).json({ message: 'Not found' });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
