import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <button
      id="theme-toggle"
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label="Toggle visual theme"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 hover:rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
