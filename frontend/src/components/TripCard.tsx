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
        return 'bg-emerald-500/90 text-white';
      case 'in-progress':
        return 'bg-blue-500/90 text-white';
      case 'planned':
      default:
        return 'bg-amber-500/90 text-white';
    }
  };

  return (
    <div className="group bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
      {/* Enhanced Trip Image */}
      <div className="relative h-48 overflow-hidden">
        {trip.imageUrl ? (
          <img 
            src={trip.imageUrl} 
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-violet-400 to-indigo-400">
            <MapPin className="h-16 w-16 text-white/80" />
          </div>
        )}
        
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        {/* Enhanced Status Badge */}
        {trip.status && (
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 ${getStatusColor(trip.status)}`}>
              {trip.status === 'in-progress' ? 'In Progress' : trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Trip Details */}
      <div className="p-6">
        <h3 className="font-black text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
          {trip.title}
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-600 group-hover:text-purple-600 transition-colors">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <MapPin className="h-4 w-4 text-purple-600" />
            </div>
            <span className="font-medium">{trip.destination}</span>
          </div>
          
          {trip.startDate && (
            <div className="flex items-center text-gray-600 group-hover:text-purple-600 transition-colors">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="font-medium">
                {formatDate(trip.startDate)}
                {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              </span>
            </div>
          )}
          
          {trip.budget && (
            <div className="flex items-center text-gray-600 group-hover:text-purple-600 transition-colors">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-bold text-emerald-700">${trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {/* Enhanced View Button */}
        <button
          onClick={handleViewClick}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl group-hover:-translate-y-0.5"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  );
};
