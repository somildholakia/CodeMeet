import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { api } from '../lib/api.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [busy, setBusy] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    api.post('/auth/verify-email', { token })
      .then(({ data }) => {
        setEmail(data.email || '');
        setStatus('verified');
      })
      .catch((error) => {
        setStatus('invalid');
        toast.error(error.message);
      });
  }, [token]);

  const resend = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={status === 'verified' ? 'Email verified' : 'Check your inbox'}
      subtitle={status === 'verified' ? 'Your CodeMeet account is ready. Sign in to start collaborating.' : 'Activate your account with the secure link we sent to your email.'}
    >
      {status === 'verified' ? (
        <div className="space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="text-sm text-text-secondary">{email ? `Verified: ${email}` : 'Your email address has been verified.'}</p>
          <Link to="/login"><Button className="w-full">Continue to login</Button></Link>
        </div>
      ) : status === 'verifying' ? (
        <div className="py-8 text-center text-sm text-text-secondary">Checking your verification link…</div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#fff0e9] p-4 text-sm leading-6 text-[#87412e]">
            <MailCheck className="mb-2 h-5 w-5" />
            {status === 'invalid' ? 'This link is invalid or expired. Request a fresh link below.' : 'Open the verification email to activate your account. You can request another link if it has not arrived.'}
          </div>
          <form onSubmit={resend} className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">Email address</label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            <Button type="submit" className="w-full" isLoading={busy}>Resend verification email</Button>
          </form>
          <p className="text-center text-sm text-text-secondary"><Link className="font-medium text-primary hover:underline" to="/login">Back to login</Link></p>
        </div>
      )}
    </AuthLayout>
  );
}
