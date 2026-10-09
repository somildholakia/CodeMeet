import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, User, Code2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/meetings', label: 'Meetings', icon: Video },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ onNavigate }) {
  return <aside className="flex h-full w-64 flex-col border-r border-[#eee4d8] bg-white">
    <div className="flex h-[72px] items-center gap-2.5 border-b border-[#f2eae1] px-5 font-bold tracking-tight text-text"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#ffede6] text-primary"><Code2 className="h-5 w-5"/></span><span className="text-lg">CodeMeet<span className="text-primary">.</span></span></div>
    <div className="px-5 pt-7 pb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a69a8e]">Workspace</div>
    <nav className="flex-1 space-y-1 px-3">{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} onClick={onNavigate} className={({isActive})=>cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',isActive?'bg-[#fff0e9] text-[#d94f32]':'text-[#786e65] hover:bg-[#faf4ed] hover:text-text')}><Icon className="h-[18px] w-[18px]"/>{label}</NavLink>)}</nav>
    <div className="m-3 rounded-2xl bg-[#fff1e9] p-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-primary"><Sparkles className="h-4 w-4"/></span><p className="mt-3 text-sm font-semibold text-[#573b30]">Better together.</p><p className="mt-1 text-xs leading-5 text-[#8b6a5d]">Invite a teammate and turn a tricky problem into a shared win.</p></div>
  </aside>;
}
