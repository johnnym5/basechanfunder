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

/**
 * Calculates button/click origin coordinates and triggers a slower (1150ms)
 * heavily edge-faded radial ripple view transition with a 280px soft gradient zone.
 */
export function triggerThemeRipple(
  event?: React.MouseEvent | MouseEvent,
  onThemeChange?: () => void
): void {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    onThemeChange?.();
    return;
  }

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

  const featherWidth = 280;
  const totalRadius = Math.ceil(endRadius + featherWidth + 120);

  document.documentElement.style.setProperty('--ripple-x', `${x}px`);
  document.documentElement.style.setProperty('--ripple-y', `${y}px`);
  document.documentElement.style.setProperty('--ripple-end', `${totalRadius}px`);

  const transition = (document as any).startViewTransition(() => {
    onThemeChange?.();
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
        duration: 1150,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        pseudoElement: '::view-transition-new(root)',
      });

      anim.finished
        .catch(() => {})
        .finally(() => {
          document.documentElement.style.removeProperty('--ripple-x');
          document.documentElement.style.removeProperty('--ripple-y');
          document.documentElement.style.removeProperty('--ripple-end');
        });
    })
    .catch((err: any) => {
      console.warn('View Transition animation interrupted:', err);
    });
}

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
    } catch (e) {}
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleThemeWithRipple = (event?: React.MouseEvent | MouseEvent) => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';

    if (
      typeof document === 'undefined' ||
      !('startViewTransition' in document) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      return;
    }

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

    const featherWidth = 280;
    const totalRadius = Math.ceil(endRadius + featherWidth + 120);

    document.documentElement.style.setProperty('--ripple-x', `${x}px`);
    document.documentElement.style.setProperty('--ripple-y', `${y}px`);
    document.documentElement.style.setProperty('--ripple-end', `${totalRadius}px`);

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
          duration: 1150,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        });

        anim.finished
          .catch(() => {})
          .finally(() => {
            document.documentElement.style.removeProperty('--ripple-x');
            document.documentElement.style.removeProperty('--ripple-y');
            document.documentElement.style.removeProperty('--ripple-end');
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

export default useTheme;
