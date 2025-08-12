'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { X, Share2 } from 'lucide-react';
import { tripsAPI, sectionsAPI } from '@/lib/api';
import TripSections from '@/components/sections/TripSections';
import SharingModal from '@/components/sharing/SharingModal';
import EnhancedTripTimeline from '@/components/EnhancedTripTimeline';
import TripOverviewMap from '@/components/sections/TripOverviewMap';
import Navigation from '@/components/Navigation';

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
  latitude?: number;
  longitude?: number;
  estimated_cost?: string;
  popularity?: string;
  category?: string;
  address?: string;
  image_url?: string;
  is_selected?: boolean;
}

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  status: string;
  creator_name: string;
  stops: Array<{
    stop_id: string;
    city_id: string;
    city_name: string;
    country_name: string;
    arrival_date: string;
    departure_date: string;
    stop_order: number;
  }>;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params.tripId as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'sections'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);

  useEffect(() => {
    // Check if tab is specified in URL params
    const tab = searchParams.get('tab');
    const created = searchParams.get('created');
    
    if (created === 'true') {
      setActiveTab('sections');
      setShowWelcome(true);
    } else if (tab === 'sections') {
      setActiveTab('sections');
    }
  }, [searchParams]);

  useEffect(() => {
    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  const loadTrip = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load trip and sections in parallel
      const [tripResponse, sectionsResponse] = await Promise.allSettled([
        tripsAPI.getTripById(tripId),
        sectionsAPI.getTripSections(tripId)
      ]);
      
      if (tripResponse.status === 'fulfilled' && tripResponse.value.success) {
        setTrip(tripResponse.value.data);
      } else {
        setError('Failed to load trip details');
      }
      
      if (sectionsResponse.status === 'fulfilled' && sectionsResponse.value.success) {
        setSections(sectionsResponse.value.data || []);
      }
      
    } catch (error) {
      console.error('Error loading trip:', error);
      setError('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'booked':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <Navigation currentPage="trips" />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-600">Loading trip details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <Navigation currentPage="trips" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error || 'Trip not found'}</div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Navigation */}
      <Navigation currentPage="trips" />

      {/* Trip Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-purple-200/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                  >
                    ← Back to Dashboard
                  </button>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                
                <button
                  onClick={() => setShowSharingModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Trip</span>
                </button>
              </div>
              
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-3">{trip.title}</h1>
              
              {trip.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{trip.description}</p>
              )}
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-purple-100">
                  <span className="font-medium">📅 Duration:</span>
                  <span className="ml-2">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </span>
                </div>
                
                {trip.total_budget && (
                  <div className="flex items-center bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-purple-100">
                    <span className="font-medium">💰 Budget:</span>
                    <span className="ml-2">
                      {trip.currency} {trip.total_budget.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center bg-white/80 px-3 py-2 rounded-lg shadow-sm border border-purple-100">
                  <span className="font-medium">👤 Created by:</span>
                  <span className="ml-2">{trip.creator_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-purple-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sections'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sections & Places
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto px-6 space-y-8">
            {/* Interactive Timeline */}
            {(trip.stops && trip.stops.length > 0) || (sections && sections.length > 0) ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-6">
                  Trip Timeline
                </h2>
                <EnhancedTripTimeline 
                  stops={trip.stops || []}
                  sections={sections}
                  tripStartDate={trip.start_date}
                  tripEndDate={trip.end_date}
                />
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-6">
                  Trip Timeline
                </h2>
                <div className="text-center py-12">
                  <div className="text-purple-300 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No itinerary planned yet</h3>
                  <p className="text-gray-500 mb-6">Add sections and places to your trip to see them on the timeline</p>
                  <button
                    onClick={() => setActiveTab('sections')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
                  >
                    Start Planning
                  </button>
                </div>
              </div>
            )}

            {/* Trip Overview Map */}
            {(sections && sections.length > 0) && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-6">
                  Trip Map Overview
                </h2>
                <TripOverviewMap 
                  sections={sections}
                  onSectionSelect={(section) => {
                    // You can add section selection logic here if needed
                    console.log('Selected section:', section);
                  }}
                  onPlaceSelect={(place) => {
                    // You can add place selection logic here if needed
                    console.log('Selected place:', place);
                  }}
                />
              </div>
            )}
            
            {/* Trip Stops List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-6">
                Trip Destinations
              </h2>
              
              {trip.stops && trip.stops.length > 0 ? (
                <div className="space-y-4">
                  {trip.stops
                    .sort((a, b) => a.stop_order - b.stop_order)
                    .map((stop) => (
                      <div key={stop.stop_id} className="border border-purple-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-purple-50/30">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                              <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 shadow-lg">
                                {stop.stop_order}
                              </span>
                              {stop.city_name}, {stop.country_name}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center bg-white/80 px-3 py-1 rounded-lg shadow-sm border border-purple-100">
                                <span className="font-medium">📅 Arrival:</span>
                                <span className="ml-2">{formatDate(stop.arrival_date)}</span>
                              </div>
                              <div className="flex items-center bg-white/80 px-3 py-1 rounded-lg shadow-sm border border-purple-100">
                                <span className="font-medium">🏁 Departure:</span>
                                <span className="ml-2">{formatDate(stop.departure_date)}</span>
                              </div>
                              <div className="flex items-center bg-white/80 px-3 py-1 rounded-lg shadow-sm border border-purple-100">
                                <span className="font-medium">⏱️ Duration:</span>
                                <span className="ml-2">
                                  {Math.ceil((new Date(stop.departure_date).getTime() - new Date(stop.arrival_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-purple-300 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No destinations added yet</h3>
                  <p className="text-gray-500 mb-6">Add destinations to your trip to see them on the timeline</p>
                  <button
                    onClick={() => setActiveTab('sections')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
                  >
                    Add Destinations
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="max-w-6xl mx-auto px-6">
            {showWelcome && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                      🎉
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-green-900">
                      Trip Created Successfully!
                    </h3>
                    <p className="mt-2 text-green-700 leading-relaxed">
                      Great! Your trip "{trip?.title}" has been created. Now you can add sections to organize your activities and discover amazing places to visit.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowWelcome(false)}
                        className="text-sm font-semibold text-green-700 hover:text-green-600 transition-colors"
                      >
                        Got it, let's start planning! →
                      </button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="text-green-400 hover:text-green-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
              <TripSections tripId={tripId} tripTitle={trip.title} />
            </div>
          </div>
        )}
      </div>

      {/* Sharing Modal */}
      {showSharingModal && (
        <SharingModal
          tripId={tripId}
          isOpen={showSharingModal}
          onClose={() => setShowSharingModal(false)}
        />
      )}
    </div>
  );
}
