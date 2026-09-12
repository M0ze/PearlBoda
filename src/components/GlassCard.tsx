import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  delay = 0,
  hoverEffect = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={hoverEffect ? { y: -10, scale: 1.02 } : {}}
      className={cn(
        'glass-card p-6 md:p-8',
        'hover:shadow-2xl hover:shadow-amber-gold/10 transition-shadow duration-500',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
