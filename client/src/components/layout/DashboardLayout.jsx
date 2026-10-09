import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const headings = {
  '/dashboard': ['Your workspace', 'A good day to build something.'],
  '/dashboard/meetings': ['Meeting library', 'Pick up where your team left off.'],
  '/dashboard/profile': ['Your profile', 'Make this space feel like yours.'],
};

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [eyebrow, subtitle] = headings[location.pathname] || ['CodeMeet', 'Make something great together.'];
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return <div className="flex h-screen bg-background">
    <div className="hidden md:block"><Sidebar/></div>
    {mobileOpen&&<div className="fixed inset-0 z-40 md:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-[#28231f]/30 backdrop-blur-sm" onClick={()=>setMobileOpen(false)}/><div className="relative z-50 h-full w-fit"><Sidebar onNavigate={()=>setMobileOpen(false)}/></div></div>}
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex min-h-[72px] items-center justify-between border-b border-[#eee4d8] bg-[#fffaf4]/85 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-3"><button className="rounded-xl p-2 text-text-secondary hover:bg-white md:hidden" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5"/></button><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p><p className="mt-1 hidden text-xs text-text-muted sm:block">{subtitle}</p></div></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-text">{user?.name}</p><p className="text-[11px] text-text-muted">Ready to collaborate</p></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dff2e7] font-bold text-[#287858]">{user?.name?.[0]?.toUpperCase()||'U'}</div><button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-[#ffe8e6] hover:text-danger" aria-label="Log out"><LogOut className="h-4 w-4"/></button></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-7"><Outlet/></main>
    </div>
  </div>;
}
