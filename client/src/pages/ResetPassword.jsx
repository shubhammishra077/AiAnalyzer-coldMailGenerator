import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import AuthLayout from '../components/AuthLayout';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { token, password });
            toast.success(data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Choose a new password" subtitle="You'll be signed out on other devices once it's changed.">
            {!token ? (
                <p className="text-sm text-gray-700">
                    This reset link is incomplete.{' '}
                    <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-500">Request a new one</Link>
                </p>
            ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="label" htmlFor="pw">New password</label>
                        <input id="pw" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" htmlFor="pw2">Confirm new password</label>
                        <input id="pw2" type="password" required minLength={8} autoComplete="new-password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? 'Saving...' : 'Reset password'}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
};

export default ResetPassword;
