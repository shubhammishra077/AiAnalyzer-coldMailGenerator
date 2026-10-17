import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Logo from './Logo';
import { CompactFooter } from './Footer';

const points = [
    'Personalised cold emails, follow-ups and LinkedIn DMs',
    'Resume analysis tailored to each job description',
    'Your facts only: no invented experience',
];

// Split-screen shell shared by login, signup, verify and password pages
const AuthLayout = ({ title, subtitle, children }) => (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 p-12 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
            <Logo light to="/" />
            <div>
                <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Land more replies.<br />Tailor every application.</h2>
                <ul className="mt-8 space-y-4">
                    {points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-primary-50">
                            <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-white/90" />
                            <span className="text-sm leading-relaxed">{p}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <p className="text-xs text-primary-100/80">AI suggestions can be wrong. Always review before you send.</p>
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />
        </aside>

        <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between px-6 py-5 lg:hidden">
                <Logo />
            </div>
            <main className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
                    {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                </div>
            </main>
            <CompactFooter />
        </div>
    </div>
);

export const OrDivider = () => (
    <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs uppercase tracking-wide text-gray-500">or</span></div>
    </div>
);

export default AuthLayout;
