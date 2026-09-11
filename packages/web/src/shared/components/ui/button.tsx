'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  [
    'group/button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium',
    'border border-transparent bg-clip-padding',
    'transition-all duration-200',
    'select-none outline-none',
    'focus-visible:border-white/20 focus-visible:ring-3 focus-visible:ring-white/20',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-neutral-100 text-neutral-950 shadow-none hover:bg-neutral-100/80 active:bg-neutral-100/70',

        secondary:
          'border-white/10 bg-neutral-900 text-neutral-100 hover:bg-neutral-900/80 hover:border-white/20 active:bg-neutral-900/70',

        ghost:
          'bg-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-100 active:bg-white/10',

        danger:
          'border-red-fluor bg-transparent text-red-fluor hover:bg-red-fluor/10 active:bg-red-fluor/20 disabled:border-red-fluor/50 disabled:text-red-fluor/50',

        link: 'bg-transparent text-neutral-400 underline-offset-4 hover:text-neutral-100 hover:underline',
      },

      size: {
        xs: 'h-6 rounded-md px-1.5 text-xs [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-7 rounded-lg px-2 text-sm [&_svg:not([class*="size-"])]:size-3.5',
        default: 'h-9 rounded-[10px] px-3 text-sm [&_svg:not([class*="size-"])]:size-4',
        lg: 'h-10 rounded-xl px-4 text-sm [&_svg:not([class*="size-"])]:size-4',
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
          <Loader2 className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-current" />
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
