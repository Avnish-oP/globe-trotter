'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight, 
  Globe,
  Heart,
  Shield,
  Clock
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-purple-200/25 to-indigo-200/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-24 left-1/3 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-200/20 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="glass-nature backdrop-blur-xl border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-7 w-7 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">GlobeTrotter</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="gradient-primary text-white px-4 py-2 rounded-xl font-medium shadow hover:opacity-95 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Discover. Plan. <span className="text-gradient-primary">Journey.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Build beautiful multi-city itineraries, balance budget and time, and collect memories that last. Designed for modern travelers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg inline-flex items-center justify-center shadow-lg">
                Start Planning <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/auth/login" className="bg-card text-foreground px-8 py-4 rounded-2xl font-semibold text-lg border border-border hover:bg-muted transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="absolute top-24 left-8 hidden lg:block">
          <div className="glass-nature p-4 rounded-2xl shadow-lg rotate-3 border border-border">
            <MapPin className="h-8 w-8 text-rose-500 mb-2" />
            <p className="font-semibold text-foreground">Tokyo, Japan</p>
            <p className="text-sm text-muted-foreground">5 days • $1,200</p>
          </div>
        </div>
        <div className="absolute top-48 right-8 hidden lg:block">
          <div className="glass-nature p-4 rounded-2xl shadow-lg -rotate-3 border border-border">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <p className="font-semibold text-foreground">Trip Timeline</p>
            <p className="text-sm text-muted-foreground">Mar 15 - 20, 2025</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need to Plan Amazing Trips</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">A comprehensive platform that makes travel planning simple, organized, and fun.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Globe className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Multi-City Itineraries</h3>
              <p className="text-muted-foreground">Craft detailed plans spanning multiple cities and countries with ease.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Calendar className="h-10 w-10 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Smart Scheduling</h3>
              <p className="text-muted-foreground">Organize activities by date and time with an intuitive calendar.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Star className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Activity Discovery</h3>
              <p className="text-muted-foreground">Find and book amazing experiences at every destination.</p>
            </div>

            {/* Feature 4 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Clock className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Budget Tracking</h3>
              <p className="text-muted-foreground">Track expenses and stay within budget with clear breakdowns.</p>
            </div>

            {/* Feature 5 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Users className="h-10 w-10 text-rose-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Trip Sharing</h3>
              <p className="text-muted-foreground">Share itineraries with friends, or make them public for inspiration.</p>
            </div>

            {/* Feature 6 */}
            <div className="glass-nature p-7 rounded-2xl border border-border">
              <Shield className="h-10 w-10 text-indigo-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">Enterprise-grade encryption and privacy controls for your data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="gradient-primary rounded-3xl p-10 md:p-14 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-white/90 mb-8 text-lg">Join thousands of travelers who trust GlobeTrotter to plan their perfect trips.</p>
            <div className="flex justify-center">
              <Link href="/auth/register" className="bg-white text-foreground px-7 py-3 rounded-2xl font-semibold text-base hover:bg-muted transition-colors inline-flex items-center">
                Create Free Account <Heart className="ml-2 h-5 w-5 text-rose-500" />
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-4">No credit card required • Free forever plan available</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Plane className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">GlobeTrotter</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© 2025 GlobeTrotter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
