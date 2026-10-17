import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import AuthLayout, { OrDivider } from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { GOOGLE_CLIENT_ID } from '../config';

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accepted) {
            toast.error('Please accept the Terms and Privacy Policy to continue');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);
            if (data.emailSent === false) toast.error(data.message);
            else toast.success(data.message);
            navigate('/verify-otp', { state: { userId: data.userId, email: data.email } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const terms = (
        <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="font-medium text-primary-600 hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="font-medium text-primary-600 hover:underline">Privacy Policy</Link>.
        </span>
    );

    return (
        <AuthLayout title="Create your account" subtitle="Free to start. We'll email you a code to verify your address.">
            {GOOGLE_CLIENT_ID && (
                <>
                    <p className="mb-3 text-xs text-gray-500">By continuing with Google you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
                    <GoogleButton onSuccess={() => navigate('/dashboard')} text="signup_with" />
                    <OrDivider />
                </>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input id="name" type="text" required autoComplete="name" className="input" value={form.name} onChange={set('name')} />
                </div>
                <div>
                    <label className="label" htmlFor="email">Email address</label>
                    <input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} />
                </div>
                <div>
                    <label className="label" htmlFor="password">Password</label>
                    <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} />
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    {terms}
                </label>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">Sign in</Link>
            </p>
        </AuthLayout>
    );
};

export default Signup;
