// ...existing code...
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { tripsAPI, locationAPI } from '@/lib/api';
import { 
  ArrowLeft,
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus,
  Search,
  Clock,
  Plane,
  Globe,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  type: 'city' | 'country' | 'landmark';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface TripFormData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  currency: string;
  selectedLocations: LocationSuggestion[];
}

export default function CreateTripPage() {
  // ...existing code...
  return (
    <div className="min-h-screen bg-[#ede9fe] relative overflow-hidden">
      {/* More playful doodles for extra density, matching login page */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute top-24 left-24 w-7 h-7 opacity-30 animate-bounce" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="4"/></svg>
        <svg className="absolute bottom-24 right-24 w-7 h-7 opacity-30 animate-spin" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/></svg>
        <svg className="absolute top-32 right-1/3 w-8 h-8 opacity-20 animate-bounce-slow" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 40 40"><polygon points="20,5 35,35 5,35"/></svg>
        <svg className="absolute bottom-32 left-1/3 w-8 h-8 opacity-20 animate-spin-slow" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="6"/></svg>
        <svg className="absolute top-1/5 left-1/8 w-6 h-6 opacity-25 animate-bounce" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="10" ry="6"/></svg>
        <svg className="absolute bottom-1/5 right-1/8 w-6 h-6 opacity-25 animate-spin" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="6" ry="10"/></svg>
        <svg className="absolute top-1/6 right-1/5 w-8 h-8 opacity-20 animate-bounce-slow" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="10" width="28" height="28" rx="8"/></svg>
        <svg className="absolute bottom-1/6 left-1/5 w-8 h-8 opacity-20 animate-spin-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/></svg>
        <svg className="absolute top-1/8 right-1/8 w-5 h-5 opacity-20 animate-bounce" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22"/></svg>
        <svg className="absolute bottom-1/8 left-1/8 w-5 h-5 opacity-20 animate-spin" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>
      </div>
      {/* ...rest of the page... */}
    </div>
  );
}
          // Final fallback to mock data
          const mockLocationSuggestions: LocationSuggestion[] = [
            { id: '1', name: 'Paris', country: 'France', type: 'city' },
            { id: '2', name: 'Tokyo', country: 'Japan', type: 'city' },
            { id: '3', name: 'New York', country: 'United States', type: 'city' },
            { id: '4', name: 'London', country: 'United Kingdom', type: 'city' },
            { id: '5', name: 'Rome', country: 'Italy', type: 'city' },
            { id: '6', name: 'Barcelona', country: 'Spain', type: 'city' },
          ];
          
          const filtered = mockLocationSuggestions.filter(location =>
            location.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
            location.country.toLowerCase().includes(locationQuery.toLowerCase())
          );
          setLocationSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchingLocations(false);
      }
    };

    const timer = setTimeout(searchLocations, 300);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleInputChange = (field: keyof TripFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    if (!formData.selectedLocations.find(loc => loc.id === location.id)) {
      setFormData(prev => ({
        ...prev,
        selectedLocations: [...prev.selectedLocations, location],
        destination: location.name // Set main destination
      }));
    }
    setLocationQuery('');
    setShowSuggestions(false);
  };

  const removeLocation = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLocations: prev.selectedLocations.filter(loc => loc.id !== locationId)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Trip title is required';
    }

    if (formData.selectedLocations.length === 0) {
      newErrors.destination = 'At least one destination is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tripData = {
        title: formData.title,
        description: `Trip to ${formData.selectedLocations.map(loc => loc.name).join(', ')}`,
        start_date: formData.startDate,
        end_date: formData.endDate,
        total_budget: formData.budget ? parseFloat(formData.budget) : undefined,
        currency: formData.currency,
        destinations: formData.selectedLocations.map(loc => ({
          name: loc.name,
          country: loc.country,
          type: loc.type
        }))
      };

      const response = await tripsAPI.createTrip(tripData);
      
      // Navigate to trip details page or dashboard with success message
      router.push(`/trips/${response.data.trip_id}?created=true`);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to create trip. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTripDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
  <div className="min-h-screen bg-[#ede9fe] relative overflow-hidden">
      {/* Dense adventure doodle background */}
      <div className="absolute inset-0 pointer-events-none z-0">
  {/* Doodles: static SVGs for background, matching landing/login/register, but even denser and more playful */}
  {/* Extra doodles for more density */}
  <svg className="absolute top-16 left-1/3 w-7 h-7 opacity-30 animate-bounce-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="16" ry="8"/></svg>
  <svg className="absolute bottom-16 right-1/3 w-7 h-7 opacity-30 animate-spin-slow" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 40 40"><polygon points="20,5 35,35 5,35"/></svg>
  <svg className="absolute top-1/5 right-1/4 w-6 h-6 opacity-25 animate-bounce" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="8"/></svg>
  <svg className="absolute bottom-1/5 left-1/4 w-6 h-6 opacity-25 animate-spin" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10"/></svg>
  <svg className="absolute top-1/6 left-1/5 w-8 h-8 opacity-20 animate-bounce-slow" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="10" width="28" height="28" rx="8"/></svg>
  <svg className="absolute bottom-1/6 right-1/5 w-8 h-8 opacity-20 animate-spin-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/></svg>
  <svg className="absolute top-1/8 left-1/8 w-5 h-5 opacity-20 animate-bounce" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22"/></svg>
  <svg className="absolute bottom-1/8 right-1/8 w-5 h-5 opacity-20 animate-spin" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>
  <svg className="absolute top-1/2 right-10 w-6 h-6 opacity-25 animate-bounce" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="12" ry="6"/></svg>
  <svg className="absolute bottom-1/2 left-10 w-6 h-6 opacity-25 animate-spin-slow" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="6" ry="12"/></svg>
        <svg className="absolute top-10 left-10 w-8 h-8 opacity-50 animate-bounce-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>
        <svg className="absolute bottom-10 left-10 w-8 h-8 opacity-40 animate-spin-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>
        <svg className="absolute top-10 right-10 w-8 h-8 opacity-40 animate-bounce" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>
        <svg className="absolute bottom-10 right-10 w-8 h-8 opacity-50 animate-spin" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>
        <svg className="absolute top-1/4 left-1/6 w-8 h-8 opacity-40 animate-bounce" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>
        <svg className="absolute top-1/3 right-1/6 w-8 h-8 opacity-40 animate-spin-slow" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>
        <svg className="absolute bottom-1/4 left-1/6 w-8 h-8 opacity-40 animate-bounce" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>
        <svg className="absolute bottom-1/3 right-1/6 w-8 h-8 opacity-40 animate-spin" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>
        {/* Extra doodles for density and fun */}
        <svg className="absolute top-1/2 left-1/4 w-6 h-6 opacity-30 animate-bounce" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/><path d="M16 8v8l6 6"/></svg>
        <svg className="absolute bottom-1/2 right-1/4 w-6 h-6 opacity-30 animate-spin-slow" fill="none" stroke="#735c98" strokeWidth="2" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="4"/></svg>
        <svg className="absolute top-1/3 left-1/2 w-7 h-7 opacity-20 animate-bounce" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 40 40"><polygon points="20,5 35,35 5,35"/></svg>
        <svg className="absolute bottom-1/3 right-1/2 w-7 h-7 opacity-20 animate-spin" fill="none" stroke="#bca3e3" strokeWidth="2" viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" rx="6"/></svg>
        {/* Interactive floating doodle button */}
        <button type="button" className="fixed z-20 bottom-8 right-8 bg-[#ede9fe] border-2 border-[#735c98] rounded-full shadow-lg p-4 hover:bg-[#bca3e3] transition-all animate-bounce-slow group" title="Surprise Doodle!" onClick={() => alert('Adventure awaits! 🌍✨')}>
          <Plane className="w-8 h-8 text-[#735c98] group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Header */}
  <header className="glass-nature shadow-soft border-b border-[#bca3e3]/50 relative z-10 backdrop-blur-md" style={{ background: '#ede9fecc', boxShadow: '0 8px 32px 0 #735c98cc, 0 0 0 6px #735c98' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button
              onClick={() => router.back()}
              className="p-3 text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-xl mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-medium">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#3a256a', textShadow: '0 2px 8px #bca3e3' }}>Plan New Adventure</h1>
                <p className="text-xs font-medium" style={{ color: '#735c98', textShadow: '0 1px 4px #ede9fe' }}>Create your perfect trip</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
  <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Trip Title */}
          <div className="card-elevated" style={{ background: '#f8f6ffcc', boxShadow: '0 8px 32px 0 #735c98cc, 0 0 0 2px #735c98' }}>
            <div className="mb-6">
              <h2 className="text-heading-md font-bold mb-2" style={{ color: '#3a256a' }}>Trip Details</h2>
              <p className="text-caption" style={{ color: '#735c98' }}>Start by giving your adventure a memorable name</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  Trip Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., European Summer Adventure, Tokyo Food Tour..."
                  className={`input-field w-full ${errors.title ? 'border-red-500' : ''}`}
                  style={{ background: '#f3edff', color: '#3a256a' }}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="card-elevated" style={{ background: '#f8f6ffcc', boxShadow: '0 8px 32px 0 #735c98cc, 0 0 0 2px #735c98' }}>
            <div className="mb-6">
              <h2 className="text-heading-md font-bold mb-2" style={{ color: '#3a256a' }}>Where To?</h2>
              <p className="text-caption" style={{ color: '#735c98' }}>Add destinations to your trip</p>
            </div>

            <div className="space-y-4">
              {/* Location Search */}
              <div className="relative">
                <label htmlFor="location-search" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  Search Destinations *
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    id="location-search"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Search for cities, countries, or landmarks..."
                    className="input-field pl-12 w-full"
                    style={{ background: '#f3edff', color: '#3a256a' }}
                  />
                  {isSearchingLocations && (
                    <div className="absolute z-10 right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>

                {/* Location Suggestions */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-xl shadow-strong max-h-60 overflow-y-auto">
                    {locationSuggestions.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleLocationSelect(location)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 flex items-center space-x-3"
                      >
                        <div className="p-1 bg-primary/10 rounded">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{location.name}</p>
                          <p className="text-sm text-muted-foreground">{location.country}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            {location.type}
                          </span>
                          {(location as any).source === 'osm' && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                              OSM
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Locations */}
              {formData.selectedLocations.length > 0 && (
                <div>
                  <label className="block  text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                    Selected Destinations ({formData.selectedLocations.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center space-x-2 bg-[#ede9fe] text-[#735c98] px-3 py-2 rounded-lg"
                      >
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{location.name}</span>
                        <span className="text-sm text-primary/70">{location.country}</span>
                        <button
                          type="button"
                          onClick={() => removeLocation(location.id)}
                          className="p-1 hover:bg-primary/20 rounded transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.destination && (
                <p className="text-sm text-red-500">{errors.destination}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="card-elevated z-0" style={{ background: '#f8f6ffcc', boxShadow: '0 8px 32px 0 #735c98cc, 0 0 0 2px #735c98' }}>
            <div className="mb-6">
              <h2 className="text-heading-md font-bold mb-2" style={{ color: '#3a256a' }}>When?</h2>
              <p className="text-caption" style={{ color: '#735c98' }}>Set your travel dates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start-date" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="date"
                    id="start-date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`input-field pl-12 w-full ${errors.startDate ? 'border-red-500' : ''}`}
                    style={{ background: '#f3edff', color: '#3a256a' }}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="date"
                    id="end-date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className={`input-field pl-12 w-full ${errors.endDate ? 'border-red-500' : ''}`}
                    style={{ background: '#f3edff', color: '#3a256a' }}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {getTripDuration() > 0 && (
              <div className="mt-4 p-4 bg-[#ede9fe] border border-[#bca3e3] rounded-lg">
                <div className="flex items-center space-x-2" style={{ color: '#735c98' }}>
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">
                    Trip Duration: {getTripDuration()} {getTripDuration() === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="card-elevated" style={{ background: '#f8f6ffcc', boxShadow: '0 8px 32px 0 #735c98cc, 0 0 0 2px #735c98' }}>
            <div className="mb-6">
              <h2 className="text-heading-md font-bold mb-2" style={{ color: '#3a256a' }}>Budget (Optional)</h2>
              <p className="text-caption" style={{ color: '#735c98' }}>Set a budget to help plan your expenses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="budget" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  Total Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="number"
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="Enter your total budget"
                    min="0"
                    step="0.01"
                    className="input-field pl-12 w-full"
                    style={{ background: '#f3edff', color: '#3a256a' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-semibold mb-2" style={{ color: '#3a256a' }}>
                  Currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="input-field w-full appearance-none cursor-pointer"
                    style={{ background: '#f3edff', color: '#3a256a' }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {errors.submit && (
              <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.submit}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1 sm:flex-initial"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  Create Trip & Add Sections
                  <Plus className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
