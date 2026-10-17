# AI Analyzer-coldMailGenerator

An AI-powered web application that helps job seekers analyze their resumes, evaluate their compatibility with job descriptions, and generate personalized cold emails for professional outreach.

## Overview

AI Analyzer-coldMailGenerator simplifies the job application process by combining AI-powered resume analysis and personalized email generation in one platform. It offers free and premium plans to make career-focused AI tools accessible to users with different needs.

## Features

- **AI Resume Analyzer:** Analyze resumes and receive AI-generated feedback.
- **Job Description Matching:** Evaluate how well a resume matches a target job description.
- **Cold Email Generator:** Generate personalized professional emails for recruiters and hiring managers.
- **AI-Powered Content Generation:** Use Groq-powered language models for AI features.
- **Free and Premium Plans:** Support different usage limits and premium functionality.
- **Subscription Payments:** Integrate Razorpay for subscription billing.
- **User Authentication:** Provide authenticated access to application features.
- **Dashboard:** Access resume analyses, generated emails, and usage statistics.
- **Responsive Interface:** Use the application across supported desktop and mobile screen sizes.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- REST APIs

**Database and AI**
- MongoDB
- Groq API

**Payments and Tools**
- Razorpay
- Git and GitHub
- npm

## Project Structure

```text
AI-Analyzer-Cold-Mail-Generator/
├── client/                 # React frontend
├── server/                 # Backend API and application logic
├── package.json            # Root scripts and dependencies
├── package-lock.json       # Dependency lockfile
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB connection or MongoDB Atlas account
- Groq API key
- Razorpay account and API credentials for payment functionality

### 1. Clone the repository

```bash
git clone https://github.com/shubham07/AiAnalyzer-coldMailGenerator.git
cd AiAnalyzer-coldMailGenerator
```

### 2. Install dependencies

Install the root dependencies:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd client
npm install
cd ..
```

Install backend dependencies if the root installation does not install them:

```bash
cd server
npm install
cd ..
```

### 3. Configure environment variables

Create the required `.env` files based on the environment variables used by your frontend and backend code.

Example backend configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

These variable names are examples. Check the server configuration and payment implementation to confirm the exact names required by your version of the project.

If the frontend requires a backend URL, configure the appropriate Vite environment variable in `client/.env`, using the name expected by your frontend code.

**Security:** Never commit `.env` files, API keys, database credentials, payment secrets, or other sensitive information to GitHub.

### 4. Start the application

Run the development command configured in your root `package.json`:

```bash
npm run dev
```

If your root package does not provide a combined development script, start the backend and frontend separately using the scripts defined in their respective `package.json` files.

Open the local URL displayed by Vite in your terminal.

## Subscription and Payments

The application supports free and premium usage tiers.

- **Free Plan:** Provides access to selected resume analysis and cold email generation features within configured usage limits.
- **Premium Plan:** Provides additional access according to the subscription entitlements configured in the application.
- **Razorpay Integration:** Handles subscription payments using the configured Razorpay credentials.

Use Razorpay test credentials during development and verify payment flows before enabling live payments.

## AI Integration

The application uses the Groq API to power AI-based resume analysis and personalized cold email generation. Generated content depends on the supplied resume information, job description, and generation instructions.

A valid Groq API key and a model supported by your account are required for AI functionality.

## Future Improvements

- More detailed resume scoring and actionable recommendations
- Additional resume templates and email styles
- Improved usage analytics
- Enhanced personalization for different job roles
- Additional export and sharing options

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Commit your changes.
5. Open a pull request describing your improvements.

## Author

**Shubham Kumar**

## License

No license has been specified yet. All rights are reserved by default unless a license is added to this repository. Consider adding an open-source license if you intend to permit reuse or redistribution.
