import { motion } from 'framer-motion';

import { cn } from '../lib/utils';
import { VARIANTS } from '../tokens/motion';

type StaggerListProps = {
  children: React.ReactNode;
  className?: string;
};

function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={VARIANTS.staggerContainer}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
};

function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={VARIANTS.staggerItem} className={cn(className)}>
      {children}
    </motion.div>
  );
}

export { StaggerItem,StaggerList };
