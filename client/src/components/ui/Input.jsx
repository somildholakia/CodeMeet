import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return <input ref={ref} className={cn('h-11 w-full rounded-xl border border-[#e8ded2] bg-white px-3.5 text-sm text-text placeholder:text-[#b0a59a] transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-[#f45d3e]/10',error&&'border-danger focus:border-danger focus:ring-danger/10',className)} {...props}/>;
});
export default Input;
