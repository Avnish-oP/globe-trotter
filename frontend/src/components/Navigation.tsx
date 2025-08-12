'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Globe,
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Map,
  Calendar,
  Plus
} from 'lucide-react';

interface NavigationProps {
  currentPage?: 'dashboard' | 'trips' | 'profile' | 'settings';
  showCreateButton?: boolean;
}

export default function Navigation({ currentPage = 'dashboard', showCreateButton = true }: NavigationProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', key: 'dashboard' },
    { icon: Map, label: 'My Trips', path: '/trips', key: 'trips' },
    { icon: Calendar, label: 'Calendar', path: '/calendar', key: 'calendar' },
  ];

  return (
    <header className="relative z-50 bg-white/95 backdrop-blur-md border-b border-purple-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                  GlobeTrotter
                </h1>
                <p className="text-xs text-purple-600">Plan your adventure</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {showCreateButton && (
              <button
                onClick={() => router.push('/trips/new')}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Create Trip</span>
              </button>
            )}

            <button className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-gray-700">{user?.name || 'User'}</span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-purple-500" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-purple-500" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-purple-200/50 py-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      router.push(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {showCreateButton && (
                <button
                  onClick={() => {
                    router.push('/trips/new');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white p-3 rounded-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Trip</span>
                </button>
              )}

              <hr className="my-2" />
              
              <button 
                onClick={() => {
                  router.push('/profile');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-3 transition-all duration-200"
              >
                <User className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Profile</span>
              </button>
              <button 
                onClick={() => {
                  router.push('/settings');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-3 transition-all duration-200"
              >
                <Settings className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Settings</span>
              </button>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 hover:bg-red-50 rounded-lg p-3 transition-all duration-200 text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
