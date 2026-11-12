import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import PasswordInput from '../components/auth/PasswordInput.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name must be 60 characters or fewer'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
});

export default function Register() {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const result = await registerUser(values);
      toast.success(result.message);
      navigate(`/verify-email?email=${encodeURIComponent(result.email || values.email)}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onGoogleCredential = useCallback(async (credential) => {
    try {
      await loginWithGoogle(credential);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  }, [loginWithGoogle, navigate]);

  return (
    <AuthLayout title="Create your account" subtitle="Start collaborating in minutes">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Name</label>
          <Input placeholder="Ada Lovelace" autoComplete="name" {...register('name')} error={!!errors.name} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Password</label>
          <PasswordInput placeholder="At least 8 characters" autoComplete="new-password" {...register('password')} error={!!errors.password} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          <p className="mt-1.5 text-[11px] text-text-muted">Use a unique password with at least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Create account</Button>
      </form>

      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">or sign up with</span><span className="h-px flex-1 bg-border" /></div>
      <GoogleSignInButton onCredential={onGoogleCredential} />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:text-primary-hover">Log in</Link>
      </p>
    </AuthLayout>
  );
}
