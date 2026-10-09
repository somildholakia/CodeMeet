import { cn } from '../../lib/cn.js';

export default function Card({ className, children, ...props }) {
  return <div className={cn('rounded-2xl border border-border bg-card shadow-sm', className)} {...props}>{children}</div>;
}
