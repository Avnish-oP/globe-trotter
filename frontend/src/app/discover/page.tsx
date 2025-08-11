'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Heart,
  Eye,
  MessageSquare,
  Star,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PublicTrip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  cover_image_url?: string;
  share_token: string;
  creator_name: string;
  creator_avatar?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration_days: number;
  destinations: Array<{
    city_name: string;
    country_name: string;
    arrival_date: string;
    departure_date: string;
  }>;
  recommendation_reason?: string;
}

interface Filters {
  search: string;
  location: string;
  budget_min: number;
  budget_max: number;
  duration_min: number;
  duration_max: number;
  activities: string;
  sort_by: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'explore' | 'trending' | 'recommendations'>('explore');
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [recommendations, setRecommendations] = useState<PublicTrip[]>([]);
  const [trendingTrips, setTrendingTrips] = useState<PublicTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false
  });

  const [filters, setFilters] = useState<Filters>({
    search: '',
    location: '',
    budget_min: 0,
    budget_max: 50000,
    duration_min: 0,
    duration_max: 30,
    activities: '',
    sort_by: 'popularity'
  });

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchPublicTrips();
    } else if (activeTab === 'trending') {
      fetchTrendingTrips();
    } else if (activeTab === 'recommendations' && user) {
      fetchRecommendations();
    }
  }, [activeTab, filters, user]);

  const fetchPublicTrips = async (page = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        search: filters.search,
        location: filters.location,
        budget_min: filters.budget_min.toString(),
        budget_max: filters.budget_max.toString(),
        duration_min: filters.duration_min.toString(),
        duration_max: filters.duration_max.toString(),
        activities: filters.activities,
        sort_by: filters.sort_by,
        page: page.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/discover/public-trips?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setTrips(data.data.trips);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching public trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrendingTrips = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/discover/trending?limit=12');
      const data = await response.json();

      if (data.success) {
        setTrendingTrips(data.data.trending_trips);
      }
    } catch (error) {
      console.error('Error fetching trending trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/discover/recommendations?limit=12', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    if (activeTab === 'explore') {
      fetchPublicTrips(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTripCardData = () => {
    switch (activeTab) {
      case 'trending':
        return trendingTrips;
      case 'recommendations':
        return recommendations;
      default:
        return trips;
    }
  };

  const TripCard = ({ trip }: { trip: PublicTrip }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* Trip Image */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
        {trip.cover_image_url ? (
          <img 
            src={trip.cover_image_url} 
            alt={trip.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        
        {/* Recommendation Badge */}
        {trip.recommendation_reason && (
          <div className="absolute top-3 left-3">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <Star className="h-3 w-3 mr-1" />
              Recommended
            </span>
          </div>
        )}
        
        {/* Stats Overlay */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {trip.view_count}
          </span>
          <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
            <Heart className="h-3 w-3 mr-1" />
            {trip.like_count}
          </span>
        </div>
      </div>

      {/* Trip Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{trip.title}</h3>
          <button
            onClick={() => window.open(`/shared/${trip.share_token}`, '_blank')}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>

        {/* Creator Info */}
        <div className="flex items-center mb-3">
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
            {trip.creator_avatar ? (
              <img 
                src={trip.creator_avatar} 
                alt={trip.creator_name}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-600">{trip.creator_name.charAt(0)}</span>
            )}
          </div>
          <span className="text-sm text-gray-600">by {trip.creator_name}</span>
        </div>

        {/* Destinations */}
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="font-medium">Destinations:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {trip.destinations.slice(0, 3).map((dest, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {dest.city_name}
              </span>
            ))}
            {trip.destinations.length > 3 && (
              <span className="text-xs text-gray-500">
                +{trip.destinations.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{trip.duration_days} days</span>
            </div>
            {trip.total_budget && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{trip.currency} {trip.total_budget.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-500">
            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
          </div>
        </div>

        {/* Recommendation Reason */}
        {trip.recommendation_reason && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
            {trip.recommendation_reason}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => window.open(`/shared/${trip.share_token}`, '_blank')}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Trip Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Discover Trips</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('explore')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'explore'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'trending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'recommendations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="h-4 w-4 mr-2" />
                For You
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'explore' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips, destinations, activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="City or country"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.budget_min}
                        onChange={(e) => handleFilterChange('budget_min', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.budget_max}
                        onChange={(e) => handleFilterChange('budget_max', parseInt(e.target.value) || 50000)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.duration_min}
                        onChange={(e) => handleFilterChange('duration_min', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.duration_max}
                        onChange={(e) => handleFilterChange('duration_max', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activities
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hiking, museums"
                      value={filters.activities}
                      onChange={(e) => handleFilterChange('activities', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={filters.sort_by}
                      onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="popularity">Most Popular</option>
                      <option value="recent">Most Recent</option>
                      <option value="budget_low">Budget: Low to High</option>
                      <option value="budget_high">Budget: High to Low</option>
                      <option value="duration_short">Duration: Short to Long</option>
                      <option value="duration_long">Duration: Long to Short</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading trips...</span>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'explore' && 'Explore Public Trips'}
                  {activeTab === 'trending' && 'Trending This Week'}
                  {activeTab === 'recommendations' && 'Recommended For You'}
                </h2>
                {activeTab === 'explore' && pagination.total_items > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {pagination.total_items} trips found
                  </p>
                )}
              </div>
            </div>

            {/* Trip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getTripCardData().map((trip) => (
                <TripCard key={trip.trip_id} trip={trip} />
              ))}
            </div>

            {/* No Results */}
            {getTripCardData().length === 0 && !isLoading && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No trips found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'explore' && 'Try adjusting your search filters.'}
                  {activeTab === 'trending' && 'No trending trips this week.'}
                  {activeTab === 'recommendations' && 'Complete your profile to get personalized recommendations.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {activeTab === 'explore' && pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-4">
                <button
                  onClick={() => fetchPublicTrips(pagination.current_page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                
                <button
                  onClick={() => fetchPublicTrips(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
