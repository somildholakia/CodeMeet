import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        error && 'border-danger focus:border-danger focus:ring-danger',
        className
      )}
      {...props}
    />
  );
});

export default Input;
