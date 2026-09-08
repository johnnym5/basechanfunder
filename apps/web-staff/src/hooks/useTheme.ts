import React, { useContext } from 'react';
import { ThemeContext, ThemeContextType } from '../context/ThemeContext';

export type { Theme, ThemeContextType } from '../context/ThemeContext';

/**
 * Calculates button/click origin coordinates and triggers a slower (1150ms)
 * heavily edge-faded radial ripple view transition with a 280px soft gradient zone.
 */
export function triggerThemeRipple(
  event?: React.MouseEvent | MouseEvent,
  onThemeChange?: () => void
): void {
  // Graceful fallback for non-supported browsers or users with reduced motion preferences
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    onThemeChange?.();
    return;
  }

  // Calculate coordinates: center of clicked element, or cursor position, or default to top-right
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
  // Extra padding makes the clip edge overshoot, giving it a naturally soft feel.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const featherWidth = 350;
  const totalRadius = Math.ceil(endRadius + featherWidth + 120);

  // Set CSS variables for CSS origin reference
  document.documentElement.style.setProperty('--ripple-x', `${x}px`);
  document.documentElement.style.setProperty('--ripple-y', `${y}px`);

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
}

/**
 * Hook to access current theme, dark state boolean, and ripple toggle handlers.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;
