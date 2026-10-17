import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { COMPANY_NAME } from '../config';

const Logo = ({ to = '/', light = false, className = '' }) => (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 shadow-sm">
            <SparklesIcon className="h-4 w-4 text-white" />
        </span>
        <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>{COMPANY_NAME}</span>
    </Link>
);

export default Logo;
