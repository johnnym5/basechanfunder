import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { bouncySpring, tapSpring } from '../../utils/motionPresets';

export interface BouncyCardProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  isInteractive?: boolean;
}

export const BouncyCard = React.forwardRef<HTMLDivElement, BouncyCardProps>(
  ({ children, className = '', isInteractive = true, whileHover, whileTap, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          isInteractive
            ? whileHover || { y: -3, scale: 1.005, transition: bouncySpring }
            : undefined
        }
        whileTap={
          isInteractive && props.onClick
            ? whileTap || { scale: 0.995, transition: tapSpring }
            : undefined
        }
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

BouncyCard.displayName = 'BouncyCard';

export default BouncyCard;
