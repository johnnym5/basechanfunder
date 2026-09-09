import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { bouncySpring, tapSpring } from '../../utils/motionPresets';

export interface BouncyButtonProps extends HTMLMotionProps<'button'> {
  children?: React.ReactNode;
  disabled?: boolean;
}

export const BouncyButton = React.forwardRef<HTMLButtonElement, BouncyButtonProps>(
  ({ children, className = '', disabled, whileHover, whileTap, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileHover={
          disabled
            ? undefined
            : whileHover || { scale: 1.025, transition: bouncySpring }
        }
        whileTap={
          disabled
            ? undefined
            : whileTap || { scale: 0.94, transition: tapSpring }
        }
        className={`inline-flex items-center justify-center select-none active:outline-none focus-visible:outline-none ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

BouncyButton.displayName = 'BouncyButton';

export default BouncyButton;
