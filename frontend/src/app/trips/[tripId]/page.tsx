'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { X, Share2 } from 'lucide-react';
import { tripsAPI } from '@/lib/api';
import TripSections from '@/components/sections/TripSections';
import SharingModal from '@/components/sharing/SharingModal';

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
      const response = await tripsAPI.getTripById(tripId);
      
      if (response.success) {
        setTrip(response.data);
      } else {
        setError('Failed to load trip details');
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
        return 'bg-yellow-100 text-yellow-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading trip details...</span>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Trip not found'}</div>
          <button
            onClick={() => router.push('/trips')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trip Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/trips')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back
                  </button>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                
                <button
                  onClick={() => setShowSharingModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Trip</span>
                </button>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{trip.title}</h1>
              
              {trip.description && (
                <p className="text-gray-600 mb-4">{trip.description}</p>
              )}
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">📅 Duration:</span>
                  <span className="ml-1">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </span>
                </div>
                
                {trip.total_budget && (
                  <div className="flex items-center">
                    <span className="font-medium">💰 Budget:</span>
                    <span className="ml-1">
                      {trip.currency} {trip.total_budget.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <span className="font-medium">👤 Created by:</span>
                  <span className="ml-1">{trip.creator_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sections & Places
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Stops</h2>
              
              {trip.stops && trip.stops.length > 0 ? (
                <div className="space-y-4">
                  {trip.stops
                    .sort((a, b) => a.stop_order - b.stop_order)
                    .map((stop) => (
                      <div key={stop.stop_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {stop.city_name}, {stop.country_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(stop.arrival_date)} - {formatDate(stop.departure_date)}
                            </p>
                          </div>
                          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Stop #{stop.stop_order}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No stops added to this trip yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="max-w-6xl mx-auto px-6">
            {showWelcome && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                      🎉
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-green-900">
                      Trip Created Successfully!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Great! Your trip "{trip?.title}" has been created. Now you can add sections to organize your activities and discover amazing places to visit.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowWelcome(false)}
                        className="text-sm font-medium text-green-700 hover:text-green-600"
                      >
                        Got it, let's start planning! →
                      </button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => setShowWelcome(false)}
                      className="text-green-400 hover:text-green-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <TripSections tripId={tripId} tripTitle={trip.title} />
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
