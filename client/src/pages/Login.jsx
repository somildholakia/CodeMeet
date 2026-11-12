import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import PasswordInput from '../components/auth/PasswordInput.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const redirectAfterLogin = () => {
    const redirectTo = location.state?.from || '/dashboard';
    navigate(redirectTo, { replace: true });
  };

  const onSubmit = async (values) => {
    try {
      await login(values);
      redirectAfterLogin();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onGoogleCredential = useCallback(async (credential) => {
    try {
      await loginWithGoogle(credential);
      redirectAfterLogin();
    } catch (err) {
      toast.error(err.message);
    }
  }, [loginWithGoogle, location.state, navigate]);

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">Email</label>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} error={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label className="block text-sm text-text-secondary">Password</label><Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link></div>
          <PasswordInput placeholder="••••••••" autoComplete="current-password" {...register('password')} error={!!errors.password} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Log in</Button>
      </form>

      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">or continue with</span><span className="h-px flex-1 bg-border" /></div>
      <GoogleSignInButton onCredential={onGoogleCredential} />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:text-primary-hover">Sign up</Link>
      </p>
      <p className="mt-3 text-center text-xs text-text-muted"><Link to="/verify-email" className="hover:text-primary">Need a new verification email?</Link></p>
    </AuthLayout>
  );
}
