'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const inputVariants = cva(
  [
    'block w-full bg-transparent border shadow-none transition-colors text-sm',
    'file:border-0 file:bg-transparent file:font-medium file:text-sm',
    'placeholder:text-neutral-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-white/10 text-neutral-100',
          'hover:border-white/20',
          'focus-visible:border-white/20',
        ].join(' '),
      },
      size: {
        default: 'h-9 px-3 rounded-[10px]',
        sm: 'h-8 px-2 rounded-lg text-xs',
        lg: 'h-10 px-4 rounded-xl text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input, inputVariants };
