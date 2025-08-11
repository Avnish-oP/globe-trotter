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
  visibility: 'private' | 'public' | 'unlisted' | 'friends_only';
  allowComments: boolean;
  allowCloning: boolean;
}

export default function CreateTripPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'USD',
    selectedLocations: [],
    visibility: 'private',
    allowComments: false,
    allowCloning: false
  });

  // UI state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Search locations with external API as primary source
  useEffect(() => {
    const searchLocations = async () => {
      if (locationQuery.length < 2) {
        setLocationSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearchingLocations(true);
      
      try {
        // Use external API (OpenStreetMap) as primary source for better global coverage
        let response = await locationAPI.searchLocationsExternal(locationQuery);
        
        // If external API fails, fallback to our database
        if (!response.success || response.data.length === 0) {
          console.log('External API failed or no results, trying local database...');
          response = await locationAPI.searchLocations(locationQuery);
        }
        
        if (response.success && response.data.length > 0) {
          const formattedSuggestions = response.data.map((location: any) => ({
            id: location.id.toString(),
            name: location.name,
            country: location.country,
            type: location.type || 'city',
            full_name: location.full_name || `${location.name}, ${location.country}`,
            coordinates: {
              lat: location.latitude,
              lng: location.longitude
            },
            source: location.source || 'local'
          }));
          setLocationSuggestions(formattedSuggestions);
          setShowSuggestions(true);
        } else {
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

  const handleInputChange = (field: keyof TripFormData, value: string | boolean) => {
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
        visibility: formData.visibility,
        allow_comments: formData.allowComments,
        allow_cloning: formData.allowCloning,
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-blue-100/30 to-indigo-100/30 blur-3xl animate-float-gentle" />
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-100/25 to-purple-100/25 blur-3xl animate-float-gentle" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <header className="glass-nature shadow-soft border-b border-border/50 relative z-10 backdrop-blur-md">
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
                <h1 className="text-2xl font-bold text-gradient-primary">Plan New Adventure</h1>
                <p className="text-xs text-muted-foreground font-medium">Create your perfect trip</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Trip Title */}
          <div className="card-elevated bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-heading-md text-foreground font-bold mb-2">Trip Details</h2>
              <p className="text-caption text-muted-foreground">Start by giving your adventure a memorable name</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-2">
                  Trip Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., European Summer Adventure, Tokyo Food Tour..."
                  className={`input-field w-full ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="card-elevated bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-heading-md text-foreground font-bold mb-2">Where To?</h2>
              <p className="text-caption text-muted-foreground">Add destinations to your trip</p>
            </div>

            <div className="space-y-4">
              {/* Location Search */}
              <div className="relative">
                <label htmlFor="location-search" className="block text-sm font-semibold text-foreground mb-2">
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
                  <label className="block  text-sm font-semibold text-foreground mb-2">
                    Selected Destinations ({formData.selectedLocations.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-2 rounded-lg"
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
          <div className="card-elevated z-0 bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-heading-md text-foreground font-bold mb-2">When?</h2>
              <p className="text-caption text-muted-foreground">Set your travel dates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start-date" className="block text-sm font-semibold text-foreground mb-2">
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
                  />
                </div>
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-semibold text-foreground mb-2">
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
                  />
                </div>
                {errors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {getTripDuration() > 0 && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center space-x-2 text-primary">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">
                    Trip Duration: {getTripDuration()} {getTripDuration() === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="card-elevated bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-heading-md text-foreground font-bold mb-2">Budget (Optional)</h2>
              <p className="text-caption text-muted-foreground">Set a budget to help plan your expenses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="budget" className="block text-sm font-semibold text-foreground mb-2">
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
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-semibold text-foreground mb-2">
                  Currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="input-field w-full appearance-none cursor-pointer"
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

          {/* Privacy & Sharing */}
          <div className="card-elevated bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-heading-md text-foreground font-bold mb-2">Privacy & Sharing</h2>
              <p className="text-caption text-muted-foreground">Control who can see and interact with your trip</p>
            </div>

            <div className="space-y-6">
              {/* Visibility Settings */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Trip Visibility
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { 
                      value: 'private', 
                      label: 'Private', 
                      description: 'Only you can see this trip',
                      icon: '🔒'
                    },
                    { 
                      value: 'public', 
                      label: 'Public', 
                      description: 'Anyone can discover and view this trip',
                      icon: '🌍'
                    },
                    { 
                      value: 'unlisted', 
                      label: 'Unlisted', 
                      description: 'Only people with the link can view',
                      icon: '🔗'
                    },
                    { 
                      value: 'friends_only', 
                      label: 'Friends Only', 
                      description: 'Only your friends can see this trip',
                      icon: '👥'
                    }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/30 ${
                        formData.visibility === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={formData.visibility === option.value}
                        onChange={(e) => handleInputChange('visibility', e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-3 w-full">
                        <span className="text-xl">{option.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        {formData.visibility === option.value && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Settings for Public/Unlisted */}
              {(formData.visibility === 'public' || formData.visibility === 'unlisted') && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Interaction Settings
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowComments}
                        onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-foreground">Allow Comments</div>
                        <div className="text-sm text-muted-foreground">Let others comment on your trip and suggest improvements</div>
                      </div>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowCloning}
                        onChange={(e) => handleInputChange('allowCloning', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-foreground">Allow Cloning</div>
                        <div className="text-sm text-muted-foreground">Let others use your trip as a template for their own</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
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
