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

    // Radius to reach the furthest corner of viewport
    // We add a generous padding (220px) so the clip-path edge overshoots the screen,
    // making the transition boundary feel naturally faded rather than hard-cut.
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const totalRadius = Math.ceil(endRadius + 220);

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
        // clip-path: circle() IS animatable on pseudo-elements via Web Animations API.
        // This is the correct approach — mask-image gradients are NOT animatable this way.
        const anim = document.documentElement.animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${totalRadius}px at ${x}px ${y}px)` },
          ],
          {
            duration: 1400,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
            fill: 'forwards', // Keep final clip-path until pseudo-elements are removed
          }
        );

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
