import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import Card from '../ui/Card.jsx';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-text">
          <Code2 className="h-5 w-5 text-primary" />
          CodeMeet
        </Link>

        <Card className="p-8">
          <h1 className="text-lg font-semibold text-text">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}
