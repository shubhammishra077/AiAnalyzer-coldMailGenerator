import React from 'react';

const PageHeader = ({ title, description, children }) => (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {children && <div className="flex-none">{children}</div>}
    </div>
);

export default PageHeader;
