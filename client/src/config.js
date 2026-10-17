// Branding and legal details. Override with VITE_* variables at build time.
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME ||'AI Analyzer-coldMailGenerator';
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@example.com';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOVERNING_LAW =
    import.meta.env.VITE_GOVERNING_LAW || `the jurisdiction in which ${COMPANY_NAME} is established`;
export const LEGAL_UPDATED = 'October 15, 2026';
