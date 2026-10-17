import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRightIcon,
    BoltIcon,
    DocumentMagnifyingGlassIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const features = [
    {
        name: 'Outreach in one click',
        description: 'A cold email, a LinkedIn DM and a follow-up, drafted together for the person and role you are targeting.',
        icon: EnvelopeIcon,
    },
    {
        name: 'Resume Tailor',
        description: 'Compare your resume with any job description. Get a match score, keyword gaps and concrete rewrite ideas.',
        icon: DocumentMagnifyingGlassIcon,
    },
    {
        name: 'Built on your real profile',
        description: 'Drafts use the background you enter, and the AI is told never to invent experience or numbers.',
        icon: UserCircleIcon,
    },
    {
        name: 'Fast to start',
        description: 'Sign in with Google or email, fill in your profile once, and generate in seconds.',
        icon: BoltIcon,
    },
    {
        name: 'Private by design',
        description: 'Verified accounts only, hashed passwords and rate limiting. Delete your saved resume and history any time.',
        icon: ShieldCheckIcon,
    },
];

const steps = [
    { title: 'Tell us about you', body: 'Add your role, skills and real achievements to your profile once.' },
    { title: 'Add the job', body: 'Paste a job description or enter the recruiter and company.' },
    { title: 'Review and send', body: 'Edit the drafts and tailor your resume, then reach out with confidence.' },
];

const pillClass = 'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200';

const LandingPage = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            <nav className="fixed z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Logo />
                    <div className="flex items-center gap-2">
                        {user ? (
                            <Link to="/dashboard" className={`${pillClass} bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30`}>
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Log in</Link>
                                <Link to="/signup" className={`${pillClass} bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30`}>
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <header className="relative overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-40">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                    />
                </div>

                <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                        <CheckCircleIcon className="h-4 w-4" /> Outreach and resume tailoring in one place
                    </span>
                    <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl">
                        Reach out smarter.<br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Tailor every application.</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-gray-600">
                        Draft personalised cold emails, LinkedIn messages and follow-ups, then see exactly how to tune your resume for each job description.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            to={user ? '/dashboard' : '/signup'}
                            className="group inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-gray-800"
                        >
                            {user ? 'Open dashboard' : 'Start for free'}
                            <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        {!user && (
                            <Link to="/login" className="text-base font-semibold text-gray-700 hover:text-gray-900">I already have an account</Link>
                        )}
                    </div>
                    <p className="mt-4 text-xs text-gray-500">AI output can contain mistakes. Always review before you send.</p>
                </div>
            </header>

            <section className="border-t border-gray-100 bg-gray-50/60 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything for your next application</h2>
                        <p className="mt-4 text-lg text-gray-600">Practical tools that keep you in control of what you send.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div key={f.name} className="card p-7 transition-shadow hover:shadow-pop">
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                                    <f.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900">{f.name}</h3>
                                <p className="leading-relaxed text-gray-600">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How it works</h2>
                    <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {steps.map((s, i) => (
                            <li key={s.title} className="text-center">
                                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-lg font-bold text-white">{i + 1}</span>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                                <p className="mt-2 text-gray-600">{s.body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="relative isolate overflow-hidden bg-gray-900">
                <div className="px-6 py-24 sm:py-28 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready for your next move?</h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                            Create a free account, add your profile and generate your first draft in minutes.
                        </p>
                        <div className="mt-10 flex items-center justify-center">
                            <Link
                                to={user ? '/dashboard' : '/signup'}
                                className="rounded-full bg-primary-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                {user ? 'Open dashboard' : 'Create free account'}
                            </Link>
                        </div>
                    </div>
                </div>
                <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
                    <circle cx="512" cy="512" r="512" fill="url(#cta-gradient)" fillOpacity="0.7" />
                    <defs>
                        <radialGradient id="cta-gradient">
                            <stop stopColor="#4f46e5" />
                            <stop offset="1" stopColor="#818cf8" />
                        </radialGradient>
                    </defs>
                </svg>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
