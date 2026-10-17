import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const titles = {
    '/dashboard': 'Overview',
    '/dashboard/generate': 'Generate Email',
    '/dashboard/resume': 'Resume Tailor',
    '/dashboard/tracker': 'Tracker',
    '/dashboard/history': 'History',
    '/dashboard/profile': 'Profile',
    '/dashboard/billing': 'Plan & Billing',
};

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => { setOpen(false); }, [pathname]);

    useEffect(() => {
        const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
        const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', esc);
        };
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-16 flex-none items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
                <h1 className="text-base font-semibold text-gray-900">{titles[pathname] || 'Dashboard'}</h1>
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-gray-100"
                    aria-haspopup="menu"
                    aria-expanded={open}
                >
                    <Avatar name={user?.name} src={user?.avatarUrl} />
                    <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-700 sm:block">{user?.name}</span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>

                {open && (
                    <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-pop">
                        <div className="border-b border-gray-100 px-4 py-3">
                            <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link to="/dashboard/profile" role="menuitem" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            <UserCircleIcon className="h-4 w-4" /> Profile
                        </Link>
                        <button
                            role="menuitem"
                            onClick={logout}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" /> Sign out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
