'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { sectionsAPI, placesAPI } from '@/lib/api';
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
  Plus,
  Minus,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  X,
  Check,
  Heart,
  ExternalLink,
  Info
} from 'lucide-react';

interface TripSection {
  section_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
}

interface Place {
  place_id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  estimated_cost: string;
  popularity: string;
  category: string;
  address: string;
  image_url?: string;
  rating?: number;
  duration?: string;
  opening_hours?: string;
  website?: string;
  phone?: string;
}

interface SearchFilters {
  category: string;
  priceRange: string;
  rating: number;
  duration: string;
  openNow: boolean;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: <Compass className="w-4 h-4" /> },
  { id: 'attractions', name: 'Attractions', icon: <Camera className="w-4 h-4" /> },
  { id: 'restaurants', name: 'Restaurants', icon: <Utensils className="w-4 h-4" /> },
  { id: 'shopping', name: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'outdoor', name: 'Outdoor', icon: <Mountain className="w-4 h-4" /> },
  { id: 'museums', name: 'Museums', icon: <Building className="w-4 h-4" /> },
  { id: 'nightlife', name: 'Nightlife', icon: <Users className="w-4 h-4" /> }
];

const priceRanges = [
  { id: 'all', name: 'Any Price', value: '' },
  { id: 'budget', name: 'Budget ($)', value: 'low' },
  { id: 'moderate', name: 'Moderate ($$)', value: 'medium' },
  { id: 'expensive', name: 'Expensive ($$$)', value: 'high' },
  { id: 'luxury', name: 'Luxury ($$$$)', value: 'luxury' }
];

export default function PlacesSearchScreen() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const tripId = params.tripId as string;
  const sectionId = params.sectionId as string;

  const [section, setSection] = useState<TripSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    priceRange: 'all',
    rating: 0,
    duration: 'all',
    openNow: false
  });

  // Sample places data - in real app, this would come from APIs like Google Places, Foursquare, etc.
  const samplePlaces: Place[] = [
    {
      place_id: '1',
      name: 'Eiffel Tower',
      description: 'Iconic iron lattice tower and symbol of Paris',
      lat: 48.8584,
      lng: 2.2945,
      estimated_cost: '$25',
      popularity: 'Very High',
      category: 'attractions',
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
      rating: 4.6,
      duration: '2-3 hours',
      opening_hours: '9:30 AM - 11:45 PM',
      image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400'
    },
    {
      place_id: '2',
      name: 'Louvre Museum',
      description: 'World\'s largest art museum and historic monument',
      lat: 48.8606,
      lng: 2.3376,
      estimated_cost: '$17',
      popularity: 'Very High',
      category: 'museums',
      address: 'Rue de Rivoli, 75001 Paris',
      rating: 4.7,
      duration: '3-4 hours',
      opening_hours: '9:00 AM - 6:00 PM',
      image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400'
    },
    {
      place_id: '3',
      name: 'Notre-Dame Cathedral',
      description: 'Medieval Catholic cathedral and Gothic architecture masterpiece',
      lat: 48.8530,
      lng: 2.3499,
      estimated_cost: 'Free',
      popularity: 'High',
      category: 'attractions',
      address: '6 Parvis Notre-Dame, 75004 Paris',
      rating: 4.5,
      duration: '1-2 hours',
      opening_hours: '8:00 AM - 6:45 PM',
      image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400'
    },
    {
      place_id: '4',
      name: 'Le Comptoir du Relais',
      description: 'Traditional French bistro with authentic Parisian atmosphere',
      lat: 48.8519,
      lng: 2.3386,
      estimated_cost: '$45',
      popularity: 'Medium',
      category: 'restaurants',
      address: '9 Carrefour de l\'Odéon, 75006 Paris',
      rating: 4.3,
      duration: '1-2 hours',
      opening_hours: '12:00 PM - 2:00 PM, 7:00 PM - 11:00 PM',
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'
    },
    {
      place_id: '5',
      name: 'Champs-Élysées',
      description: 'Famous avenue for shopping and strolling',
      lat: 48.8698,
      lng: 2.3076,
      estimated_cost: 'Free',
      popularity: 'High',
      category: 'shopping',
      address: 'Champs-Élysées, 75008 Paris',
      rating: 4.2,
      duration: '2-3 hours',
      opening_hours: '24 hours',
      image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400'
    },
    {
      place_id: '6',
      name: 'Sacré-Cœur',
      description: 'Beautiful basilica with panoramic city views',
      lat: 48.8867,
      lng: 2.3431,
      estimated_cost: 'Free',
      popularity: 'High',
      category: 'attractions',
      address: '35 Rue du Chevalier de la Barre, 75018 Paris',
      rating: 4.4,
      duration: '1-2 hours',
      opening_hours: '6:00 AM - 10:30 PM',
      image_url: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400'
    }
  ];

  // Load section data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (sectionId) {
      loadSectionData();
    }
  }, [sectionId, isAuthenticated]);

  // Search places based on query and filters
  useEffect(() => {
    if (section) {
      searchPlaces();
    }
  }, [searchQuery, filters, section]);

  const loadSectionData = async () => {
    try {
      setIsLoading(true);
      const response = await sectionsAPI.getSectionById(sectionId);
      setSection(response.data);
    } catch (error) {
      console.error('Error loading section data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlaces = async () => {
    setIsSearching(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter sample places based on search query and filters
      let filtered = samplePlaces;
      
      if (searchQuery.trim()) {
        filtered = filtered.filter(place => 
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.category !== 'all') {
        filtered = filtered.filter(place => place.category === filters.category);
      }
      
      if (filters.rating > 0) {
        filtered = filtered.filter(place => place.rating && place.rating >= filters.rating);
      }
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const togglePlaceSelection = (placeId: string) => {
    setSelectedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const addSelectedPlaces = async () => {
    if (selectedPlaces.size === 0) return;
    
    try {
      const placesToAdd = searchResults.filter(place => selectedPlaces.has(place.place_id));
      
      // In a real app, you would call an API to add places to the section
      console.log('Adding places to section:', placesToAdd);
      
      // For now, just navigate back
      router.push(`/trips/${tripId}/itinerary`);
      
    } catch (error) {
      console.error('Error adding places:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : <MapPin className="w-4 h-4" />;
  };

  const getPriceColor = (cost: string) => {
    if (cost.toLowerCase().includes('free')) return 'text-green-600';
    if (cost.includes('$$$')) return 'text-red-600';
    if (cost.includes('$$')) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Section not found</h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add Places & Activities</h1>
                <p className="text-gray-600 mt-1">{section.title} • {section.location}</p>
              </div>
            </div>
            
            {selectedPlaces.size > 0 && (
              <button
                onClick={addSelectedPlaces}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedPlaces.size} Place{selectedPlaces.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search places in ${section.location}...`}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border rounded-lg transition-colors flex items-center ${
                  showFilters ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
                className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filters.category === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {priceRanges.map((range) => (
                      <option key={range.id} value={range.id}>{range.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    value={filters.duration}
                    onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">Any Duration</option>
                    <option value="short">Under 1 hour</option>
                    <option value="medium">1-3 hours</option>
                    <option value="long">3+ hours</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.openNow}
                      onChange={(e) => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Open now</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-6">
          {isSearching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for places...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchResults.length} place{searchResults.length !== 1 ? 's' : ''} found
                </h2>
                {selectedPlaces.size > 0 && (
                  <p className="text-purple-600 font-medium">
                    {selectedPlaces.size} selected
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((place) => (
                  <div
                    key={place.place_id}
                    className={`bg-white rounded-2xl border shadow-md overflow-hidden transition-all duration-200 cursor-pointer ${
                      selectedPlaces.has(place.place_id)
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                    }`}
                    onClick={() => togglePlaceSelection(place.place_id)}
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200">
                      {place.image_url ? (
                        <img
                          src={place.image_url}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="w-12 h-12" />
                        </div>
                      )}
                      
                      {/* Selection indicator */}
                      <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlaces.has(place.place_id)
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-white border-gray-300'
                      }`}>
                        {selectedPlaces.has(place.place_id) && <Check className="w-4 h-4" />}
                      </div>
                      
                      {/* Category badge */}
                      <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center">
                        {getCategoryIcon(place.category)}
                        <span className="ml-1 capitalize">{place.category}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{place.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{place.description}</p>
                      </div>

                      {/* Rating */}
                      {place.rating && (
                        <div className="flex items-center mb-2">
                          <div className="flex items-center mr-2">
                            {renderStars(place.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{place.rating}</span>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span className={getPriceColor(place.estimated_cost)}>
                              {place.estimated_cost}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{place.duration}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{place.address}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open in maps or show more details
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
                        >
                          <Info className="w-4 h-4 mr-1" />
                          Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to favorites
                          }}
                          className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No places found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find more places
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    category: 'all',
                    priceRange: 'all',
                    rating: 0,
                    duration: 'all',
                    openNow: false
                  });
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Fixed bottom bar for selection */}
        {selectedPlaces.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-gray-700 font-medium">
                  {selectedPlaces.size} place{selectedPlaces.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedPlaces(new Set())}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={addSelectedPlaces}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Itinerary
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
