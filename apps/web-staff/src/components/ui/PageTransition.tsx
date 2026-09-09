import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { pageTransitionVariants } from '../../utils/motionPresets';

export interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey?: string;
  className?: string;
  variants?: Variants;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  className = 'w-full h-full flex flex-col flex-1',
  variants = pageTransitionVariants,
  mode = 'wait'
}) => {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={transitionKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
