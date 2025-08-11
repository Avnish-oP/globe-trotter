'use client';

import React from 'react';
import { Calendar, MapPin, Clock, Plane } from 'lucide-react';

interface TripLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  country: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'completed' | 'current';
  description?: string;
}

interface TripsSummaryProps {
  trips?: TripLocation[];
}

const TripsSummary: React.FC<TripsSummaryProps> = ({ trips = [] }) => {
  const upcomingTrips = trips.filter(trip => trip.status === 'upcoming');
  const currentTrips = trips.filter(trip => trip.status === 'current');
  const completedTrips = trips.filter(trip => trip.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const tripDate = new Date(dateString);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTripDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'current':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'completed':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const TripCard = ({ trip }: { trip: TripLocation }) => (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">{trip.name}</h4>
          <p className="text-xs text-gray-600 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {trip.country}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status)}`}>
          {trip.status}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-gray-600">
          <Calendar className="w-3 h-3 mr-2 text-purple-500" />
          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-600">
          <Clock className="w-3 h-3 mr-2 text-purple-500" />
          <span>{getTripDuration(trip.startDate, trip.endDate)} days</span>
          {trip.status === 'upcoming' && (
            <span className="ml-auto text-green-600 font-medium">
              {getDaysUntil(trip.startDate)} days to go
            </span>
          )}
        </div>
      </div>

      {trip.description && (
        <p className="text-xs text-gray-700 italic border-t border-purple-100 pt-2">
          {trip.description}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Trips */}
      {currentTrips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            Current Trip
          </h3>
          <div className="space-y-3">
            {currentTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            Upcoming Trips ({upcomingTrips.length})
          </h3>
          <div className="space-y-3">
            {upcomingTrips
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
          </div>
        </div>
      )}

      {/* Recent Completed Trips */}
      {completedTrips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            Recent Trips ({completedTrips.length})
          </h3>
          <div className="space-y-3">
            {completedTrips
              .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
              .slice(0, 3) // Show only last 3 completed trips
              .map(trip => (
                <TripCard key={trip.id} trip={trip} />
              ))}
          </div>
          {completedTrips.length > 3 && (
            <button className="w-full mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm py-2 rounded-lg hover:bg-purple-50 transition-all duration-200">
              View All Completed Trips ({completedTrips.length})
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="h-8 w-8 text-purple-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">No trips planned yet</h4>
          <p className="text-purple-600 mb-4">Start planning your first adventure!</p>
          <button className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm">
            Plan Your First Trip
          </button>
        </div>
      )}
    </div>
  );
};

export default TripsSummary;
