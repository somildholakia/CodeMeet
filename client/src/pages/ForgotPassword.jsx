import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { api } from '../lib/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We’ll send a secure reset link if the email belongs to an account with password sign-in.">
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#e5f6ec] p-4 text-sm leading-6 text-[#287858]">Check your inbox for the next step. For security, this confirmation is shown whether or not an account exists.</div>
          <Link to="/login"><Button className="w-full" variant="secondary">Back to login</Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">Email address</label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
          <Button type="submit" className="w-full" isLoading={busy}>Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-text-secondary"><Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link></p>
    </AuthLayout>
  );
}
