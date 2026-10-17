import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Footer from './Footer';
import { LEGAL_UPDATED } from '../config';

export const Section = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-24">
        <h2 className="mt-10 text-xl font-bold tracking-tight text-gray-900">{title}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-7 text-gray-700">{children}</div>
    </section>
);

export const List = ({ items }) => (
    <ul className="list-disc space-y-2 pl-6">
        {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
);

const legalPages = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/copyright', label: 'Copyright Policy' },
];

const LegalLayout = ({ title, intro, current, children }) => {
    useEffect(() => { window.scrollTo(0, 0); }, [current]);

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Logo />
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to home</Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
                <nav className="mb-6 flex flex-wrap gap-2" aria-label="Legal pages">
                    {legalPages.map((p) => (
                        <Link
                            key={p.to}
                            to={p.to}
                            aria-current={p.to === current ? 'page' : undefined}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                p.to === current ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900'
                            }`}
                        >
                            {p.label}
                        </Link>
                    ))}
                </nav>

                <article className="card px-6 py-8 sm:px-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
                    <p className="mt-2 text-sm text-gray-500">Last updated: {LEGAL_UPDATED}</p>
                    {intro && <p className="mt-6 text-[15px] leading-7 text-gray-700">{intro}</p>}
                    {children}
                </article>
            </main>

            <Footer />
        </div>
    );
};

export default LegalLayout;
