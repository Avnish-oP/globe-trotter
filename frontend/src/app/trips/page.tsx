'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tripsAPI } from '@/lib/api';

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

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tripsAPI.getUserTrips();
      
      if (response.success) {
        setTrips(response.data || []);
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
          <span className="ml-2 text-gray-600">Loading your trips...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadTrips}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600 mt-2">Plan and manage your travel adventures</p>
          </div>
          
          <button
            onClick={() => router.push('/trips/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No trips found</div>
            <p className="text-gray-400 mb-6">
              Start planning your next adventure by creating your first trip
            </p>
            <button
              onClick={() => router.push('/trips/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.trip_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/trips/${trip.trip_id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {trip.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
