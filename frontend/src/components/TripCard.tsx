'use client';

import React from 'react';
import { Eye, MapPin, Calendar, DollarSign } from 'lucide-react';

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    destination: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    status?: 'planned' | 'completed' | 'in-progress';
  };
  onView?: (tripId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onView }) => {
  const handleViewClick = () => {
    if (onView) {
      onView(trip.id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
  <div className="bg-white/90 rounded-xl shadow-sm border border-purple-200/50 hover:shadow-lg transition-shadow overflow-hidden backdrop-blur-md">
      {/* Trip Image */}
  <div className="relative h-48 bg-gradient-to-br from-purple-100 via-violet-100 to-purple-50">
        {trip.imageUrl ? (
          <img 
            src={trip.imageUrl} 
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-100">
            <MapPin className="h-16 w-16 text-violet-300" />
          </div>
        )}
        
        {/* Status Badge */}
        {trip.status && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
              {trip.status === 'in-progress' ? 'In Progress' : trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Trip Details */}
      <div className="p-4">
        <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-2 line-clamp-2">
          {trip.title}
        </h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-purple-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{trip.destination}</span>
          </div>
          {trip.startDate && (
            <div className="flex items-center text-purple-600 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {formatDate(trip.startDate)}
                {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              </span>
            </div>
          )}
          {trip.budget && (
            <div className="flex items-center text-purple-600 text-sm">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>${trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        {/* View Button */}
        <button
          onClick={handleViewClick}
          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View Trip
        </button>
      </div>
    </div>
  );
};
