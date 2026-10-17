import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a link to choose a new one.">
            {sent ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p>If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way. It is valid for 30 minutes.</p>
                    <p className="mt-2 text-xs text-emerald-700">Nothing arrived? Check spam, or try again in a minute.</p>
                </div>
            ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="label" htmlFor="email">Email address</label>
                        <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
            )}

            <p className="mt-6 text-center text-sm">
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">Back to sign in</Link>
            </p>
        </AuthLayout>
    );
};

export default ForgotPassword;
