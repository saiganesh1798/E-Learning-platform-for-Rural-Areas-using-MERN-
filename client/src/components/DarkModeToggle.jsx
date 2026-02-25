import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = () => {
    const { user, toggleTheme } = useAuth();

    if (!user) return null;

    const isDark = user.theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${isDark
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
            aria-label="Toggle Dark Mode"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default DarkModeToggle;
