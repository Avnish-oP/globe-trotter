'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tripsAPI } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/imageApi';
import Navigation from '@/components/Navigation';

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  status: string;
  stops: Array<{
    stop_id: string;
    city_name: string;
    country_name: string;
  }>;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripImages, setTripImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tripsAPI.getUserTrips();
      
      if (response.success) {
        const loadedTrips = response.data || [];
        setTrips(loadedTrips);
        
        // Load images for each trip's first destination
        const imageMap = new Map<string, string>();
        
        for (const trip of loadedTrips) {
          if (trip.stops && trip.stops.length > 0) {
            try {
              const firstDestination = `${trip.stops[0].city_name}, ${trip.stops[0].country_name}`;
              const imageUrl = await getPlaceImageUrl(firstDestination, 'regular');
              if (imageUrl) {
                imageMap.set(trip.trip_id, imageUrl);
              }
            } catch (error) {
              console.error(`Error loading image for trip ${trip.trip_id}:`, error);
            }
          }
        }
        
        setTripImages(imageMap);
      } else {
        setError('Failed to load trips');
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
            <span className="ml-2 text-gray-600">Loading your trips...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <Navigation currentPage="trips" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={loadTrips}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <Navigation currentPage="trips" />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
              My Trips
            </h1>
            <p className="text-purple-600 mt-2">Plan and manage your travel adventures</p>
          </div>
          
          <button
            onClick={() => router.push('/trips/new')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
          >
            Create New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-purple-300 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No trips yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start your travel journey by creating your first trip. Plan amazing destinations and unforgettable experiences.
            </p>
            <button
              onClick={() => router.push('/trips/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const tripImage = tripImages.get(trip.trip_id);
              const firstDestination = trip.stops && trip.stops.length > 0 
                ? `${trip.stops[0].city_name}, ${trip.stops[0].country_name}` 
                : '';
              
              return (
                <div
                  key={trip.trip_id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/trips/${trip.trip_id}`)}
                >
                  {/* Trip Image Header */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-violet-100">
                    {tripImage ? (
                      <>
                        <img
                          src={tripImage}
                          alt={firstDestination}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 text-white">
                          <h4 className="font-semibold text-sm drop-shadow-lg">{firstDestination}</h4>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-purple-300">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>

                  {/* Trip Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {trip.title}
                      </h3>
                    </div>
                    
                    {trip.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium">📅</span>
                        <span className="ml-2">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                      </div>
                      
                      {trip.total_budget && (
                        <div className="flex items-center">
                          <span className="font-medium">💰</span>
                          <span className="ml-2">
                            {trip.currency} {trip.total_budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {trip.stops && trip.stops.length > 0 && (
                        <div className="flex items-center">
                          <span className="font-medium">📍</span>
                          <span className="ml-2 truncate">
                            {trip.stops.slice(0, 2).map(stop => `${stop.city_name}, ${stop.country_name}`).join(' • ')}
                            {trip.stops.length > 2 && ` +${trip.stops.length - 2} more`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/trips/${trip.trip_id}`);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate directly to sections tab
                          router.push(`/trips/${trip.trip_id}?tab=sections`);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Manage Sections
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
