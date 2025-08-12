'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Star,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { dashboardAPI, tripsAPI } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/imageApi';

interface PublicTrip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  cover_image_url?: string;
  created_by: string;
  creator_id: string;
  cities: string[];
  countries: string[];
}

interface RecommendedDestination {
  city_id: string;
  name: string;
  description: string;
  image_url?: string;
  country_name: string;
  country_code: string;
  matching_activities?: number;
}

interface TripRecommendationsProps {
  userTrips?: any[];
  className?: string;
}

const TripRecommendations: React.FC<TripRecommendationsProps> = ({ 
  userTrips = [], 
  className = '' 
}) => {
  const [publicTrips, setPublicTrips] = useState<PublicTrip[]>([]);
  const [recommendedDestinations, setRecommendedDestinations] = useState<RecommendedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'destinations'>('trips');
  const [tripImages, setTripImages] = useState<Map<string, string>>(new Map());
  const [destinationImages, setDestinationImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    // Load images for public trips that don't have cover_image_url
    const loadTripImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const trip of publicTrips) {
        if (!trip.cover_image_url && trip.cities.length > 0) {
          try {
            const firstCity = trip.cities[0];
            const imageUrl = await getPlaceImageUrl(firstCity, 'regular');
            if (imageUrl) {
              imageMap.set(trip.trip_id, imageUrl);
            }
          } catch (error) {
            console.error(`Error loading image for trip ${trip.trip_id}:`, error);
          }
        }
      }
      
      setTripImages(imageMap);
    };

    if (publicTrips.length > 0) {
      loadTripImages();
    }
  }, [publicTrips]);

  useEffect(() => {
    // Load images for recommended destinations that don't have image_url
    const loadDestinationImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const destination of recommendedDestinations) {
        if (!destination.image_url) {
          try {
            const imageUrl = await getPlaceImageUrl(`${destination.name}, ${destination.country_name}`, 'regular');
            if (imageUrl) {
              imageMap.set(destination.city_id, imageUrl);
            }
          } catch (error) {
            console.error(`Error loading image for destination ${destination.name}:`, error);
          }
        }
      }
      
      setDestinationImages(imageMap);
    };

    if (recommendedDestinations.length > 0) {
      loadDestinationImages();
    }
  }, [recommendedDestinations]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recommended destinations and popular trips in parallel
      const [destinationsRes, popularTripsRes] = await Promise.allSettled([
        dashboardAPI.getRecommendedDestinations(),
        dashboardAPI.getPopularTrips(6)
      ]);

      // Handle destinations
      if (destinationsRes.status === 'fulfilled') {
        setRecommendedDestinations(destinationsRes.value.data);
      }

      // Handle popular trips
      if (popularTripsRes.status === 'fulfilled') {
        setPublicTrips(popularTripsRes.value.data);
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowTrip = async (tripId: string) => {
    try {
      await dashboardAPI.followTrip(tripId);
      // Remove from recommendations after following
      setPublicTrips(prev => prev.filter(trip => trip.trip_id !== tripId));
    } catch (error) {
      console.error('Error following trip:', error);
    }
  };

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

  const PublicTripCard = ({ trip }: { trip: PublicTrip }) => {
    const fallbackImage = tripImages.get(trip.trip_id);
    const displayImage = trip.cover_image_url || fallbackImage;
    
    return (
      <div className="group bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Trip Image */}
        {displayImage ? (
          <div className="relative h-40 overflow-hidden">
            <img 
              src={displayImage} 
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute top-3 right-3">
              <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Public
              </div>
            </div>
            <div className="absolute bottom-3 left-3 text-white">
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="text-sm opacity-90 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                by {trip.created_by}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-40 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-violet-300" />
            <div className="absolute top-3 right-3">
              <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Public
              </div>
            </div>
            <div className="absolute bottom-3 left-3 text-gray-700">
              <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
              <p className="text-sm opacity-90 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                by {trip.created_by}
              </p>
            </div>
          </div>
        )}

        {/* Trip Content */}
        <div className="p-4">
          {!displayImage && (
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">{trip.title}</h3>
              <p className="text-sm text-purple-600 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                by {trip.created_by}
              </p>
            </div>
          )}

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-purple-500" />
              <span>{getTripDuration(trip.start_date, trip.end_date)} days</span>
            </div>
            {trip.total_budget && (
              <div className="flex items-center text-purple-600 font-semibold">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>{trip.total_budget.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-purple-500" />
            <span className="line-clamp-1">
              {trip.cities.filter(city => city).join(', ')}
            </span>
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
            onClick={() => window.open(`/trips/${trip.trip_id}`, '_blank')}
            className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View</span>
          </button>
          
          <button 
            onClick={() => handleFollowTrip(trip.trip_id)}
            className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Follow</span>
          </button>
        </div>
      </div>
    </div>
    );
  };

  const DestinationCard = ({ destination }: { destination: RecommendedDestination }) => {
    const fallbackImage = destinationImages.get(destination.city_id);
    const displayImage = destination.image_url || fallbackImage;
    
    return (
      <div className="group bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Destination Image */}
        {displayImage ? (
          <div className="relative h-40 overflow-hidden">
            <img 
              src={displayImage} 
              alt={destination.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            {destination.matching_activities && (
              <div className="absolute top-3 right-3">
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Match
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 text-white">
              <h3 className="font-bold text-lg mb-1">{destination.name}</h3>
              <p className="text-sm opacity-90">{destination.country_name}</p>
            </div>
          </div>
        ) : (
          <div className="relative h-40 bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-violet-300" />
            {destination.matching_activities && (
              <div className="absolute top-3 right-3">
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Match
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 text-gray-700">
              <h3 className="font-bold text-lg mb-1">{destination.name}</h3>
              <p className="text-sm opacity-90">{destination.country_name}</p>
            </div>
          </div>
        )}

        {/* Destination Content */}
        <div className="p-4">
          {!displayImage && (
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">{destination.name}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {destination.country_name}
            </p>
          </div>
        )}

        {destination.description && (
          <p className="text-sm text-gray-700 line-clamp-3 mb-4">
            {destination.description}
          </p>
        )}

        {destination.matching_activities && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <Star className="w-3 h-3 mr-1" />
              {destination.matching_activities} matching activities
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-purple-100">
          <button 
            onClick={() => window.open(`/discover?city=${destination.name}`, '_blank')}
            className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Explore</span>
          </button>
          
          <button 
            onClick={() => window.open(`/trips/new?destination=${destination.name}`, '_blank')}
            className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Plan Trip</span>
          </button>
        </div>
      </div>
    </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-md p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-300 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-purple-600 font-medium">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Sparkles className="h-6 w-6 text-purple-500 mr-3" />
            Recommendations For You
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-purple-50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'trips'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            Public Trips ({publicTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('destinations')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'destinations'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            Destinations ({recommendedDestinations.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {activeTab === 'trips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTrips.map(trip => (
              <PublicTripCard key={trip.trip_id} trip={trip} />
            ))}
          </div>
        )}

        {activeTab === 'destinations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedDestinations.map(destination => (
              <DestinationCard key={destination.city_id} destination={destination} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'trips' && publicTrips.length === 0) || 
          (activeTab === 'destinations' && recommendedDestinations.length === 0)) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              {activeTab === 'trips' ? 'No public trips found' : 'No destinations found'}
            </h4>
            <p className="text-purple-600">
              {activeTab === 'trips' 
                ? 'Check back later for new public trip recommendations!' 
                : 'Complete your profile to get personalized destination recommendations!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripRecommendations;
