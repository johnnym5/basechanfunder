import { Transition, Variants } from 'framer-motion';

/**
 * Standardized Framer Motion Spring Physics Curves
 */
export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 22,
  mass: 0.8
};

export const modalSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25
};

export const tapSpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 15
};

export const drawerSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.9
};

export const subtleHoverSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25
};

/**
 * Shared Animation Variants
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' }
  }
};

export const modalBoxVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: modalSpring
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    transition: { duration: 0.18, ease: 'easeIn' }
  }
};

export const drawerVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0.6
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: drawerSpring
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

export const accordionVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 350, damping: 25 },
      opacity: { duration: 0.2 }
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.15 }
    }
  }
};
