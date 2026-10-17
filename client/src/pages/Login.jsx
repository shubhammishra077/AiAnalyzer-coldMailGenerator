import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { OrDivider } from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { GOOGLE_CLIENT_ID } from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data);
            toast.success('Welcome back');
            navigate('/dashboard');
        } catch (error) {
            const data = error.response?.data;
            if (data?.needsVerification) {
                toast.error(data.message);
                navigate('/verify-otp', { state: { userId: data.userId, email: data.email } });
                return;
            }
            toast.error(data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard.">
            {GOOGLE_CLIENT_ID && (
                <>
                    <GoogleButton onSuccess={() => navigate('/dashboard')} text="signin_with" />
                    <OrDivider />
                </>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="label" htmlFor="email">Email address</label>
                    <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <div className="flex items-center justify-between">
                        <label className="label" htmlFor="password">Password</label>
                        <Link to="/forgot-password" className="mb-1.5 text-sm font-medium text-primary-600 hover:text-primary-500">Forgot password?</Link>
                    </div>
                    <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-500">Create an account</Link>
            </p>
        </AuthLayout>
    );
};

export default Login;
