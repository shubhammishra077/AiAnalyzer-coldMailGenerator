import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config';

let gsiPromise = null;
const loadGsi = () => {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (!gsiPromise) {
        gsiPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => { gsiPromise = null; reject(new Error('Failed to load Google sign-in')); };
            document.head.appendChild(script);
        });
    }
    return gsiPromise;
};

// "Continue with Google". Renders nothing when VITE_GOOGLE_CLIENT_ID is not set.
const GoogleButton = ({ onSuccess, onCredential, text = 'continue_with' }) => {
    const containerRef = useRef(null);
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    // When provided, the raw Google credential is handed to the caller instead of signing in
    const onCredentialRef = useRef(onCredential);
    onCredentialRef.current = onCredential;
    const { login } = useAuth();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return undefined;
        let cancelled = false;

        loadGsi()
            .then(() => {
                if (cancelled || !containerRef.current) return;
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: async ({ credential }) => {
                        if (onCredentialRef.current) {
                            onCredentialRef.current(credential);
                            return;
                        }
                        try {
                            const { data } = await api.post('/auth/google', { credential });
                            login(data);
                            toast.success('Signed in with Google');
                            onSuccessRef.current?.(data);
                        } catch (error) {
                            toast.error(error.response?.data?.message || 'Google sign-in failed');
                        }
                    },
                });
                const width = Math.min(400, Math.max(200, containerRef.current.clientWidth || 320));
                window.google.accounts.id.renderButton(containerRef.current, {
                    type: 'standard', theme: 'outline', size: 'large', text, shape: 'rectangular', width,
                });
            })
            .catch(() => !cancelled && setFailed(true));

        return () => { cancelled = true; };
    }, [login, text]);

    if (!GOOGLE_CLIENT_ID) return null;
    if (failed) {
        return <p className="text-center text-xs text-gray-500">Google sign-in is unavailable right now.</p>;
    }
    return <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />;
};

export default GoogleButton;
