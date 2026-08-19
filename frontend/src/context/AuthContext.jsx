/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, try to restore session from local storage
    useEffect(() => {
        const restoreSession = async () => {
            if (authService.isLoggedIn()) {
                try {
                    const me = await authService.getMe();
                    setUser(me);
                } catch {
                    // Token expired and refresh failed — clear state
                    setUser(null);
                }
            }
            setLoading(false);
        };

        restoreSession();

        // Listen for logout events emitted by the api interceptor
        const handleLogout = () => setUser(null);
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const login = useCallback(async (email, password) => {
        const userData = await authService.login(email, password);
        setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (name, email, password) => {
        const userData = await authService.register(name, email, password);
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        // Clear user state FIRST so protected routes react immediately
        // (redirect to /login) rather than waiting on the network call.
        setUser(null);
        await authService.logout();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
