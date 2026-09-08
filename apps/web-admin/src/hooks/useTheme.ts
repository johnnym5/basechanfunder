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

  // Radius to reach the furthest corner of viewport.
  // Extra 220px padding makes the clip edge overshoot the screen,
  // which combined with the CSS drop-shadow gives a naturally soft look.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const totalRadius = Math.ceil(endRadius + 220);

  // Set CSS variables for CSS origin reference
  document.documentElement.style.setProperty('--ripple-x', `${x}px`);
  document.documentElement.style.setProperty('--ripple-y', `${y}px`);

  const transition = (document as any).startViewTransition(() => {
    onThemeChange?.();
  });

  transition.ready
    ?.then(() => {
      // clip-path: circle() IS properly animatable via Web Animations API on pseudo-elements.
      // mask-image gradients are NOT — this was the original bug causing the sharp/broken look.
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
