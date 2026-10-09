import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'surface' | 'sidebar';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'surface',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const actionLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  const variantClasses =
    variant === 'sidebar'
      ? 'p-2 text-[var(--soft-apricot)] bg-white/10 hover:bg-white/18 border border-white/15'
      : 'px-3 py-2 bg-surface text-carbon hover:bg-subtle border border-stone-border shadow-card';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={actionLabel}
      title={actionLabel}
      aria-pressed={isDark}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-[var(--cotton-candy)] shrink-0" />
      ) : (
        <Sun
          className={`w-4 h-4 shrink-0 ${
            variant === 'sidebar'
              ? 'text-[var(--soft-apricot)]'
              : 'text-[var(--berry-crush)]'
          }`}
        />
      )}
      {showLabel && (
        <span>{isDark ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
};
