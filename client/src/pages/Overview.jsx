import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    EnvelopeIcon,
    DocumentMagnifyingGlassIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    ArrowRightIcon,
    BellAlertIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { formatDay } from '../utils/tracking';

const greeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';

    return 'Hello night owl';
};

const StatCard = ({ icon: Icon, label, value, hint, tone = 'primary' }) => {
    const tones = {
        primary: 'bg-primary-50 text-primary-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
};


const ActivityChart = ({ days = [] }) => {
    const chartWidth = 700;
    const chartHeight = 220;
    const left = 36;
    const right = 12;
    const top = 20;
    const bottom = 34;

    const values = days.map((day) => Number(day.count) || 0);
    const max = Math.max(5, ...values);
    const step = (chartWidth - left - right) / Math.max(days.length - 1, 1);
    const plotHeight = chartHeight - top - bottom;

    const points = days.map((day, index) => ({
        x: days.length === 1
            ? chartWidth / 2
            : left + index * step,
        y: top + plotHeight - ((Number(day.count) || 0) / max) * plotHeight,
        count: Number(day.count) || 0,
        date: day.date,
    }));

    const linePath = points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        const previous = points[index - 1];
        const midX = (previous.x + point.x) / 2;

        return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    const areaPath = points.length
        ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - bottom} L ${points[0].x} ${chartHeight - bottom} Z`
        : '';

    return (
        <div className="w-full min-w-0">
            <div className="relative w-full">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="block w-full overflow-visible"
                    role="img"
                    aria-label="Emails generated over the last seven days"
                >
                    <defs>
                        <linearGradient id="emailChartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7667f5" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#7667f5" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>

                    {[0, 1, 2, 3, 4].map((tick) => {
                        const y = top + (plotHeight * tick) / 4;

                        return (
                            <g key={tick}>
                                <line
                                    x1={left}
                                    y1={y}
                                    x2={chartWidth - right}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeDasharray="4 5"
                                />
                                <text
                                    x={left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="11"
                                    fill="#94a3b8"
                                >
                                    {Math.round(max * (1 - tick / 4))}
                                </text>
                            </g>
                        );
                    })}

                    {points.length > 1 && (
                        <path d={areaPath} fill="url(#emailChartFill)" />
                    )}

                    {points.length > 1 && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#7667f5"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {points.map((point) => (
                        <g key={point.date}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="9"
                                fill="#7667f5"
                                opacity="0"
                            />
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="white"
                                stroke="#7667f5"
                                strokeWidth="2.5"
                            >
                                <title>{`${point.date}: ${point.count} emails`}</title>
                            </circle>
                        </g>
                    ))}

                    {points.map((point) => (
                        <text
                            key={`label-${point.date}`}
                            x={point.x}
                            y={chartHeight - 8}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#94a3b8"
                        >
                            {new Date(`${point.date}T00:00:00Z`).toLocaleDateString(
                                undefined,
                                { weekday: 'short', timeZone: 'UTC' }
                            )}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
};


const Skeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-200" />)}
        </div>
        <div className="h-64 rounded-2xl bg-gray-200" />
    </div>
);

const Overview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get('/stats').then(({ data }) => setStats(data)).catch(() => setError(true));
    }, []);

    const firstName = (user?.name || '').split(' ')[0];

    if (error) {
        return <div className="card p-8 text-center text-sm text-gray-600">We couldn't load your dashboard. Please refresh the page.</div>;
    }
    if (!stats) return <Skeleton />;

    const quickActions = [
        { to: '/dashboard/generate', title: 'Write an outreach email', body: 'Email, LinkedIn DM and follow-up in one go.', icon: EnvelopeIcon },
        { to: '/dashboard/resume', title: 'Tailor your resume', body: 'Score your resume against a job description.', icon: DocumentMagnifyingGlassIcon },
    ];

    return (
        <div>
            <PageHeader title={`${greeting()}, ${firstName}`} description="Here's what's happening with your job search." />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={EnvelopeIcon} label="Emails generated" value={stats.emailsTotal} hint="All time" />
                <StatCard
                    icon={CalendarDaysIcon}
                    label="Reply rate"
                    value={stats.tracking.replyRate === null ? '-' : `${stats.tracking.replyRate}%`}
                    hint={stats.tracking.sent ? `${stats.tracking.responded} of ${stats.tracking.sent} sent got a response` : 'Mark emails as sent to track this'}
                    tone="indigo"
                />
                <StatCard icon={DocumentMagnifyingGlassIcon} label="Resume analyses" value={stats.analysesTotal} hint={stats.hasResume ? 'Resume saved' : 'No resume saved yet'} tone="emerald" />
                <StatCard
                    icon={ChartBarIcon}
                    label="Latest match score"
                    value={stats.lastMatchScore === null ? '-' : `${stats.lastMatchScore}%`}
                    hint={stats.lastMatchScore === null ? 'Run a resume analysis' : 'Most recent analysis'}
                    tone="amber"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {stats.tracking.dueList.length > 0 && (
                        <section className="card border-amber-200 bg-amber-50/50 p-5">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900">
                                    <BellAlertIcon className="h-5 w-5" /> Follow-ups due ({stats.tracking.followUpsDue})
                                </h3>
                                <Link to="/dashboard/tracker" className="text-sm font-medium text-amber-800 hover:underline">Open tracker</Link>
                            </div>
                            <ul className="mt-3 divide-y divide-amber-100">
                                {stats.tracking.dueList.map((d) => (
                                    <li key={d._id} className="flex items-center justify-between gap-4 py-2.5">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-900">{[d.jobTitle, d.company].filter(Boolean).join(' at ') || 'Untitled'}</span>
                                            <span className="block truncate text-xs text-gray-500">{d.subject}</span>
                                        </span>
                                        <span className="flex-none text-xs text-amber-800">due {formatDay(d.followUpAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="card p-5">
                        <h3 className="text-base font-semibold text-gray-900">Emails generated, last 7 days <span className="ml-1 text-sm font-normal text-gray-500">({stats.emailsLast7Days} this week)</span></h3>
                        <div className="mt-4"><ActivityChart days={stats.activity} /></div>
                    </section>

                    <section className="card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Recent emails</h3>
                            <Link to="/dashboard/history" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
                        </div>
                        {stats.recent.length === 0 ? (
                            <p className="mt-4 text-sm text-gray-500">Nothing yet. <Link to="/dashboard/generate" className="font-medium text-primary-600 hover:underline">Generate your first email</Link>.</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-gray-100">
                                {stats.recent.map((e) => (
                                    <li key={e._id} className="flex items-center justify-between gap-4 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {[e.jobTitle, e.company].filter(Boolean).join(' at ') || 'Untitled'}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">{e.subject}</p>
                                        </div>
                                        <span className="flex-none text-xs text-gray-400">
                                            {new Date(e.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="card p-5">
                        <h3 className="text-base font-semibold text-gray-900">Quick actions</h3>
                        <div className="mt-3 space-y-3">
                            {quickActions.map(({ to, title, body, icon: Icon }) => (
                                <Link key={to} to={to} className="group flex items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40">
                                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Icon className="h-5 w-5" /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium text-gray-900">{title}</span>
                                        <span className="block text-xs text-gray-500">{body}</span>
                                    </span>
                                    <ArrowRightIcon className="mt-1 h-4 w-4 flex-none text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="card p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Profile strength</h3>
                            <span className="text-sm font-semibold text-gray-700">{stats.profile.percent}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={stats.profile.percent} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all" style={{ width: `${stats.profile.percent}%` }} />
                        </div>
                        {stats.profile.missing.length > 0 ? (
                            <>
                                <p className="mt-3 text-xs text-gray-500">Still missing: {stats.profile.missing.join(', ')}.</p>
                                <Link to="/dashboard/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                                    Complete your profile <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </>
                        ) : (
                            <p className="mt-3 text-xs text-emerald-600">Your profile is complete. Drafts will use it.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Overview;
