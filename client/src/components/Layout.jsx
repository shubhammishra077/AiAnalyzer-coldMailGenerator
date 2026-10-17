import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { CompactFooter } from './Footer';

const Layout = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Navbar onMenuClick={() => setMenuOpen(true)} />
                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        <Outlet />
                    </main>
                    <CompactFooter />
                </div>
            </div>
        </div>
    );
};

export default Layout;
