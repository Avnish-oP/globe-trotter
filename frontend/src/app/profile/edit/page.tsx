'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  MapPin, 
  DollarSign,
  Plane,
  Camera
} from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

const travelStyles = [
  { value: 'budget', label: 'Budget Traveler' },
  { value: 'luxury', label: 'Luxury Traveler' },
  { value: 'adventure', label: 'Adventure Seeker' },
  { value: 'cultural', label: 'Cultural Explorer' },
  { value: 'relaxation', label: 'Relaxation Focused' },
  { value: 'business', label: 'Business Traveler' },
  { value: 'family', label: 'Family Traveler' },
  { value: 'solo', label: 'Solo Traveler' },
  { value: 'backpacker', label: 'Backpacker' },
  { value: 'foodie', label: 'Food & Culinary' }
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner (0-5 trips)' },
  { value: 'intermediate', label: 'Intermediate (6-15 trips)' },
  { value: 'experienced', label: 'Experienced (16-30 trips)' },
  { value: 'expert', label: 'Expert (30+ trips)' }
];

const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'KRW', label: 'South Korean Won (KRW)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'THB', label: 'Thai Baht (THB)' }
];

const activities = [
  'sightseeing', 'museums', 'nightlife', 'shopping', 'food-tours',
  'outdoor-activities', 'beaches', 'hiking', 'sports', 'art-galleries',
  'historical-sites', 'photography', 'festivals', 'architecture', 'nature',
  'wellness', 'water-sports', 'skiing', 'cycling', 'wildlife',
  'music', 'theater', 'local-experiences', 'adventure-sports', 'relaxation'
];

const countries = [
  'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain',
  'Australia', 'Japan', 'South Korea', 'China', 'India', 'Brazil', 'Mexico',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria',
  'Belgium', 'Ireland', 'Portugal', 'Greece', 'Turkey', 'Russia', 'Poland',
  'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Serbia',
  'Thailand', 'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
  'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'South Africa',
  'Egypt', 'Morocco', 'Nigeria', 'Kenya', 'Ghana', 'New Zealand', 'Finland'
];

export default function EditProfilePage() {
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country_origin: user?.country_origin || '',
    travel_style: user?.travel_style || '',
    travel_experience_level: user?.travel_experience_level || '',
    preferred_currency: user?.preferred_currency || 'USD',
    fav_activities: user?.fav_activities || [],
    fav_places: user?.fav_places || [],
    profile_picture_url: user?.profile_picture_url || null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when user starts editing
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleProfilePictureChange = (newUrl: string | null) => {
    setFormData(prev => ({
      ...prev,
      profile_picture_url: newUrl
    }));
  };

  const handleActivityToggle = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      fav_activities: prev.fav_activities.includes(activity)
        ? prev.fav_activities.filter(a => a !== activity)
        : [...prev.fav_activities, activity]
    }));
  };

  const handlePlaceAdd = (place: string) => {
    if (place.trim() && !formData.fav_places.includes(place.trim())) {
      setFormData(prev => ({
        ...prev,
        fav_places: [...prev.fav_places, place.trim()]
      }));
    }
  };

  const handlePlaceRemove = (place: string) => {
    setFormData(prev => ({
      ...prev,
      fav_places: prev.fav_places.filter(p => p !== place)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/profile');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-emerald-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-800">
                  <p className="font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-800">
                  <p className="font-medium">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="flex items-center space-x-6 mb-8 pb-6 border-b border-gray-200">
            <ProfilePictureUpload
              currentImageUrl={formData.profile_picture_url || undefined}
              onImageChange={handleProfilePictureChange}
              size="lg"
              userName={formData.name}
            />

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Picture</h3>
              <p className="text-sm text-gray-600">Upload a profile picture or drag and drop an image</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Country of Origin
                </label>
                <select
                  value={formData.country_origin}
                  onChange={(e) => handleInputChange('country_origin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Preferred Currency
                </label>
                <select
                  value={formData.preferred_currency}
                  onChange={(e) => handleInputChange('preferred_currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Travel Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Travel Style
                </label>
                <select
                  value={formData.travel_style}
                  onChange={(e) => handleInputChange('travel_style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select your travel style</option>
                  {travelStyles.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.travel_experience_level}
                  onChange={(e) => handleInputChange('travel_experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select your experience level</option>
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Favorite Activities */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Activities</h3>
            <p className="text-sm text-gray-600 mb-4">Select the activities you enjoy most while traveling</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {activities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => handleActivityToggle(activity)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.fav_activities.includes(activity)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {activity.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Favorite Places */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Places</h3>
            <p className="text-sm text-gray-600 mb-4">Add places you've visited and loved or dream destinations</p>
            
            {/* Add New Place */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter a place name (e.g., Paris, Bali, Tokyo)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePlaceAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handlePlaceAdd(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Display Favorite Places */}
            {formData.fav_places.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.fav_places.map((place, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                  >
                    {place}
                    <button
                      type="button"
                      onClick={() => handlePlaceRemove(place)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
