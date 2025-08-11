
'use client';

// DoodleBackground component for thousands of doodles
const doodleSvgs = [
  // Bag
  <svg key="bag" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>,
  // Trolley
  <svg key="trolley" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>,
  // Umbrella
  <svg key="umbrella" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>,
  // Bus
  <svg key="bus" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>,
  // Backpack
  <svg key="backpack" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>,
  // Camera
  <svg key="camera" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>,
  // Mountain
  <svg key="mountain" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>,
  // Trekking
  <svg key="trekking" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>,
];

function DoodleBackground({ count = 400 }) {
  const doodles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const Svg = doodleSvgs[Math.floor(Math.random() * doodleSvgs.length)];
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const size = 16 + Math.random() * 32;
      const opacity = 0.15 + Math.random() * 0.25;
      const rotate = Math.random() * 360;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            width: size,
            height: size,
            opacity,
            transform: `rotate(${rotate}deg)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {React.cloneElement(Svg, { width: size, height: size })}
        </div>
      );
    });
  }, [count]);
  return <>{doodles}</>;
}

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
  <div className="min-h-screen relative overflow-hidden font-sans bg-[#f5f3ff]">
      {/* Funky, blurred mountain hiker background */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center blur-[6px] opacity-60 -z-20"
        style={{ backgroundImage: "url('/mountain-hiker-bg.png')" }}
        aria-hidden="true"
      />
      {/* Funky animated blobs and sparkles */}
      {/* Doodles: animated airplanes, trekking, adventure, arrows */}
      <style>{`
        @keyframes fly1 { 0% { left: 10%; top: 18%; } 100% { left: 80%; top: 10%; } }
        @keyframes fly2 { 0% { left: 20%; top: 40%; } 100% { left: 70%; top: 30%; } }
        @keyframes fly3 { 0% { left: 30%; top: 70%; } 100% { left: 80%; top: 60%; } }
      `}</style>
      <div className="absolute inset-0 pointer-events-none z-0">
  {/* Extra doodles for full background coverage */}
  <svg className="absolute top-10 left-10 w-8 h-8 opacity-50" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute bottom-10 left-10 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  <svg className="absolute top-10 right-10 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
  <svg className="absolute bottom-10 right-10 w-8 h-8 opacity-50" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
  <svg className="absolute top-1/4 left-1/6 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>
  <svg className="absolute top-1/3 right-1/6 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>
  <svg className="absolute bottom-1/4 left-1/6 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>
  <svg className="absolute bottom-1/3 right-1/6 w-8 h-8 opacity-40" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>
  <svg className="absolute top-1/2 left-1/2 w-8 h-8 opacity-30" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute bottom-1/2 right-1/2 w-8 h-8 opacity-30" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  {/* More static doodles for denser background */}
  <svg className="absolute top-1/5 left-1/3 w-7 h-7 opacity-35" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute top-1/6 right-1/4 w-6 h-6 opacity-25" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  <svg className="absolute bottom-1/5 left-1/2 w-9 h-9 opacity-30" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
  <svg className="absolute top-1/8 right-1/8 w-8 h-8 opacity-20" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
  <svg className="absolute bottom-1/8 left-1/8 w-7 h-7 opacity-30" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>
  <svg className="absolute top-1/7 left-1/7 w-6 h-6 opacity-20" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>
  <svg className="absolute bottom-1/6 right-1/5 w-8 h-8 opacity-25" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>
  <svg className="absolute top-1/6 left-1/8 w-7 h-7 opacity-22" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>
  <svg className="absolute bottom-1/7 right-1/7 w-8 h-8 opacity-18" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  <svg className="absolute top-1/8 left-1/9 w-6 h-6 opacity-15" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  {/* Animated airplane doodles */}
  <svg style={{animation: 'fly1 8s linear infinite alternate'}} className="absolute w-8 h-8 opacity-80 rotate-12" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><path d="M4 24L44 4l-8 40-8-16-16-8z"/></svg>
  <svg style={{animation: 'fly2 10s linear infinite alternate'}} className="absolute w-7 h-7 opacity-70 -rotate-6" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><path d="M4 24L44 4l-8 40-8-16-16-8z"/></svg>
  <svg style={{animation: 'fly3 12s linear infinite alternate'}} className="absolute w-9 h-9 opacity-60 rotate-3" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><path d="M4 24L44 4l-8 40-8-16-16-8z"/></svg>
  {/* Bag doodle */}
  <svg className="absolute top-24 left-1/5 w-10 h-10 opacity-70" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
  {/* Trolley bag doodle */}
  <svg className="absolute bottom-24 left-1/4 w-10 h-10 opacity-70" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
  {/* Umbrella doodle */}
  <svg className="absolute top-1/3 right-1/5 w-10 h-10 opacity-70" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
  {/* Bus doodle */}
  <svg className="absolute bottom-10 right-1/3 w-14 h-10 opacity-60" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
  {/* Backpack doodle */}
  <svg className="absolute top-1/2 left-1/3 w-10 h-10 opacity-60" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>
  {/* Camera doodle */}
  <svg className="absolute top-1/4 right-1/4 w-10 h-10 opacity-60" fill="none" stroke="#a78bfa" strokeWidth="2.5" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>
  {/* Trekking doodle */}
  <svg className="absolute bottom-16 right-16 w-12 h-12 opacity-70" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>
  {/* Adventure doodle (mountain) */}
  <svg className="absolute top-1/2 left-1/4 w-16 h-16 opacity-60" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>
      </div>

      {/* Navigation */}
  <nav className="bg-[#ede9fe] backdrop-blur-xl border-b border-[#b3a1e6]/40 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-7 w-7 text-[#4c1d95] mr-2" />
              <span className="text-2xl font-bold text-[#4c1d95]">GlobeTrotter</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login" className="text-[#4c1d95]/80 hover:text-[#4c1d95] font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-[#4f3875] text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:bg-[#735c98] hover:scale-110 transition-all duration-200 border-2 border-[#4f3875] focus:ring-4 focus:ring-[#b3a1e6] focus:outline-none active:shadow-[0_0_0_4px_#735c98]">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-visible min-h-[70vh] flex items-center justify-center z-10">
        {/* Full-size blurred hero background image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center blur-[4px] opacity-70 z-0"
          style={{ backgroundImage: "url('/mountain-hiker-bg.png')" }}
          aria-hidden="true"
        />
        <div className="max-w-3xl mx-auto px-4 z-20 sm:px-6 lg:px-8 py-24 md:py-36 w-full text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#2d1457] drop-shadow-2xl mb-6 animate-fade-in">
            Adventure Awaits
            <span className="block text-3xl md:text-4xl font-bold text-[#232946]/80 mt-2 animate-fade-in delay-200">Find Peace in Chaos</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#232946]/80 mb-10 max-w-2xl mx-auto animate-fade-in delay-300">
            Plan wild journeys, discover new places, and collect memories with a platform made for the bold and the curious.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in delay-500">
            <Link
              href="/auth/register"
              className="bg-[#4f3875] text-white px-10 py-5 rounded-3xl font-handwritten text-2xl inline-flex items-center justify-center shadow-xl hover:scale-110 hover:bg-[#735c98] transition-all duration-200 border-2 border-[#4f3875] relative active:shadow-[0_0_0_6px_#735c98]"
              style={{ fontFamily: '"Pacifico", cursive' }}
            >
              Get Started <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
            <Link
              href="/auth/login"
              className="bg-[#4f3875] text-white px-10 py-5 rounded-3xl font-handwritten text-2xl border-2 border-[#4f3875] shadow-xl hover:scale-110 hover:bg-[#735c98] transition-all duration-200 active:shadow-[0_0_0_6px_#735c98]"
              style={{ fontFamily: '"Pacifico", cursive' }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="absolute top-24 left-8 hidden lg:block">
          <div className="glass-nature p-4 rounded-2xl shadow-lg rotate-3 border border-border">
            <MapPin className="h-8 w-8 text-[#c6b0e7] mb-2" />
            <p className="font-semibold text-[#c6b0e7]">Tokyo, Japan</p>
            <p className="text-sm text-muted-foreground">5 days • $1,200</p>
          </div>
        </div>
        <div className="absolute top-48 right-8 hidden lg:block">
          <div className="glass-nature p-4 rounded-2xl shadow-lg -rotate-3 border border-border">
            <Calendar className="h-8 w-8 text-[#c6b0e7] mb-2" />
            <p className="font-semibold text-[#c6b0e7]">Trip Timeline</p>
            <p className="text-sm text-muted-foreground">Mar 15 - 20, 2025</p>
          </div>
        </div>
      </section>

      {/* Funky Features Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#232946] drop-shadow-lg mb-4 animate-fade-in">Why GlobeTrotter?</h2>
            <p className="text-xl md:text-2xl text-[#232946]/80 max-w-2xl mx-auto animate-fade-in delay-200">A platform for the bold, the curious, and the wild at heart. Plan, share, and relive your adventures with style.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {/* Subtle Feature 1 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in shadow-[0_0_24px_4px_#735c98]">
              <Globe className="h-12 w-12 text-[#b3c6e0] mb-4 animate-bounce-x" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Multi-City Itineraries</h3>
              <p className="text-[#232946]/80">Craft wild plans across cities and countries with ease and style.</p>
            </div>
            {/* Subtle Feature 2 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in delay-100 shadow-[0_0_24px_4px_#735c98]">
              <Calendar className="h-12 w-12 text-[#bfcbe6] mb-4 animate-bounce-x border-2 border-[#735c98] shadow-[0_0_15px_#735c98] rounded-full" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Smart Scheduling</h3>
              <p className="text-[#232946]/80">Organize your chaos with a calendar that vibes with your plans.</p>
            </div>
            {/* Subtle Feature 3 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in delay-200 shadow-[0_0_24px_4px_#735c98]">
              <Star className="h-12 w-12 text-[#b3c6e0] mb-4 animate-bounce-x" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Activity Discovery</h3>
              <p className="text-[#232946]/80">Find and book epic experiences at every destination.</p>
            </div>
            {/* Subtle Feature 4 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in delay-300 shadow-[0_0_24px_4px_#735c98]">
              <Clock className="h-12 w-12 text-[#b3c6e0] mb-4 animate-bounce-x" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Budget Tracking</h3>
              <p className="text-[#232946]/80">Track your adventure spending and stay on top of your game.</p>
            </div>
            {/* Subtle Feature 5 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in delay-400 shadow-[0_0_24px_4px_#735c98]">
              <Users className="h-12 w-12 text-[#bfcbe6] mb-4 animate-bounce-x" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Trip Sharing</h3>
              <p className="text-[#232946]/80">Share your wildest itineraries with friends or inspire the world.</p>
            </div>
            {/* Subtle Feature 6 */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-10 flex flex-col items-center shadow-xl border-2 border-[#bfcbe6]/20 hover:scale-105 hover:shadow-lg transition-all duration-200 animate-fade-in delay-500 shadow-[0_0_24px_4px_#735c98]">
              <Shield className="h-12 w-12 text-[#b3c6e0] mb-4 animate-bounce-x" />
              <h3 className="text-xl font-bold text-[#232946] mb-2">Secure & Private</h3>
              <p className="text-[#232946]/80">Your data, your rules. Adventure with confidence and privacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-[#4f3875] rounded-3xl p-10 md:p-14 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-white/90 mb-8 text-lg">Join thousands of travelers who trust GlobeTrotter to plan their perfect trips.</p>
            <div className="flex justify-center">
              <Link href="/auth/register" className="bg-[#bca3e3] text-white px-7 py-3 rounded-2xl font-handwritten text-xl hover:bg-[#735c98] transition-colors inline-flex items-center active:shadow-[0_0_0_4px_#735c98]" style={{ fontFamily: '"Pacifico", cursive' }}>
                Create Free Account <Heart className="ml-2 h-5 w-5 text-white" />
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
