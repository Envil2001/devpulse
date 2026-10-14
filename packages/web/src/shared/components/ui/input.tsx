'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const inputVariants = cva(
  [
    'block w-full bg-background border shadow-none transition-colors text-foreground',
    'file:border-0 file:bg-transparent file:font-medium file:text-sm file:text-foreground',
    'placeholder:text-subtle',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-gray-alpha-200',
          'hover:border-gray-alpha-300',
          'focus-visible:border-gray-alpha-300',
        ].join(' '),
      },
      size: {
        sm: 'h-7 px-2 rounded-lg text-xs',
        default: 'h-8 px-2.5 rounded-[10px] text-[13px]',
        lg: 'h-10 px-3 rounded-xl text-sm',
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
