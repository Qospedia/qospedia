import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[48px] w-full rounded-full bg-[#F7F7F7] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] text-[14px] font-normal leading-[20px] px-4 py-0 border border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363] focus:outline-none focus:border-[rgba(59,130,246,0.3)] focus:ring-2 focus:ring-[rgba(59,130,246,0.1)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F2F2F2] dark:disabled:bg-[#0a0a0a] disabled:text-[#858585]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };