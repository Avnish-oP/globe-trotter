'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { FilterState, SortOption, GroupOption } from './TripsFilter';
import { getPlaceImageUrl } from '@/lib/imageApi';

interface TripLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  country: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'completed' | 'current';
  description?: string;
  budget?: number;
  imageUrl?: string;
}

interface TripsListProps {
  trips?: TripLocation[];
  searchTerm?: string;
  filters?: FilterState;
  sortBy?: SortOption;
  groupBy?: GroupOption;
  onTripSelect?: (trip: TripLocation) => void;
  onTripEdit?: (trip: TripLocation) => void;
  onTripDelete?: (trip: TripLocation) => void;
}

// Sample trip data
const sampleTrips: TripLocation[] = [
  {
    id: '1',
    name: 'Paris, France',
    coordinates: [48.8566, 2.3522],
    country: 'France',
    startDate: '2025-09-15',
    endDate: '2025-09-22',
    status: 'upcoming',
    description: 'Romantic getaway in the City of Light',
    budget: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400'
  },
  {
    id: '2',
    name: 'Tokyo, Japan',
    coordinates: [35.6762, 139.6503],
    country: 'Japan',
    startDate: '2025-07-10',
    endDate: '2025-07-20',
    status: 'completed',
    description: 'Cultural exploration and amazing food',
    budget: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400'
  },
  {
    id: '3',
    name: 'New York, USA',
    coordinates: [40.7128, -74.0060],
    country: 'USA',
    startDate: '2025-08-05',
    endDate: '2025-08-15',
    status: 'current',
    description: 'Business trip with some sightseeing',
    budget: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400'
  },
  {
    id: '4',
    name: 'London, UK',
    coordinates: [51.5074, -0.1278],
    country: 'UK',
    startDate: '2025-06-01',
    endDate: '2025-06-07',
    status: 'completed',
    description: 'Historical sites and museums',
    budget: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400'
  },
  {
    id: '5',
    name: 'Sydney, Australia',
    coordinates: [-33.8688, 151.2093],
    country: 'Australia',
    startDate: '2025-10-12',
    endDate: '2025-10-25',
    status: 'upcoming',
    description: 'Beach and city exploration',
    budget: 4200,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
  },
  {
    id: '6',
    name: 'Rome, Italy',
    coordinates: [41.9028, 12.4964],
    country: 'Italy',
    startDate: '2025-05-15',
    endDate: '2025-05-22',
    status: 'completed',
    description: 'Ancient history and incredible cuisine',
    budget: 1900,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400'
  }
];

const TripsList: React.FC<TripsListProps> = ({
  trips = [],
  searchTerm = '',
  filters,
  sortBy = 'date-desc',
  groupBy = 'none',
  onTripSelect,
  onTripEdit,
  onTripDelete
}) => {
  const [tripImages, setTripImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Load images for trips that don't have imageUrl
    const loadTripImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const trip of trips) {
        if (!trip.imageUrl) {
          try {
            const imageUrl = await getPlaceImageUrl(trip.name, 'regular');
            if (imageUrl) {
              imageMap.set(trip.id, imageUrl);
            }
          } catch (error) {
            console.error(`Error loading image for ${trip.name}:`, error);
          }
        }
      }
      
      setTripImages(imageMap);
    };

    if (trips.length > 0) {
      loadTripImages();
    }
  }, [trips]);
  
  // Filter trips based on search and filters
  const filteredTrips = trips.filter(trip => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        trip.name.toLowerCase().includes(searchLower) ||
        trip.country.toLowerCase().includes(searchLower) ||
        trip.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters?.status.length && !filters.status.includes(trip.status)) {
      return false;
    }

    // Date range filter
    if (filters?.dateRange.start || filters?.dateRange.end) {
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      
      if (filters.dateRange.start && tripStart < new Date(filters.dateRange.start)) {
        return false;
      }
      if (filters.dateRange.end && tripEnd > new Date(filters.dateRange.end)) {
        return false;
      }
    }

    return true;
  });

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'date-desc':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  // Group trips
  const groupedTrips = groupBy === 'none' 
    ? { 'All Trips': sortedTrips }
    : sortedTrips.reduce((groups, trip) => {
        let groupKey = '';
        switch (groupBy) {
          case 'status':
            groupKey = trip.status.charAt(0).toUpperCase() + trip.status.slice(1);
            break;
          case 'country':
            groupKey = trip.country;
            break;
          case 'month':
            groupKey = new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            break;
          case 'year':
            groupKey = new Date(trip.startDate).getFullYear().toString();
            break;
          default:
            groupKey = 'All Trips';
        }
        
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(trip);
        return groups;
      }, {} as Record<string, TripLocation[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const TripCard = ({ trip }: { trip: TripLocation }) => {
    const fallbackImage = tripImages.get(trip.id);
    const displayImage = trip.imageUrl || fallbackImage;
    
    return (
      <div className="group bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Trip Image */}
        {displayImage ? (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={displayImage} 
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status)}`}>
                {trip.status}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 text-white">
              <h3 className="font-bold text-lg mb-1">{trip.name}</h3>
              <p className="text-sm opacity-90">{trip.country}</p>
            </div>
          </div>
        ) : (
          <div className="relative h-48 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-violet-300" />
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status)}`}>
                {trip.status}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 text-gray-700">
              <h3 className="font-bold text-lg mb-1">{trip.name}</h3>
              <p className="text-sm opacity-90">{trip.country}</p>
            </div>
          </div>
        )}

        {/* Trip Content */}
        <div className="p-4">
          {!displayImage && (
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{trip.name}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {trip.country}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status)}`}>
              {trip.status}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-purple-500" />
              <span>{getTripDuration(trip.startDate, trip.endDate)} days</span>
            </div>
            {trip.budget && (
              <div className="font-semibold text-purple-600">
                ${trip.budget.toLocaleString()}
              </div>
            )}
          </div>

          {trip.description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {trip.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-purple-100">
          <button 
            onClick={() => onTripSelect?.(trip)}
            className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onTripEdit?.(trip)}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onTripDelete?.(trip)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  };

  if (sortedTrips.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 p-8 shadow-md text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-10 w-10 text-purple-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No trips found</h3>
        <p className="text-purple-600 mb-4">
          {searchTerm || filters?.status.length 
            ? 'Try adjusting your search or filters'
            : 'Start planning your first adventure!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedTrips).map(([groupName, groupTrips]) => (
        <div key={groupName}>
          {groupBy !== 'none' && (
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              {groupName}
              <span className="ml-2 text-sm font-normal text-purple-600">
                ({groupTrips.length} trip{groupTrips.length !== 1 ? 's' : ''})
              </span>
            </h2>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TripsList;
