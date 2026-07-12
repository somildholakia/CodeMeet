import { cn } from '../../lib/cn.js';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card shadow-sm shadow-black/20', className)}
      {...props}
    >
      {children}
    </div>
  );
}
