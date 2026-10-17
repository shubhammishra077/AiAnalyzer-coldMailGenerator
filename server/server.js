
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
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
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GROQ_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Trust the reverse proxy used by Vercel
app.set('trust proxy', 1);

// Security headers
const cspDefaults =
    helmet.contentSecurityPolicy.getDefaultDirectives();

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...cspDefaults,
                'script-src': [
                    "'self'",
                    'https://accounts.google.com/gsi/client',
                ],
                'frame-src': [
                    "'self'",
                    'https://accounts.google.com/gsi/',
                ],
                'connect-src': [
                    "'self'",
                    'https://accounts.google.com/gsi/',
                ],
                'img-src': ["'self'", 'data:', 'https:'],
            },
        },
        crossOriginOpenerPolicy: {
            policy: 'same-origin-allow-popups',
        },
    })
);

// CORS configuration
app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            (isProd ? false : true),
        credentials: true,
    })
);


app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error(
            'Database connection failed:',
            error.message
        );

        res.status(503).json({
            message: 'Database temporarily unavailable',
        });
    }
});


app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    razorpayWebhook
);

// Parse request bodies
app.use(express.json({ limit: '128kb' }));
app.use(
    express.urlencoded({
        extended: true,
        limit: '10kb',
    })
);

// API rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/billing', billingRoutes);

// Unknown API routes return JSON
app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
    });
});

// Central error handler
app.use((err, req, res, next) => {
    console.error('Request error:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message:
            err.status && err.status < 500
                ? err.message
                : 'Server Error',
    });
});

// Local development server
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}


module.exports = app;
