const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables for local development.
// Vercel environment variables are supplied by the platform.
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

const app = express();

const isProd = process.env.NODE_ENV === 'production';

// Trust Vercel's reverse proxy.
app.set('trust proxy', 1);

// Validate essential environment variables.
// GOOGLE_CLIENT_ID is checked by googleVerify.js when Google login is used.
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GROQ_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(
    (name) => !process.env[name]
);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

// Security headers.
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
                'img-src': [
                    "'self'",
                    'data:',
                    'https:',
                ],
            },
        },
        crossOriginOpenerPolicy: {
            policy: 'same-origin-allow-popups',
        },
    })
);

// CORS configuration.
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://ai-analyzer-cold-mail-generator.vercel.app',
    'http://localhost:5173',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Requests without an Origin header can include server-to-server
            // requests and health checks.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error('Origin not allowed by CORS')
            );
        },
        credentials: true,
    })
);

// Root health check: does not require a database connection.
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'AI Analyzer & Cold Email Generator API is running',
    });
});

// Health check: confirms the Express app is responding.
// It intentionally does not verify MongoDB connectivity.
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is running',
    });
});

// Razorpay webhook.
// Preserve the raw request body for signature verification.
// This must appear before express.json().
app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res, next) => {
        try {
            await connectDB();
            return razorpayWebhook(req, res, next);
        } catch (error) {
            console.error(
                'Webhook database connection failed:',
                error.message
            );

            return res.status(503).json({
                message: 'Database temporarily unavailable',
            });
        }
    }
);

// Parse request bodies for the remaining API routes.
app.use(
    express.json({
        limit: '128kb',
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '10kb',
    })
);

// Connect to MongoDB before processing API requests.
// The connection helper should cache the connection for reuse
// across Vercel serverless function invocations.
app.use('/api', async (req, res, next) => {
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

// API rate limiting.
app.use('/api', apiLimiter);

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/billing', billingRoutes);

// Unknown API routes return JSON.
app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
    });
});

// Handle errors, including CORS errors.
app.use((err, req, res, next) => {
    console.error('Request error:', err.message || err);

    if (res.headersSent) {
        return next(err);
    }

    if (err.message === 'Origin not allowed by CORS') {
        return res.status(403).json({
            message: 'Origin not allowed',
        });
    }

    res.status(err.status || 500).json({
        message:
            err.status && err.status < 500
                ? err.message
                : 'Server Error',
    });
});

// Local development only.
// Vercel imports the Express app instead of starting its own listener.
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;