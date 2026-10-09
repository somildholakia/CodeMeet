import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Code2, ArrowUpRight } from 'lucide-react';
import Button from '../ui/Button.jsx';

const links = [{ label: 'What you get', href: '#features' }, { label: 'How it works', href: '#how-it-works' }];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-[#eee4d8]/80 bg-[#fffaf4]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-text"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#ffede6] text-primary"><Code2 className="h-5 w-5"/></span><span className="text-lg">CodeMeet<span className="text-primary">.</span><span className="ml-2 hidden rounded-full bg-[#e5f6ec] px-2 py-1 align-middle text-[9px] font-bold uppercase tracking-wider text-[#23866a] sm:inline-block">build together</span></span></Link>
      <nav className="hidden items-center gap-8 md:flex">{links.map(l=><a key={l.href} href={l.href} className="text-sm font-medium text-text-secondary transition-colors hover:text-primary">{l.label}</a>)}</nav>
      <div className="hidden items-center gap-2 md:flex"><Link to="/login"><Button variant="ghost" size="sm" className="rounded-full px-4">Log in</Button></Link><Link to="/register"><Button size="sm" className="rounded-full px-5">Get started <ArrowUpRight className="h-4 w-4"/></Button></Link></div>
      <button className="rounded-xl p-2 text-text-secondary hover:bg-white md:hidden" onClick={()=>setOpen(v=>!v)} aria-label="Toggle navigation">{open?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}</button>
    </div>
    {open&&<div className="border-t border-[#eee4d8] bg-[#fffaf4] px-4 pb-5 md:hidden"><nav className="flex flex-col gap-4 pt-4">{links.map(l=><a key={l.href} href={l.href} className="text-sm font-medium text-text-secondary" onClick={()=>setOpen(false)}>{l.label}</a>)}<div className="flex gap-3 pt-1"><Link to="/login" className="flex-1"><Button variant="secondary" size="sm" className="w-full rounded-full">Log in</Button></Link><Link to="/register" className="flex-1"><Button size="sm" className="w-full rounded-full">Get started</Button></Link></div></nav></div>}
  </header>;
}
