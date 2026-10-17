import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const VerifyOtp = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const { userId, email } = location.state || {};

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    if (!userId) return <Navigate to="/signup" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { userId, otp });
            login(data);
            toast.success('Email verified');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const { data } = await api.post('/auth/resend-otp', { userId });
            toast.success(data.message);
            setCooldown(60);
        } catch (error) {
            const data = error.response?.data;
            if (data?.retryAfterSeconds) setCooldown(data.retryAfterSeconds);
            toast.error(data?.message || 'Could not resend OTP');
        }
    };

    return (
        <AuthLayout
            title="Check your email"
            subtitle={email ? `We sent a 6-digit code to ${email}. It expires in 10 minutes.` : 'Enter the 6-digit code we emailed you.'}
        >
            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="label" htmlFor="otp">Verification code</label>
                    <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        maxLength={6}
                        pattern="\d{6}"
                        className="input text-center text-2xl font-semibold tracking-[0.5em]"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                    {loading ? 'Verifying...' : 'Verify email'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="font-semibold text-primary-600 hover:text-primary-500 disabled:text-gray-400"
                >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
            </div>
        </AuthLayout>
    );
};

export default VerifyOtp;
