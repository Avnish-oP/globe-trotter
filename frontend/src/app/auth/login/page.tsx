'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Plane } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      router.push(redirectTo);
    } catch (error: any) {
      setError('root', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcebff] relative overflow-hidden">
      {/* Blurred adventure background image */}
      <div className="fixed inset-0 w-full h-full bg-cover bg-center blur-[6px] opacity-60 -z-20" style={{ backgroundImage: "url('/mountain-hiker-bg.png')" }} aria-hidden="true" />
      {/* Doodles: more, larger, and darker for visibility, some animated */}
      <style>{`
        @keyframes floatDoodle {
          0% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-16px) scale(1.05) rotate(3deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes rotateDoodle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Large, dark doodles */}
  <svg className="absolute top-8 left-8 w-20 h-20 opacity-70" fill="none" stroke="#bca3e3" strokeWidth="2.2" viewBox="0 0 48 48" style={{ animation: 'floatDoodle 6s ease-in-out infinite' }}><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute bottom-8 left-16 w-24 h-24 opacity-60" fill="none" stroke="#d1c4e9" strokeWidth="2.2" viewBox="0 0 48 48" style={{ animation: 'floatDoodle 7s ease-in-out infinite 1s' }}><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  <svg className="absolute top-16 right-12 w-24 h-24 opacity-60" fill="none" stroke="#bca3e3" strokeWidth="2.2" viewBox="0 0 48 48" style={{ animation: 'floatDoodle 8s ease-in-out infinite 2s' }}><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
  <svg className="absolute bottom-12 right-8 w-20 h-20 opacity-70" fill="none" stroke="#d1c4e9" strokeWidth="2.2" viewBox="0 0 48 48" style={{ animation: 'floatDoodle 6.5s ease-in-out infinite 1.5s' }}><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
  {/* Medium doodles, some rotating */}
  <svg className="absolute top-1/4 left-1/5 w-14 h-14 opacity-50" fill="none" stroke="#bca3e3" strokeWidth="1.8" viewBox="0 0 48 48" style={{ animation: 'rotateDoodle 12s linear infinite' }}><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>
  <svg className="absolute top-1/3 right-1/6 w-14 h-14 opacity-50" fill="none" stroke="#d1c4e9" strokeWidth="1.8" viewBox="0 0 48 48" style={{ animation: 'rotateDoodle 10s linear infinite 2s' }}><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>
  <svg className="absolute bottom-1/4 left-1/4 w-14 h-14 opacity-50" fill="none" stroke="#bca3e3" strokeWidth="1.8" viewBox="0 0 48 48" style={{ animation: 'rotateDoodle 14s linear infinite 1s' }}><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>
  <svg className="absolute bottom-1/3 right-1/5 w-14 h-14 opacity-50" fill="none" stroke="#d1c4e9" strokeWidth="1.8" viewBox="0 0 48 48" style={{ animation: 'rotateDoodle 11s linear infinite 3s' }}><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>
  {/* Small, static doodles for density */}
  <svg className="absolute top-1/2 left-10 w-8 h-8 opacity-70" fill="none" stroke="#bca3e3" strokeWidth="1.5" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute bottom-1/2 right-10 w-8 h-8 opacity-70" fill="none" stroke="#d1c4e9" strokeWidth="1.5" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  <svg className="absolute top-1/5 right-1/4 w-8 h-8 opacity-70" fill="none" stroke="#bca3e3" strokeWidth="1.5" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
  <svg className="absolute bottom-1/5 left-1/4 w-8 h-8 opacity-70" fill="none" stroke="#d1c4e9" strokeWidth="1.5" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
  <div className="max-w-md w-full glass-nature rounded-3xl shadow-2xl border border-[#bca3e3]/40 overflow-hidden" style={{ background: '#c7b6f3cc', backdropFilter: 'blur(12px)' }}>
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                  <Plane className="h-8 w-8 text-[#4c1d95] mr-2" />
                  <h1 className="text-3xl font-bold text-[#4c1d95]">GlobeTrotter</h1>
                </div>
              <h2 className="text-2xl font-semibold text-foreground mb-1">Welcome back!</h2>
              <p className="text-muted-foreground">Sign in to continue planning your adventures</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {errors.root && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive text-sm">{errors.root.message}</p>
                </div>
              )}

              {/* Success Message for Registration */}
              {searchParams.get('registered') === 'true' && (
                <div className="bg-emerald-50/80 border border-purple-200/60 rounded-lg p-4">
                  <p className="text-purple-700 text-sm">Account created successfully! Please sign in.</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:opacity-90 font-medium">Forgot your password?</Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4f3875] text-white py-3 px-4 rounded-2xl font-semibold focus:ring-2 focus:ring-[#bca3e3]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:bg-[#735c98] active:shadow-[0_0_0_4px_#735c98]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-[#4c1d95] hover:opacity-90 font-semibold">Create one now</Link>
                </p>
              </div>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="bg-muted/70 px-8 py-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Demo Credentials (for testing):</p>
              <div className="text-xs text-foreground/80 space-y-1">
                <p>Email: demo@globetrotter.com</p>
                <p>Password: Demo123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
