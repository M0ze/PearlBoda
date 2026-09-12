import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnimatedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-energy-orange text-white hover:shadow-[0_0_20px_rgba(255,107,53,0.5)]',
    secondary: 'bg-amber-gold text-midnight-blue hover:shadow-[0_0_20px_rgba(212,165,116,0.5)]',
    outline: 'bg-transparent border-2 border-amber-gold text-amber-gold hover:bg-amber-gold hover:text-midnight-blue',
    ghost: 'bg-transparent text-pearl-light hover:bg-white/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-4 text-base font-semibold',
    lg: 'px-10 py-5 text-lg font-bold uppercase tracking-wider',
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-full transition-all duration-300 ease-out',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 z-0 bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
    </button>
  );
};
