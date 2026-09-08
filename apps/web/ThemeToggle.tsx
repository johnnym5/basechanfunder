import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './useTheme';

interface ThemeToggleProps {
  className?: string;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, id = 'theme-toggle-btn' }) => {
  const { isDark, toggleThemeWithRipple } = useTheme();

  return (
    <button
      id={id}
      onClick={(e) => toggleThemeWithRipple(e)}
      className={
        className ||
        "p-2.5 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 transition-all"
      }
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
};

export default ThemeToggle;
