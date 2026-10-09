import { Link } from 'react-router-dom';
import { Code2, Sparkles } from 'lucide-react';
import Card from '../ui/Card.jsx';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-[#f7c4b4]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#d9ccff]/45 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-bold tracking-tight text-text">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffede6] text-primary"><Code2 className="h-5 w-5" /></span>
          <span className="text-lg">CodeMeet</span>
        </Link>
        <Card className="rounded-[1.75rem] border-white/80 p-7 shadow-[0_24px_70px_-25px_rgba(75,47,28,.2)] sm:p-9">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[#fff0e9] px-3 py-1.5 text-[11px] font-semibold text-[#bb4c32]"><Sparkles className="h-3.5 w-3.5" /> A good place to build together</div>
          <h1 className="text-2xl font-semibold tracking-[-.04em] text-text">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-text-secondary">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </Card>
        <p className="mt-6 text-center text-xs text-text-muted"><Link to="/" className="transition-colors hover:text-primary">← Back to CodeMeet</Link></p>
      </div>
    </div>
  );
}
