import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                setUser(JSON.parse(userInfo));
            } catch (e) {
                localStorage.removeItem('userInfo');
            }
        }
        setLoading(false);
    }, []);

    // Stable references so effects that depend on them (e.g. the Google button) don't re-run every render
    const login = useCallback((userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    const value = useMemo(() => ({ user, login, logout, loading }), [user, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
