import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import PasswordInput from '../components/auth/PasswordInput.jsx';
import Button from '../components/ui/Button.jsx';
import { api } from '../lib/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return toast.error('Use at least 8 characters.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters and avoid reusing an old password.">
      {!token ? (
        <div className="space-y-4"><p className="text-sm text-danger">This reset link is missing or invalid.</p><Link to="/forgot-password"><Button className="w-full">Request a new link</Button></Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">New password</label><PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">Confirm password</label><PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" required /></div>
          <Button type="submit" className="w-full" isLoading={busy}>Update password</Button>
        </form>
      )}
    </AuthLayout>
  );
}
