import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#050505] text-[#FCFCFC] hover:bg-[#1a1a1a] shadow-none',
        destructive: 'bg-[#EF4444] text-[#FCFCFC] hover:bg-[#DC2626]',
        outline: 'border border-[rgba(5,5,5,0.1)] bg-[#F7F7F7] text-[#050505] hover:bg-[#EFEFEF] hover:border-[rgba(5,5,5,0.15)]',
        secondary: 'bg-[#F7F7F7] text-[#050505] hover:bg-[#EFEFEF]',
        ghost: 'bg-transparent text-[#636363] hover:bg-[rgba(5,5,5,0.05)] hover:text-[#050505]',
        link: 'text-[#2563EB] underline-offset-4 hover:underline',
        accent: 'bg-[#2563EB] text-[#FCFCFC] hover:bg-[#1E40AF]',
      },
      size: {
        default: 'h-[34px] rounded-full px-4 py-[6px] text-[14px] font-medium leading-[20px]',
        sm: 'h-[32px] rounded-full px-4 py-[6px] text-[14px] font-medium leading-[20px]',
        lg: 'h-[40px] rounded-full px-6 py-[8px] text-[16px] font-medium',
        icon: 'h-[36px] w-[36px] rounded-full p-[6px] text-[16px]',
        'icon-sm': 'h-[32px] w-[32px] rounded-full p-0 text-[16px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };