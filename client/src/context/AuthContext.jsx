import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['x-auth-token'] = token;
                // Ideally, verifying token with backend here
                // For Sprint 1, we decode or trust if backend verification endpoint is not yet ready for "me"
                // But let's assume we decode or basic persist
                // user data should be stored in local storage or fetched
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    applyTheme(parsedUser.theme || 'light');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(res.data.user);
            applyTheme(res.data.user.theme || 'light');
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.response?.data?.msg || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('http://127.0.0.1:5000/api/auth/register', userData);
            localStorage.setItem('token', res.data.token);

            // Check if status is pending (e.g. for Teachers)
            const user = res.data.user;
            if (user && user.status === 'pending') {
                // Do NOT auto-login if pending
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
                // Return success but indicate pending status
                return { success: true, pending: true };
            }

            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['x-auth-token'] = res.data.token;
            setUser(user);
            applyTheme(user.theme || 'light');
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.msg || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
        applyTheme('light');
    };

    const toggleTheme = async () => {
        if (!user) return;
        const newTheme = user.theme === 'dark' ? 'light' : 'dark';
        try {
            // Update backend
            const res = await axios.put('http://127.0.0.1:5000/api/users/theme', { theme: newTheme });

            // Update local state and storage
            const updatedUser = { ...user, theme: res.data.theme };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Apply to document
            applyTheme(res.data.theme);
        } catch (err) {
            console.error('Failed to update theme', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, toggleTheme }}>
            {children}
        </AuthContext.Provider>
    );
};
