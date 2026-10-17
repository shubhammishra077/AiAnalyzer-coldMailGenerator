import React from 'react';

const initialsOf = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || 'U';

const Avatar = ({ name, src, size = 'h-9 w-9', text = 'text-sm' }) => {
    if (src) {
        return (
            <img
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                className={`${size} rounded-full object-cover ring-2 ring-white`}
            />
        );
    }
    return (
        <span className={`${size} ${text} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 font-semibold text-white ring-2 ring-white`}>
            {initialsOf(name)}
        </span>
    );
};

export default Avatar;
