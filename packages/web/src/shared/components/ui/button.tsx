'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center whitespace-nowrap font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-neutral-100 text-neutral-950 shadow-none hover:bg-neutral-100/90 active:bg-neutral-100/80',

        secondary:
          'bg-neutral-900 border border-white/10 text-neutral-100 hover:bg-neutral-800 hover:border-white/20 active:bg-neutral-800/80 active:border-white/25',

        ghost:
          'bg-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-100 active:bg-white/10',

        danger:
          'bg-transparent border border-red-fluor text-red-fluor hover:bg-red-fluor/10 active:bg-red-fluor/20 disabled:border-red-fluor/50 disabled:text-red-fluor/50',

        link: 'bg-transparent text-neutral-400 underline-offset-4 hover:text-neutral-100 hover:underline',
      },
      size: {
        xs: 'h-6 px-1.5 rounded-md text-xs',
        sm: 'h-7 px-2 rounded-lg text-xs',
        default: 'h-9 px-3 rounded-[10px] text-sm',
        lg: 'h-10 px-4 rounded-xl text-sm', 
        icon: 'h-9 w-9 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          disabled={props.disabled || loading}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-current" />
        )}

        <span
          className={cn(
            'inline-flex items-center justify-center gap-2 transition-opacity',
            loading ? 'opacity-0' : 'opacity-100',
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
