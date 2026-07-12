import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, User, Code2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/meetings', label: 'Meetings', icon: Video },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full w-60 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 px-5 font-semibold text-text">
        <Code2 className="h-5 w-5 text-primary" />
        CodeMeet
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-card hover:text-text'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
