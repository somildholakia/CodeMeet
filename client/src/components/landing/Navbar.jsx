import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Code2 } from 'lucide-react';
import Button from '../ui/Button.jsx';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-text">
          <Code2 className="h-5 w-5 text-primary" />
          CodeMeet
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-secondary transition-colors hover:text-text"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>

        <button
          className="text-text-secondary md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-text-secondary" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link to="/register" className="flex-1">
                <Button size="sm" className="w-full">Get started</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
