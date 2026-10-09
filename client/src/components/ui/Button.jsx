import { cn } from '../../lib/cn.js';

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-white shadow-sm shadow-[#f45d3e]/15',
  secondary: 'bg-white hover:bg-[#fff5ee] text-text border border-border',
  ghost: 'hover:bg-[#fff0e9] text-text-secondary hover:text-primary',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30',
};
const sizes = { sm: 'h-9 px-4 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

export default function Button({ variant='primary', size='md', isLoading=false, className, children, disabled, ...props }) {
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-px',variants[variant],sizes[size],className)} disabled={disabled||isLoading} {...props}>{isLoading&&<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>}{children}</button>;
}
