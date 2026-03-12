import { motion } from 'framer-motion';

import { cn } from '../lib/utils';
import { VARIANTS } from '../tokens/motion';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={VARIANTS.page}
      className={cn('flex-1', className)}
    >
      {children}
    </motion.div>
  );
}

export { PageTransition };
