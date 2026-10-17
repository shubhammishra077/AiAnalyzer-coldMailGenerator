import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, CreditCardIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const money = (paise) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format((paise || 0) / 100);

const Billing = () => {
    const { user } = useAuth();
    const [billing, setBilling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get('/billing/status');
            setBilling(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not load plan details');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const upgrade = async () => {
        setCheckoutLoading(true);
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Could not load Razorpay Checkout. Check your connection and try again.');
            const { data } = await api.post('/billing/subscription');
            const checkout = new window.Razorpay({
                key: data.keyId,
                subscription_id: data.subscriptionId,
                name: 'AI Analyzer-coldMailGenerator',
                description: 'Premium monthly subscription',
                prefill: { name: user?.name || '', email: user?.email || '' },
                notes: { product: 'AI Analyzer-coldMailGenerator Premium' },
                theme: { color: '#4f46e5' },
                handler: async (response) => {
                    try {
                        await api.post('/billing/verify', response);
                        toast.success('Payment verified. Premium is active.');
                        await refresh();
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Payment received but verification failed. Contact support before paying again.');
                        await refresh();
                    } finally {
                        setCheckoutLoading(false);
                    }
                },
                modal: { ondismiss: () => setCheckoutLoading(false) },
            });
            checkout.on('payment.failed', (response) => {
                toast.error(response.error?.description || 'Payment failed. Please try again.');
                setCheckoutLoading(false);
            });
            checkout.open();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Could not start checkout');
            setCheckoutLoading(false);
        }
    };

    const cancel = async () => {
        if (!window.confirm('Schedule your premium subscription to cancel at the end of the current billing period?')) return;
        setCancelLoading(true);
        try {
            const { data } = await api.post('/billing/cancel');
            toast.success(data.message);
            await refresh();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not cancel subscription');
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading) return <div className="py-16 text-center text-sm text-gray-500">Loading plan details...</div>;

    const premium = billing?.plan === 'premium';
    const emailUsed = billing?.usage?.emailGenerations || 0;
    const resumeUsed = billing?.usage?.resumeAnalyses || 0;
    const emailLimit = billing?.limits?.emailGenerations || 10;
    const resumeLimit = billing?.limits?.resumeAnalyses || 5;

    return (
        <div className="space-y-6">
            <PageHeader title="Plan & billing" description="Manage your plan and see how much AI usage remains this month." />

            <section className="card p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            {premium ? <SparklesIcon className="h-6 w-6 text-indigo-600" /> : <CreditCardIcon className="h-6 w-6 text-gray-500" />}
                            <h2 className="text-xl font-semibold text-gray-900">{premium ? 'Premium plan' : 'Free plan'}</h2>
                            <span className={`badge ${premium ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{premium ? 'ACTIVE' : 'CURRENT'}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{premium ? 'Higher monthly limits for active job searching.' : 'Try both core AI tools at no cost.'}</p>
                        {premium && billing?.subscriptionCurrentEnd && <p className="mt-2 text-xs text-gray-500">Current period ends {new Date(billing.subscriptionCurrentEnd).toLocaleDateString()}.</p>}
                        {premium && billing?.cancelAtPeriodEnd && <p className="mt-2 text-sm text-amber-700">Cancellation is scheduled for the end of your billing period.</p>}
                    </div>
                    {!premium && (
                        <div className="sm:text-right">
                            <p className="text-2xl font-bold text-gray-900">{money(billing?.pricePaise)}<span className="text-sm font-normal text-gray-500"> / month</span></p>
                            <button className="btn-primary mt-3" onClick={upgrade} disabled={checkoutLoading || !billing?.billingConfigured}>
                                {checkoutLoading ? 'Opening checkout...' : 'Upgrade with Razorpay'}
                            </button>
                            {!billing?.billingConfigured && <p className="mt-2 max-w-xs text-xs text-amber-700">Payments are not configured yet. Add Razorpay server environment variables to enable checkout.</p>}
                        </div>
                    )}
                    {premium && !billing?.cancelAtPeriodEnd && <button className="btn-secondary" onClick={cancel} disabled={cancelLoading}>{cancelLoading ? 'Scheduling...' : 'Cancel at period end'}</button>}
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="card p-5">
                    <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Email generations</h3><span className="text-sm text-gray-500">{emailUsed} / {emailLimit}</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, emailUsed / emailLimit * 100)}%` }} /></div>
                    <p className="mt-2 text-xs text-gray-500">{Math.max(0, emailLimit - emailUsed)} generations remaining this month</p>
                </div>
                <div className="card p-5">
                    <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Resume analyses</h3><span className="text-sm text-gray-500">{resumeUsed} / {resumeLimit}</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, resumeUsed / resumeLimit * 100)}%` }} /></div>
                    <p className="mt-2 text-xs text-gray-500">{Math.max(0, resumeLimit - resumeUsed)} analyses remaining this month</p>
                </div>
            </section>

            <section className="card p-6">
                <h3 className="font-semibold text-gray-900">Compare plans</h3>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-left text-sm">
                        <thead><tr className="border-b border-gray-200 text-gray-500"><th className="py-3 pr-4 font-medium">Feature</th><th className="py-3 pr-4 font-medium">Free</th><th className="py-3 font-medium">Premium</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr><td className="py-3 pr-4">AI email generations</td><td className="py-3 pr-4">10 / month</td><td className="py-3">300 / month</td></tr>
                            <tr><td className="py-3 pr-4">Resume analyses</td><td className="py-3 pr-4">5 / month</td><td className="py-3">100 / month</td></tr>
                            <tr><td className="py-3 pr-4">Email history & tracking</td><td className="py-3 pr-4">Included</td><td className="py-3">Included</td></tr>
                            <tr><td className="py-3 pr-4">Resume uploads & saved resume</td><td className="py-3 pr-4">Included</td><td className="py-3">Included</td></tr>
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs text-gray-500"><CheckCircleIcon className="h-4 w-4 flex-none" /> Monthly usage resets at the start of each UTC calendar month. Failed AI requests do not consume quota.</p>
            </section>
        </div>
    );
};

export default Billing;
