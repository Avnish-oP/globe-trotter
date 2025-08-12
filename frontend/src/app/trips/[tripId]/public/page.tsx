'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tripsAPI, sectionsAPI } from '@/lib/api';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Users,
  Copy,
  Share2,
  Download,
  Heart,
  Eye,
  Bookmark,
  ExternalLink,
  Navigation as NavigationIcon,
  Plane,
  Camera,
  Globe,
  ChevronRight,
  Info
} from 'lucide-react';

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  cover_image_url?: string;
  status: string;
  is_public: boolean;
  creator_name: string;
  creator_avatar?: string;
  created_at: string;
  views_count?: number;
  likes_count?: number;
  copies_count?: number;
}

interface TripSection {
  section_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
  places?: Place[];
}

interface Place {
  place_id?: string;
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  estimated_cost?: string;
  popularity?: string;
  category?: string;
  address?: string;
  image_url?: string;
}

export default function PublicTripView() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Load trip data
  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setIsLoading(true);
      
      // Load public trip details and sections
      const [tripResponse, sectionsResponse] = await Promise.all([
        tripsAPI.getPublicTrip(tripId),
        sectionsAPI.getPublicTripSections(tripId)
      ]);

      setTrip(tripResponse.data);
      setSections(sectionsResponse.data || []);
      
      // Increment view count
      await tripsAPI.incrementTripViews(tripId);
      
    } catch (error) {
      console.error('Error loading public trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyTrip = async () => {
    try {
      // Create a copy of this trip for the current user
      const response = await tripsAPI.copyTrip(tripId);
      
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000);
      
      // Optionally redirect to the copied trip
      setTimeout(() => {
        router.push(`/trips/${response.data.trip_id}/itinerary`);
      }, 2000);
      
    } catch (error) {
      console.error('Error copying trip:', error);
      // Handle authentication required or other errors
      if (error === 'Authentication required') {
        router.push('/auth/login');
      }
    }
  };

  const shareTrip = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      
      // Show share options (could be a modal with different platforms)
      alert('Trip link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing trip:', error);
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await tripsAPI.unlikeTrip(tripId);
      } else {
        await tripsAPI.likeTrip(tripId);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await tripsAPI.removeBookmark(tripId);
      } else {
        await tripsAPI.addBookmark(tripId);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBudgetLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!trip || !trip.is_public) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip not found or not public</h2>
          <p className="text-gray-600 mb-6">This trip may be private or no longer available.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Explore Public Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Header with cover image */}
      <div className="relative">
        <div className="h-64 md:h-80 bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden">
          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url}
              alt={trip.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-24 h-24 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
        
        {/* Trip info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{trip.title}</h1>
            <p className="text-lg text-white/90 mb-4">{trip.description}</p>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {getDaysDifference(trip.start_date, trip.end_date)} days
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {sections.length} destination{sections.length !== 1 ? 's' : ''}
              </div>
              {trip.total_budget && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: trip.currency || 'USD'
                  }).format(trip.total_budget)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action bar */}
        <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Creator info */}
              <div className="flex items-center">
                {trip.creator_avatar ? (
                  <img
                    src={trip.creator_avatar}
                    alt={trip.creator_name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {trip.creator_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{trip.creator_name}</div>
                  <div className="text-sm text-gray-600">
                    Created {new Date(trip.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {trip.views_count && (
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {trip.views_count.toLocaleString()} views
                  </div>
                )}
                {trip.likes_count && (
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {trip.likes_count.toLocaleString()} likes
                  </div>
                )}
                {trip.copies_count && (
                  <div className="flex items-center">
                    <Copy className="w-4 h-4 mr-1" />
                    {trip.copies_count.toLocaleString()} copies
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLike}
                className={`p-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={shareTrip}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={copyTrip}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Trip
              </button>
            </div>
          </div>

          {/* Success message */}
          {showCopySuccess && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-800 text-sm">
              ✅ Trip copied successfully! Redirecting to your copy...
            </div>
          )}
        </div>

        {/* Itinerary sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={section.section_id}
              className="bg-white rounded-2xl border border-purple-200/50 shadow-md overflow-hidden"
            >
              {/* Section header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {section.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(section.start_date)} - {formatDate(section.end_date)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBudgetLevelColor(section.budget_level)}`}>
                          {section.budget_level} budget
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {section.description && (
                  <p className="text-gray-600 mt-3">{section.description}</p>
                )}
              </div>

              {/* Section places */}
              {section.places && section.places.length > 0 && (
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Places & Activities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.places.map((place, placeIndex) => (
                      <div
                        key={place.place_id || placeIndex}
                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{place.name}</h5>
                            {place.description && (
                              <p className="text-gray-600 text-sm mt-1">{place.description}</p>
                            )}
                            {place.address && (
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                {place.address}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {place.estimated_cost && (
                                <span className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {place.estimated_cost}
                                </span>
                              )}
                              {place.popularity && (
                                <span className="flex items-center">
                                  <Star className="w-3 h-3 mr-1" />
                                  {place.popularity}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {place.image_url && (
                            <div className="w-16 h-12 bg-gray-200 rounded ml-4 overflow-hidden">
                              <img
                                src={place.image_url}
                                alt={place.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center bg-white rounded-2xl border border-purple-200/50 shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Inspired by this trip?</h3>
          <p className="text-gray-600 mb-6">
            Copy this itinerary and customize it for your own adventure!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={copyTrip}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Copy className="w-5 h-5 mr-2" />
              Copy This Trip
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Globe className="w-5 h-5 mr-2" />
              Explore More Trips
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
