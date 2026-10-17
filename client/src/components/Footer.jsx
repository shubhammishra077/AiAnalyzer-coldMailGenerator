import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { COMPANY_NAME, CONTACT_EMAIL } from '../config';

const legalLinks = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/copyright', label: 'Copyright Policy' },
];

const Copyright = () => (
    <p className="text-xs text-gray-500">
        &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
    </p>
);

// Slim footer used inside the app and on auth pages
export const CompactFooter = ({ className = '' }) => (
    <footer className={`border-t border-gray-200/80 py-5 ${className}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
            <Copyright />
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                {legalLinks.map((l) => (
                    <Link key={l.to} to={l.to} className="hover:text-gray-900 transition-colors">{l.label}</Link>
                ))}
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gray-900 transition-colors">Contact</a>
            </nav>
        </div>
    </footer>
);

// Full footer for the marketing and legal pages
const Footer = () => (
    <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                <div className="md:col-span-2">
                    <Logo />
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
                        AI-assisted cold emails, LinkedIn messages and resume tailoring for people looking for their next role.
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
                    <ul className="mt-4 space-y-3 text-sm">
                        {legalLinks.map((l) => (
                            <li key={l.to}>
                                <Link to={l.to} className="text-gray-600 hover:text-gray-900 transition-colors">{l.label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Company</h3>
                    <ul className="mt-4 space-y-3 text-sm">
                        <li><a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-600 hover:text-gray-900 transition-colors">{CONTACT_EMAIL}</a></li>
                        <li><Link to="/signup" className="text-gray-600 hover:text-gray-900 transition-colors">Create an account</Link></li>
                        <li><Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link></li>
                    </ul>
                </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 md:flex-row md:items-center md:justify-between">
                <Copyright />
                <p className="max-w-xl text-xs text-gray-500 md:text-right">
                    {COMPANY_NAME} and its logo are trademarks of {COMPANY_NAME}. Other product names, logos and brands are property of their respective owners and are used for identification only.
                </p>
            </div>
        </div>
    </footer>
);

export default Footer;
