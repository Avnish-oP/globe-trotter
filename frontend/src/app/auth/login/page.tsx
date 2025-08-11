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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-purple-200/25 to-indigo-200/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-nature rounded-3xl shadow-2xl border border-border/40 overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <Plane className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-3xl font-bold text-foreground">GlobeTrotter</h1>
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
                <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-4">
                  <p className="text-emerald-700 text-sm">Account created successfully! Please sign in.</p>
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
                className="w-full gradient-primary text-white py-3 px-4 rounded-2xl font-semibold focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-primary hover:opacity-90 font-semibold">Create one now</Link>
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
