import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    Squares2X2Icon,
    EnvelopeIcon,
    DocumentMagnifyingGlassIcon,
    ClockIcon,
    ViewColumnsIcon,
    UserCircleIcon,
    CreditCardIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import Logo from './Logo';

const groups = [
    {
        label: 'Workspace',
        items: [
            { to: '/dashboard', label: 'Overview', icon: Squares2X2Icon, end: true },
            { to: '/dashboard/generate', label: 'Generate Email', icon: EnvelopeIcon },
            { to: '/dashboard/resume', label: 'Resume Tailor', icon: DocumentMagnifyingGlassIcon },
            { to: '/dashboard/tracker', label: 'Tracker', icon: ViewColumnsIcon },
            { to: '/dashboard/history', label: 'History', icon: ClockIcon },
        ],
    },
    {
        label: 'Account',
        items: [{ to: '/dashboard/profile', label: 'Profile', icon: UserCircleIcon }, { to: '/dashboard/billing', label: 'Plan & Billing', icon: CreditCardIcon }],
    },
];

const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col">
        <div className="flex h-16 flex-none items-center px-5">
            <Logo to="/dashboard" />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
            {groups.map((group) => (
                <div key={group.label}>
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
                    <ul className="mt-2 space-y-1">
                        {group.items.map(({ to, label, icon: Icon, end }) => (
                            <li key={to}>
                                <NavLink to={to} end={end} className={linkClass} onClick={onNavigate}>
                                    <Icon className="h-5 w-5 flex-none" />
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>

        <div className="flex-none border-t border-gray-200 p-4 text-xs text-gray-500">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link to="/privacy" className="hover:text-gray-900" onClick={onNavigate}>Privacy</Link>
                <Link to="/terms" className="hover:text-gray-900" onClick={onNavigate}>Terms</Link>
                <Link to="/copyright" className="hover:text-gray-900" onClick={onNavigate}>Copyright</Link>
            </div>
        </div>
    </div>
);

// Desktop: fixed column. Mobile: slide-over drawer controlled by the Layout.
const Sidebar = ({ open, onClose }) => (
    <>
        <aside className="hidden w-64 flex-none border-r border-gray-200 bg-white lg:block">
            <SidebarContent />
        </aside>

        <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div
                className={`absolute inset-0 bg-gray-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <aside
                className={`absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-pop transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100"
                    aria-label="Close menu"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
                <SidebarContent onNavigate={onClose} />
            </aside>
        </div>
    </>
);

export default Sidebar;
