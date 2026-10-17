import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

const ResultCard = ({ title, content }) => {
    const [copied, setCopied] = useState(false);

    if (!content) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Select the text and copy manually.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">{title}</h3>
                <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    title="Copy"
                >
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                </button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
        </div>
    );
};

export default ResultCard;
