'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Star,
  DollarSign,
  Clock,
  Users,
  Camera,
  Utensils,
  ShoppingBag,
  Mountain,
  Building,
  Compass,
  Filter,
  SlidersHorizontal,
  X,
  Heart,
  ExternalLink,
  Calendar,
  Ticket,
  Globe,
  Info
} from 'lucide-react';

interface Activity {
  activity_id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  lat?: number;
  lng?: number;
  estimated_cost: string;
  duration: string;
  rating?: number;
  review_count?: number;
  popularity: string;
  difficulty_level?: 'easy' | 'moderate' | 'hard';
  age_group?: string;
  group_size?: string;
  image_url?: string;
  website?: string;
  booking_required?: boolean;
  seasonal?: boolean;
  indoor?: boolean;
  accessibility?: boolean;
  tags?: string[];
}

interface ActivitySearchProps {
  location?: string;
  onActivitySelect?: (activity: Activity) => void;
  selectedActivities?: Set<string>;
  multiSelect?: boolean;
  showFilters?: boolean;
  categories?: string[];
  className?: string;
}

const defaultCategories = [
  { id: 'all', name: 'All Activities', icon: <Compass className="w-4 h-4" /> },
  { id: 'sightseeing', name: 'Sightseeing', icon: <Camera className="w-4 h-4" /> },
  { id: 'food-drink', name: 'Food & Drink', icon: <Utensils className="w-4 h-4" /> },
  { id: 'shopping', name: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'outdoor', name: 'Outdoor & Adventure', icon: <Mountain className="w-4 h-4" /> },
  { id: 'culture', name: 'Culture & History', icon: <Building className="w-4 h-4" /> },
  { id: 'nightlife', name: 'Nightlife & Entertainment', icon: <Users className="w-4 h-4" /> },
  { id: 'wellness', name: 'Wellness & Relaxation', icon: <Heart className="w-4 h-4" /> },
  { id: 'tours', name: 'Tours & Experiences', icon: <Globe className="w-4 h-4" /> }
];

const sampleActivities: Activity[] = [
  {
    activity_id: '1',
    name: 'Eiffel Tower Skip-the-Line Tour',
    description: 'Skip the long lines and enjoy breathtaking views from the iconic Eiffel Tower with a knowledgeable guide.',
    category: 'sightseeing',
    subcategory: 'landmarks',
    location: 'Paris, France',
    lat: 48.8584,
    lng: 2.2945,
    estimated_cost: '$35',
    duration: '2 hours',
    rating: 4.7,
    review_count: 15420,
    popularity: 'Very High',
    difficulty_level: 'easy',
    age_group: 'All ages',
    group_size: 'Any size',
    booking_required: true,
    seasonal: false,
    indoor: false,
    accessibility: true,
    image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
    tags: ['iconic', 'views', 'photography', 'must-see']
  },
  {
    activity_id: '2',
    name: 'Seine River Dinner Cruise',
    description: 'Romantic dinner cruise along the Seine with stunning views of Paris landmarks and gourmet French cuisine.',
    category: 'food-drink',
    subcategory: 'fine-dining',
    location: 'Paris, France',
    estimated_cost: '$85',
    duration: '3 hours',
    rating: 4.5,
    review_count: 8350,
    popularity: 'High',
    difficulty_level: 'easy',
    age_group: 'Adults recommended',
    group_size: 'Couples/small groups',
    booking_required: true,
    seasonal: false,
    indoor: true,
    accessibility: true,
    image_url: 'https://images.unsplash.com/photo-1569943916595-c8b6a80b7d8f?w=400',
    tags: ['romantic', 'dining', 'cruise', 'evening']
  },
  {
    activity_id: '3',
    name: 'Louvre Museum Guided Tour',
    description: 'Explore the world\'s largest art museum with an expert guide, including must-see masterpieces like the Mona Lisa.',
    category: 'culture',
    subcategory: 'museums',
    location: 'Paris, France',
    estimated_cost: '$45',
    duration: '3.5 hours',
    rating: 4.6,
    review_count: 12870,
    popularity: 'Very High',
    difficulty_level: 'easy',
    age_group: 'All ages',
    group_size: 'Any size',
    booking_required: true,
    seasonal: false,
    indoor: true,
    accessibility: true,
    image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    tags: ['art', 'culture', 'history', 'educational']
  },
  {
    activity_id: '4',
    name: 'Montmartre Food Walking Tour',
    description: 'Discover the culinary delights of Montmartre with tastings at local bakeries, cheese shops, and cafes.',
    category: 'food-drink',
    subcategory: 'food-tours',
    location: 'Paris, France',
    estimated_cost: '$75',
    duration: '3 hours',
    rating: 4.8,
    review_count: 5670,
    popularity: 'High',
    difficulty_level: 'easy',
    age_group: 'All ages',
    group_size: 'Small groups',
    booking_required: true,
    seasonal: false,
    indoor: false,
    accessibility: false,
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    tags: ['food', 'walking', 'local', 'tastings']
  },
  {
    activity_id: '5',
    name: 'Versailles Palace Day Trip',
    description: 'Full-day excursion to the magnificent Palace of Versailles with skip-the-line access and garden visit.',
    category: 'sightseeing',
    subcategory: 'palaces',
    location: 'Versailles, France',
    estimated_cost: '$65',
    duration: '8 hours',
    rating: 4.4,
    review_count: 9830,
    popularity: 'High',
    difficulty_level: 'moderate',
    age_group: 'All ages',
    group_size: 'Any size',
    booking_required: true,
    seasonal: false,
    indoor: true,
    accessibility: true,
    image_url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400',
    tags: ['history', 'palace', 'gardens', 'day-trip']
  },
  {
    activity_id: '6',
    name: 'Hot Air Balloon Over Loire Valley',
    description: 'Breathtaking hot air balloon flight over the stunning châteaux and vineyards of the Loire Valley.',
    category: 'outdoor',
    subcategory: 'adventure',
    location: 'Loire Valley, France',
    estimated_cost: '$220',
    duration: '4 hours',
    rating: 4.9,
    review_count: 2340,
    popularity: 'Medium',
    difficulty_level: 'easy',
    age_group: 'All ages',
    group_size: 'Small groups',
    booking_required: true,
    seasonal: true,
    indoor: false,
    accessibility: false,
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    tags: ['adventure', 'scenic', 'unique', 'aerial-views']
  }
];

export default function ActivitySearch({
  location,
  onActivitySelect,
  selectedActivities = new Set(),
  multiSelect = false,
  showFilters = true,
  categories = [],
  className = ''
}: ActivitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    duration: 'all',
    rating: 0,
    difficulty: 'all',
    bookingRequired: false,
    accessibility: false,
    indoor: 'all'
  });

  const activeCategoriesList = categories.length > 0 
    ? defaultCategories.filter(cat => categories.includes(cat.id) || cat.id === 'all')
    : defaultCategories;

  // Search activities based on query and filters
  useEffect(() => {
    searchActivities();
  }, [searchQuery, filters, location]);

  const searchActivities = async () => {
    setIsSearching(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = sampleActivities;
      
      // Filter by location if specified
      if (location) {
        filtered = filtered.filter(activity => 
          activity.location.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        filtered = filtered.filter(activity => 
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply filters
      if (filters.category !== 'all') {
        filtered = filtered.filter(activity => activity.category === filters.category);
      }
      
      if (filters.rating > 0) {
        filtered = filtered.filter(activity => activity.rating && activity.rating >= filters.rating);
      }
      
      if (filters.difficulty !== 'all') {
        filtered = filtered.filter(activity => activity.difficulty_level === filters.difficulty);
      }
      
      if (filters.bookingRequired) {
        filtered = filtered.filter(activity => activity.booking_required);
      }
      
      if (filters.accessibility) {
        filtered = filtered.filter(activity => activity.accessibility);
      }
      
      if (filters.indoor !== 'all') {
        const isIndoor = filters.indoor === 'indoor';
        filtered = filtered.filter(activity => activity.indoor === isIndoor);
      }
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching activities:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = activeCategoriesList.find(c => c.id === category);
    return cat ? cat.icon : <Compass className="w-4 h-4" />;
  };

  const getPriceColor = (cost: string) => {
    if (cost.toLowerCase().includes('free')) return 'text-green-600';
    const price = parseInt(cost.replace(/[^0-9]/g, ''));
    if (price >= 100) return 'text-red-600';
    if (price >= 50) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Discover Activities
            {location && <span className="text-gray-600 font-normal"> in {location}</span>}
          </h3>
          {showFilters && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2 border rounded-lg transition-colors flex items-center text-sm ${
                filtersOpen ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities, tours, experiences..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {activeCategoriesList.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
              className={`flex items-center px-3 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                filters.category === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              <span className="ml-1">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && filtersOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Price</option>
                  <option value="free">Free</option>
                  <option value="budget">Under $25</option>
                  <option value="moderate">$25-$100</option>
                  <option value="expensive">$100+</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Duration</option>
                  <option value="short">Under 2 hours</option>
                  <option value="medium">2-6 hours</option>
                  <option value="long">6+ hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Level</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={filters.indoor}
                  onChange={(e) => setFilters(prev => ({ ...prev, indoor: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Indoor/Outdoor</option>
                  <option value="indoor">Indoor Only</option>
                  <option value="outdoor">Outdoor Only</option>
                </select>
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-4">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.bookingRequired}
                  onChange={(e) => setFilters(prev => ({ ...prev, bookingRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                />
                Booking Required
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.accessibility}
                  onChange={(e) => setFilters(prev => ({ ...prev, accessibility: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                />
                Wheelchair Accessible
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-6">
        {isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching activities...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((activity) => (
              <div
                key={activity.activity_id}
                className={`border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer ${
                  selectedActivities.has(activity.activity_id) ? 'border-purple-500 bg-purple-50' : ''
                }`}
                onClick={() => handleActivitySelect(activity)}
              >
                <div className="flex items-start space-x-4">
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {activity.image_url ? (
                      <img
                        src={activity.image_url}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {getCategoryIcon(activity.category)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{activity.name}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2">{activity.description}</p>
                      </div>
                      
                      {/* Price */}
                      <div className="ml-4 text-right">
                        <div className={`text-lg font-bold ${getPriceColor(activity.estimated_cost)}`}>
                          {activity.estimated_cost}
                        </div>
                        <div className="text-xs text-gray-500">per person</div>
                      </div>
                    </div>

                    {/* Rating and Reviews */}
                    {activity.rating && (
                      <div className="flex items-center mb-2">
                        <div className="flex items-center mr-2">
                          {renderStars(activity.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {activity.rating} ({activity.review_count?.toLocaleString()} reviews)
                        </span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {activity.duration}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {activity.location}
                      </div>
                      {activity.difficulty_level && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(activity.difficulty_level)}`}>
                          {activity.difficulty_level}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {activity.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Additional Info Icons */}
                    <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500">
                      {activity.booking_required && (
                        <div className="flex items-center">
                          <Ticket className="w-3 h-3 mr-1" />
                          Booking Required
                        </div>
                      )}
                      {activity.accessibility && (
                        <div className="flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          Accessible
                        </div>
                      )}
                      {activity.seasonal && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Seasonal
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h4>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  category: 'all',
                  priceRange: 'all',
                  duration: 'all',
                  rating: 0,
                  difficulty: 'all',
                  bookingRequired: false,
                  accessibility: false,
                  indoor: 'all'
                });
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
