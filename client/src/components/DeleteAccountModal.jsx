import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import GoogleButton from './GoogleButton';
import { GOOGLE_CLIENT_ID } from '../config';

const DeleteAccountModal = ({ email, googleLinked, onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const firstField = useRef(null);

    const emailMatches = confirmEmail.trim().toLowerCase() === (email || '').toLowerCase();
    const emailMatchesRef = useRef(false);
    emailMatchesRef.current = emailMatches;
    const confirmEmailRef = useRef('');
    confirmEmailRef.current = confirmEmail;

    useEffect(() => {
        firstField.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [busy, onClose]);

    const submit = async (proof) => {
        setBusy(true);
        try {
            await api.delete('/account', { data: { confirmEmail, ...proof } });
            toast.success('Your account has been deleted');
            logout();
            navigate('/', { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not delete your account');
            setBusy(false);
        }
    };

    const handlePassword = (e) => {
        e.preventDefault();
        if (!emailMatches || !password) return;
        submit({ password });
    };

    const handleGoogle = (credential) => {
        if (!emailMatchesRef.current) {
            toast.error('Type your email address first, then confirm with Google.');
            return;
        }
        submit({ credential });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="absolute inset-0 bg-gray-900/50" onClick={() => !busy && onClose()} />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-pop">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-50">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </span>
                    <div>
                        <h3 id="delete-title" className="text-lg font-semibold text-gray-900">Delete your account?</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            This permanently deletes your profile, generated emails, saved resume and resume analyses. It cannot be undone.
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePassword} className="mt-5 space-y-4">
                    <div>
                        <label className="label" htmlFor="del-email">Type <span className="font-semibold">{email}</span> to confirm</label>
                        <input
                            id="del-email"
                            ref={firstField}
                            className="input"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            autoComplete="off"
                            disabled={busy}
                        />
                    </div>

                    <div>
                        <label className="label" htmlFor="del-pw">
                            Password {googleLinked && <span className="font-normal text-gray-400">(if you have set one)</span>}
                        </label>
                        <input
                            id="del-pw"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            disabled={busy}
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={busy} className="btn-secondary">Cancel</button>
                        <button
                            type="submit"
                            disabled={busy || !emailMatches || !password}
                            className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                        >
                            {busy ? 'Deleting...' : 'Delete my account'}
                        </button>
                    </div>
                </form>

                {googleLinked && GOOGLE_CLIENT_ID && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                        <p className="mb-3 text-center text-xs text-gray-500">Signed up with Google? Confirm with Google instead of a password.</p>
                        <GoogleButton onCredential={handleGoogle} text="continue_with" />
                    </div>
                )}
                {googleLinked && !GOOGLE_CLIENT_ID && (
                    <p className="mt-4 text-xs text-gray-500">If you only ever signed in with Google, use "Forgot password" on the sign-in page to set a password first.</p>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountModal;
