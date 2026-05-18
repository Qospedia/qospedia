import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-lg bg-[#FCFCFC] dark:bg-[#1A1A1A] text-[#050505] dark:text-[#FCFCFC] text-[14px] font-normal leading-[20px] p-3 border border-[rgba(5,5,5,0.06)] dark:border-[rgba(252,252,252,0.1)] placeholder:text-[#858585] dark:placeholder:text-[#636363] focus:outline-none focus:border-[rgba(59,130,246,0.3)] focus:ring-2 focus:ring-[rgba(59,130,246,0.1)] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };