'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Star,
  DollarSign,
  Thermometer,
  Users,
  Camera,
  Plane,
  Globe,
  TrendingUp,
  Clock,
  Info,
  Plus,
  Check,
  X,
  Filter,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';

interface City {
  city_id: string;
  name: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  population: number;
  timezone: string;
  cost_index: number;
  safety_index: number;
  tourism_popularity: 'low' | 'medium' | 'high' | 'very-high';
  best_time_to_visit: string[];
  average_temperature: number;
  currency: string;
  languages: string[];
  image_url?: string;
  description?: string;
  top_attractions?: string[];
  travel_season?: 'peak' | 'shoulder' | 'off-season';
  visa_required?: boolean;
  flight_time_from?: { [city: string]: string };
}

interface CitySearchProps {
  onCitySelect?: (city: City) => void;
  selectedCities?: Set<string>;
  multiSelect?: boolean;
  showFilters?: boolean;
  excludeCities?: string[];
  className?: string;
  placeholder?: string;
}

const sampleCities: City[] = [
  {
    city_id: '1',
    name: 'Paris',
    country: 'France',
    continent: 'Europe',
    lat: 48.8566,
    lng: 2.3522,
    population: 2161000,
    timezone: 'CET',
    cost_index: 85,
    safety_index: 78,
    tourism_popularity: 'very-high',
    best_time_to_visit: ['Apr', 'May', 'Sep', 'Oct'],
    average_temperature: 12,
    currency: 'EUR',
    languages: ['French'],
    image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400',
    description: 'The City of Light, known for its art, fashion, gastronomy, and culture.',
    top_attractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées'],
    travel_season: 'peak',
    visa_required: false,
    flight_time_from: {
      'New York': '7h 30m',
      'London': '1h 15m',
      'Tokyo': '12h 30m'
    }
  },
  {
    city_id: '2',
    name: 'Tokyo',
    country: 'Japan',
    continent: 'Asia',
    lat: 35.6762,
    lng: 139.6503,
    population: 13960000,
    timezone: 'JST',
    cost_index: 92,
    safety_index: 95,
    tourism_popularity: 'very-high',
    best_time_to_visit: ['Mar', 'Apr', 'May', 'Oct', 'Nov'],
    average_temperature: 16,
    currency: 'JPY',
    languages: ['Japanese'],
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    description: 'A bustling metropolis blending ultra-modern technology with traditional culture.',
    top_attractions: ['Senso-ji Temple', 'Tokyo Skytree', 'Shibuya Crossing', 'Imperial Palace'],
    travel_season: 'shoulder',
    visa_required: false,
    flight_time_from: {
      'New York': '14h 20m',
      'London': '11h 50m',
      'Paris': '12h 30m'
    }
  },
  {
    city_id: '3',
    name: 'New York',
    country: 'United States',
    continent: 'North America',
    lat: 40.7128,
    lng: -74.0060,
    population: 8419000,
    timezone: 'EST',
    cost_index: 100,
    safety_index: 72,
    tourism_popularity: 'very-high',
    best_time_to_visit: ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov'],
    average_temperature: 13,
    currency: 'USD',
    languages: ['English'],
    image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    description: 'The Big Apple - a global hub for finance, arts, fashion, and culture.',
    top_attractions: ['Statue of Liberty', 'Central Park', 'Times Square', 'Empire State Building'],
    travel_season: 'peak',
    visa_required: true,
    flight_time_from: {
      'London': '8h 00m',
      'Paris': '7h 30m',
      'Tokyo': '14h 20m'
    }
  },
  {
    city_id: '4',
    name: 'Barcelona',
    country: 'Spain',
    continent: 'Europe',
    lat: 41.3851,
    lng: 2.1734,
    population: 1620000,
    timezone: 'CET',
    cost_index: 70,
    safety_index: 75,
    tourism_popularity: 'very-high',
    best_time_to_visit: ['May', 'Jun', 'Sep', 'Oct'],
    average_temperature: 16,
    currency: 'EUR',
    languages: ['Spanish', 'Catalan'],
    image_url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400',
    description: 'Vibrant coastal city famous for Gaudí architecture, beaches, and nightlife.',
    top_attractions: ['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Casa Batlló'],
    travel_season: 'shoulder',
    visa_required: false
  },
  {
    city_id: '5',
    name: 'Bangkok',
    country: 'Thailand',
    continent: 'Asia',
    lat: 13.7563,
    lng: 100.5018,
    population: 8281000,
    timezone: 'ICT',
    cost_index: 45,
    safety_index: 68,
    tourism_popularity: 'very-high',
    best_time_to_visit: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    average_temperature: 28,
    currency: 'THB',
    languages: ['Thai'],
    image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
    description: 'Dynamic capital known for ornate temples, street food, and vibrant markets.',
    top_attractions: ['Grand Palace', 'Wat Pho', 'Chatuchak Market', 'Khao San Road'],
    travel_season: 'peak',
    visa_required: false
  },
  {
    city_id: '6',
    name: 'Lisbon',
    country: 'Portugal',
    continent: 'Europe',
    lat: 38.7223,
    lng: -9.1393,
    population: 504000,
    timezone: 'WET',
    cost_index: 55,
    safety_index: 85,
    tourism_popularity: 'high',
    best_time_to_visit: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    average_temperature: 17,
    currency: 'EUR',
    languages: ['Portuguese'],
    image_url: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400',
    description: 'Charming coastal capital with colorful neighborhoods and rich maritime history.',
    top_attractions: ['Belém Tower', 'Jerónimos Monastery', 'Tram 28', 'Alfama District'],
    travel_season: 'shoulder',
    visa_required: false
  }
];

export default function CitySearch({
  onCitySelect,
  selectedCities = new Set(),
  multiSelect = false,
  showFilters = true,
  excludeCities = [],
  className = '',
  placeholder = 'Search cities and destinations...'
}: CitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    continent: 'all',
    costIndex: 'all',
    popularity: 'all',
    safetyIndex: 'all',
    season: 'all',
    visaRequired: 'all'
  });

  const continents = [
    { id: 'all', name: 'All Continents' },
    { id: 'Europe', name: 'Europe' },
    { id: 'Asia', name: 'Asia' },
    { id: 'North America', name: 'North America' },
    { id: 'South America', name: 'South America' },
    { id: 'Africa', name: 'Africa' },
    { id: 'Oceania', name: 'Oceania' }
  ];

  // Search cities based on query and filters
  useEffect(() => {
    searchCities();
  }, [searchQuery, filters]);

  const searchCities = async () => {
    setIsSearching(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filtered = sampleCities.filter(city => !excludeCities.includes(city.city_id));
      
      // Filter by search query
      if (searchQuery.trim()) {
        filtered = filtered.filter(city => 
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.continent.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.top_attractions?.some(attraction => 
            attraction.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }
      
      // Apply filters
      if (filters.continent !== 'all') {
        filtered = filtered.filter(city => city.continent === filters.continent);
      }
      
      if (filters.costIndex !== 'all') {
        const costRanges = {
          'budget': [0, 50],
          'moderate': [50, 75],
          'expensive': [75, 100]
        };
        const range = costRanges[filters.costIndex as keyof typeof costRanges];
        if (range) {
          filtered = filtered.filter(city => city.cost_index >= range[0] && city.cost_index <= range[1]);
        }
      }
      
      if (filters.popularity !== 'all') {
        filtered = filtered.filter(city => city.tourism_popularity === filters.popularity);
      }
      
      if (filters.safetyIndex !== 'all') {
        const safetyThreshold = filters.safetyIndex === 'high' ? 80 : 60;
        filtered = filtered.filter(city => city.safety_index >= safetyThreshold);
      }
      
      if (filters.visaRequired !== 'all') {
        const requiresVisa = filters.visaRequired === 'required';
        filtered = filtered.filter(city => city.visa_required === requiresVisa);
      }
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySelect = (city: City) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  const getCostIndexColor = (costIndex: number) => {
    if (costIndex <= 50) return 'text-green-600';
    if (costIndex <= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCostIndexLabel = (costIndex: number) => {
    if (costIndex <= 50) return 'Budget';
    if (costIndex <= 75) return 'Moderate';
    return 'Expensive';
  };

  const getSafetyColor = (safetyIndex: number) => {
    if (safetyIndex >= 80) return 'text-green-600';
    if (safetyIndex >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case 'very-high': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeasonColor = (season?: string) => {
    switch (season) {
      case 'peak': return 'bg-red-100 text-red-800';
      case 'shoulder': return 'bg-yellow-100 text-yellow-800';
      case 'off-season': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPopulation = (population: number) => {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Search Destinations</h3>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && filtersOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Continent</label>
                <select
                  value={filters.continent}
                  onChange={(e) => setFilters(prev => ({ ...prev, continent: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  {continents.map(continent => (
                    <option key={continent.id} value={continent.id}>{continent.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
                <select
                  value={filters.costIndex}
                  onChange={(e) => setFilters(prev => ({ ...prev, costIndex: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Cost</option>
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="expensive">Expensive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Popularity</label>
                <select
                  value={filters.popularity}
                  onChange={(e) => setFilters(prev => ({ ...prev, popularity: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Popularity</option>
                  <option value="very-high">Very High</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Safety</label>
                <select
                  value={filters.safetyIndex}
                  onChange={(e) => setFilters(prev => ({ ...prev, safetyIndex: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Safety Level</option>
                  <option value="high">High Safety (80+)</option>
                  <option value="medium">Medium Safety (60+)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Season</label>
                <select
                  value={filters.season}
                  onChange={(e) => setFilters(prev => ({ ...prev, season: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Season</option>
                  <option value="peak">Peak Season</option>
                  <option value="shoulder">Shoulder Season</option>
                  <option value="off-season">Off Season</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visa</label>
                <select
                  value={filters.visaRequired}
                  onChange={(e) => setFilters(prev => ({ ...prev, visaRequired: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Any Visa Status</option>
                  <option value="not-required">Visa Free</option>
                  <option value="required">Visa Required</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-6">
        {isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching destinations...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {searchResults.length} destination{searchResults.length !== 1 ? 's' : ''} found
            </div>
            
            {searchResults.map((city) => (
              <div
                key={city.city_id}
                className={`border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer ${
                  selectedCities.has(city.city_id) ? 'border-purple-500 bg-purple-50' : ''
                }`}
                onClick={() => handleCitySelect(city)}
              >
                <div className="flex items-start space-x-4">
                  {/* Image */}
                  <div className="w-24 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {city.image_url ? (
                      <img
                        src={city.image_url}
                        alt={city.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {city.name}, {city.country}
                        </h4>
                        <p className="text-gray-600 text-sm">{city.continent}</p>
                      </div>
                      
                      {selectedCities.has(city.city_id) && (
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {city.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{city.description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        <span className={`font-medium ${getCostIndexColor(city.cost_index)}`}>
                          {getCostIndexLabel(city.cost_index)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 mr-1 text-gray-400" />
                        <span className={`font-medium ${getSafetyColor(city.safety_index)}`}>
                          Safety {city.safety_index}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">{formatPopulation(city.population)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Thermometer className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">{city.average_temperature}°C avg</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPopularityColor(city.tourism_popularity)}`}>
                        {city.tourism_popularity.replace('-', ' ')} popularity
                      </span>
                      
                      {city.travel_season && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeasonColor(city.travel_season)}`}>
                          {city.travel_season.replace('-', ' ')}
                        </span>
                      )}
                      
                      {city.visa_required !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          city.visa_required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {city.visa_required ? 'Visa Required' : 'Visa Free'}
                        </span>
                      )}
                    </div>

                    {/* Best time to visit */}
                    {city.best_time_to_visit && city.best_time_to_visit.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Best time: {city.best_time_to_visit.join(', ')}</span>
                      </div>
                    )}

                    {/* Top attractions */}
                    {city.top_attractions && city.top_attractions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Top attractions:</div>
                        <div className="flex flex-wrap gap-1">
                          {city.top_attractions.slice(0, 4).map((attraction, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {attraction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No destinations found</h4>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  continent: 'all',
                  costIndex: 'all',
                  popularity: 'all',
                  safetyIndex: 'all',
                  season: 'all',
                  visaRequired: 'all'
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
