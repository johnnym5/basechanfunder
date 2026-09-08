import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
  toggleThemeWithRipple: (event?: React.MouseEvent | MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') || localStorage.getItem('bcf-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const isDark = theme === 'dark';

  const applyThemeToDOM = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('bcf-theme', newTheme);
    } catch (e) {
      // Ignore quota errors in restricted environments
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleThemeWithRipple = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';

    // Graceful fallback if View Transitions API is not supported or user prefers reduced motion
    if (
      typeof document === 'undefined' ||
      !('startViewTransition' in document) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      return;
    }

    // Calculate origin coordinates from button bounding box or mouse event
    let x = window.innerWidth;
    let y = 0;

    if (event) {
      const target = (event.currentTarget || event.target) as HTMLElement | null;
      if (target && typeof target.getBoundingClientRect === 'function') {
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (typeof event.clientX === 'number' && event.clientX > 0) {
        x = event.clientX;
        y = event.clientY;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const featherWidth = 350;
    const totalRadius = Math.ceil(endRadius + featherWidth + 120);

    // Set CSS custom properties so CSS ::view-transition-new(root) can read the origin
    document.documentElement.style.setProperty('--ripple-x', `${x}px`);
    document.documentElement.style.setProperty('--ripple-y', `${y}px`);

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setThemeState(nextTheme);
      });
      applyThemeToDOM(nextTheme);
    });

    transition.ready
      ?.then(() => {
        const keyframes: Keyframe[] = [];
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const eased = p < 0.5
            ? 4 * p * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2;
          const currentR = Math.round(eased * totalRadius);
          const innerR = Math.max(0, currentR - featherWidth);

          keyframes.push({
            maskImage: `radial-gradient(circle at ${x}px ${y}px, black 0%, black ${innerR}px, transparent ${currentR}px)`,
            WebkitMaskImage: `radial-gradient(circle at ${x}px ${y}px, black 0%, black ${innerR}px, transparent ${currentR}px)`,
          });
        }

        const anim = document.documentElement.animate(keyframes, {
          duration: 1200,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
          fill: 'forwards',
        });

        anim.finished
          .catch(() => {})
          .finally(() => {
            document.documentElement.style.removeProperty('--ripple-x');
            document.documentElement.style.removeProperty('--ripple-y');
          });
      })
      .catch((err: any) => {
        console.warn('View Transition animation interrupted:', err);
      });
  };

  const toggleTheme = (event?: React.MouseEvent | MouseEvent) => {
    toggleThemeWithRipple(event);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, toggleThemeWithRipple, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
