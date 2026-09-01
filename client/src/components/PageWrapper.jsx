import React from 'react';
import { motion } from 'framer-motion';

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

export const PageWrapper = ({ children, className = '' }) => (
  <motion.div 
    {...pageTransition} 
    className={`min-h-screen dark:bg-slate-950 dark:text-slate-100 ${className}`}
  >
    {children}
  </motion.div>
);
