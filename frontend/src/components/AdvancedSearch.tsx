'use client';

import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  DollarSign,
  Activity,
  Globe,
  SlidersHorizontal,
  X,
  ChevronDown,
  Users,
  Heart,
  Eye,
  ExternalLink,
  Bookmark
} from 'lucide-react';

interface SearchFilters {
  countries: Array<{ country_id: string; name: string; code: string; trip_count: number }>;
  activities: Array<{ activity: string; count: number }>;
  budget_ranges: Array<{ min: number; max: number; count: number }>;
  date_ranges: Array<{ range: string; count: number }>;
  sort_options: Array<{ value: string; label: string }>;
}

interface SearchParams {
  q?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  activity?: string;
  budget_min?: number;
  budget_max?: number;
  country?: string;
  sort?: 'created_at' | 'likes' | 'start_date' | 'budget';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  cities: string[];
  countries: string[];
  activities: string[];
  creator_name: string;
  creator_profile_picture?: string;
  likes_count: number;
  views_count: number;
  cover_image_url?: string;
  visibility: string;
  share_token: string;
}

interface AdvancedSearchProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function AdvancedSearch({ onClose, isModal = false }: AdvancedSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    limit: 10,
    offset: 0,
    sort: 'created_at',
    order: 'desc'
  });
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Load filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await dashboardAPI.getSearchFilters();
      setSearchFilters(response.data);
    } catch (error) {
      console.error('Error fetching search filters:', error);
    }
  };

  const handleSearch = async (resetOffset = true) => {
    if (!searchParams.q && !searchParams.destination && !searchParams.activity && !searchParams.country) {
      return;
    }

    setIsLoading(true);
    try {
      const params = { ...searchParams };
      if (resetOffset) {
        params.offset = 0;
      }

      const response = await dashboardAPI.searchPublicTrips(params);
      
      if (resetOffset) {
        setSearchResults(response.data.trips);
      } else {
        setSearchResults(prev => [...prev, ...response.data.trips]);
      }
      
      setTotalResults(response.data.total);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setSearchParams(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 10)
    }));
    handleSearch(false);
  };

  const handleFollowTrip = async (tripId: string) => {
    try {
      await dashboardAPI.followTrip(tripId);
      // Update the UI to show the trip is followed
      // You might want to add a success toast here
    } catch (error) {
      console.error('Error following trip:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const containerClasses = isModal 
    ? "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
    : "w-full max-w-6xl mx-auto";

  const contentClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8"
    : "bg-white rounded-2xl border border-purple-200/50 shadow-md";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Search className="w-6 h-6 text-purple-600 mr-3" />
              Discover Public Trips
            </h2>
            <p className="text-gray-600 mt-1">
              Search and discover amazing travel itineraries shared by our community
            </p>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-gray-200">
          {/* Main Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search trips by title, description, or destination..."
                  value={searchParams.q || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, q: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                />
              </div>
            </div>
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`px-4 py-3 border rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                isFiltersOpen 
                  ? 'bg-purple-50 border-purple-300 text-purple-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {isFiltersOpen && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Destination Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="City or landmark"
                    value={searchParams.destination || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>

                {/* Activity Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Activity className="w-4 h-4 inline mr-1" />
                    Activity
                  </label>
                  <select
                    value={searchParams.activity || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, activity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  >
                    <option value="">All Activities</option>
                    {searchFilters?.activities?.map((activity) => (
                      <option key={activity.activity} value={activity.activity}>
                        {activity.activity} ({activity.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Country
                  </label>
                  <select
                    value={searchParams.country || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  >
                    <option value="">All Countries</option>
                    {searchFilters?.countries?.map((country) => (
                      <option key={country.country_id} value={country.name}>
                        {country.name} ({country.trip_count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${searchParams.sort}-${searchParams.order}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSearchParams(prev => ({ 
                        ...prev, 
                        sort: sort as any,
                        order: order as any
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="likes-desc">Most Liked</option>
                    <option value="start_date-desc">Latest Trips</option>
                    <option value="start_date-asc">Earliest Trips</option>
                    <option value="budget-desc">Highest Budget</option>
                    <option value="budget-asc">Lowest Budget</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date (After)
                  </label>
                  <input
                    type="date"
                    value={searchParams.start_date || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Before)
                  </label>
                  <input
                    type="date"
                    value={searchParams.end_date || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Min Budget
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={searchParams.budget_min || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, budget_min: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Budget
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={searchParams.budget_max || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, budget_max: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSearchParams({
                      limit: 10,
                      offset: 0,
                      sort: 'created_at',
                      order: 'desc'
                    });
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="p-6">
          {hasSearched && (
            <div className="mb-4">
              <p className="text-gray-600">
                Found {totalResults} public trip{totalResults !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Results Grid */}
          <div className="space-y-6">
            {searchResults.map((trip) => (
              <div key={trip.trip_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Trip Image */}
                  <div className="lg:w-48 lg:h-32 w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden flex-shrink-0">
                    {trip.cover_image_url ? (
                      <img
                        src={trip.cover_image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Trip Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate mb-2">
                          {trip.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {trip.description}
                        </p>

                        {/* Trip Meta */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatBudget(trip.total_budget, trip.currency)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {trip.cities.slice(0, 2).join(', ')}
                            {trip.cities.length > 2 && ` +${trip.cities.length - 2} more`}
                          </div>
                        </div>

                        {/* Activities */}
                        {trip.activities && trip.activities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {trip.activities.slice(0, 3).map((activity, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {activity}
                              </span>
                            ))}
                            {trip.activities.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{trip.activities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Creator Info */}
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs mr-2">
                            {trip.creator_profile_picture ? (
                              <img
                                src={trip.creator_profile_picture}
                                alt={trip.creator_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              trip.creator_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>by {trip.creator_name}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col lg:items-end gap-3">
                        {/* Stats */}
                        <div className="flex gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {trip.likes_count}
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {trip.views_count}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFollowTrip(trip.trip_id)}
                            className="px-3 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-sm flex items-center"
                          >
                            <Bookmark className="w-4 h-4 mr-1" />
                            Follow
                          </button>
                          <a
                            href={`/trip/${trip.share_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {searchResults.length > 0 && searchResults.length < totalResults && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* No Results */}
          {hasSearched && searchResults.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No trips found</h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters to find more results.
              </p>
            </div>
          )}

          {/* Initial State */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Discover Amazing Trips</h3>
              <p className="text-gray-500">
                Search for destinations, activities, or explore by filters to find inspiring travel itineraries.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
