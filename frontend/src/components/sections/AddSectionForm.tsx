'use client';

import React, { useState, useEffect } from 'react';
import { sectionsAPI, locationAPI } from '@/lib/api';
import PlaceSelectionMap from './PlaceSelectionMap';

interface AddSectionFormProps {
  tripId: string;
  onSectionAdded: () => void;
  onCancel: () => void;
}

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  full_name: string;
  type: string;
  display_name: string;
}

interface PopularPlace {
  name: string;
  lat?: number;
  lng?: number;
  description: string;
  estimated_cost: string;
  popularity: string;
}

export default function AddSectionForm({ tripId, onSectionAdded, onCancel }: AddSectionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    budget_level: 'medium' as 'low' | 'medium' | 'high',
    attractions: [] as string[]
  });
  
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularPlaces, setPopularPlaces] = useState<PopularPlace[]>([]);
  const [showPopularPlaces, setShowPopularPlaces] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<PopularPlace[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Debounced location search
  const handleLocationSearch = async (query: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      setPopularPlaces([]);
      setShowPopularPlaces(false);
      return;
    }

    // Set new timeout for debouncing
    const newTimeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        // Use external API for location search
        const response = await locationAPI.searchLocationsExternal(query);
        
        if (response.success && response.data) {
          setLocationSuggestions(response.data.slice(0, 5)); // Limit to 5 suggestions
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setLocationSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce delay

    setSearchTimeout(newTimeout);
  };

  const selectLocation = async (location: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: location.full_name || location.name
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
    
    // Fetch popular places for the selected location
    await fetchPopularPlaces(location.full_name || location.name);
    setShowMap(true);
  };

  const fetchPopularPlaces = async (locationName: string) => {
    if (!locationName) return;
    
    try {
      setIsLoadingPlaces(true);
      console.log('Fetching places for location:', locationName);
      
      // Create a temporary section to get place suggestions
      const requestBody = {
        location: locationName,
        budget: formData.budget_level,
        experiences: []
      };
      
      console.log('Request body:', requestBody);
      
      // Make direct API call to get suggestions
      const response = await fetch('/api/sections/suggest-places-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        if (data.success && data.data?.suggestions?.places) {
          // Filter only popular and very popular places
          const filteredPlaces = data.data.suggestions.places.filter((place: PopularPlace) => 
            place.popularity === 'popular' || place.popularity === 'very popular'
          );
          console.log('Filtered places:', filteredPlaces);
          setPopularPlaces(filteredPlaces.slice(0, 8)); // Show max 8 places
          setShowPopularPlaces(true);
        } else {
          console.log('No places found in response');
          // Set some mock places if API fails
          setPopularPlaces([
            {
              name: "Local Market",
              lat: 28.6139,
              lng: 77.2090,
              description: "Experience local culture and cuisine at the bustling market.",
              estimated_cost: "₹100-500",
              popularity: "popular"
            },
            {
              name: "Historical Monument",
              description: "Visit iconic historical landmarks and learn about local history.",
              estimated_cost: "₹50-200",
              popularity: "very popular"
            },
            {
              name: "Local Restaurant",
              description: "Try authentic local cuisine at this highly recommended restaurant.",
              estimated_cost: "₹200-800",
              popularity: "popular"
            }
          ]);
          setShowPopularPlaces(true);
        }
      } else {
        console.error('API call failed with status:', response.status);
        // Set mock places as fallback
        setPopularPlaces([
          {
            name: "Local Market",
            lat: 28.6139,
            lng: 77.2090,
            description: "Experience local culture and cuisine at the bustling market.",
            estimated_cost: "₹100-500",
            popularity: "popular"
          },
          {
            name: "Historical Monument",
            description: "Visit iconic historical landmarks and learn about local history.",
            estimated_cost: "₹50-200",
            popularity: "very popular"
          },
          {
            name: "Local Restaurant",
            description: "Try authentic local cuisine at this highly recommended restaurant.",
            estimated_cost: "₹200-800",
            popularity: "popular"
          }
        ]);
        setShowPopularPlaces(true);
      }
    } catch (error) {
      console.error('Error fetching popular places:', error);
      // Set mock places as fallback
      setPopularPlaces([
        {
          name: "Local Market",
          lat: 28.6139,
          lng: 77.2090,
          description: "Experience local culture and cuisine at the bustling market.",
          estimated_cost: "₹100-500",
          popularity: "popular"
        },
        {
          name: "Historical Monument",
          description: "Visit iconic historical landmarks and learn about local history.",
          estimated_cost: "₹50-200",
          popularity: "very popular"
        },
        {
          name: "Local Restaurant",
          description: "Try authentic local cuisine at this highly recommended restaurant.",
          estimated_cost: "₹200-800",
          popularity: "popular"
        }
      ]);
      setShowPopularPlaces(true);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handlePlaceSelect = (place: PopularPlace) => {
    if (!selectedPlaces.some(p => p.name === place.name)) {
      setSelectedPlaces(prev => [...prev, place]);
      setFormData(prev => ({
        ...prev,
        attractions: [...prev.attractions, place.name]
      }));
    }
  };

  const handlePlaceDeselect = (place: PopularPlace) => {
    setSelectedPlaces(prev => prev.filter(p => p.name !== place.name));
    setFormData(prev => ({
      ...prev,
      attractions: prev.attractions.filter(attraction => attraction !== place.name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_date || !formData.end_date || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare form data with attractions included in description
      const submissionData = {
        ...formData,
        description: formData.attractions.length > 0 
          ? `${formData.description}\n\nPlanned Attractions:\n${formData.attractions.map(attraction => `• ${attraction}`).join('\n')}`
          : formData.description
      };
      
      await sectionsAPI.createSection(tripId, submissionData);
      onSectionAdded();
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Section</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Exploring Old Delhi"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what you plan to do in this section..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, location: e.target.value }));
                // Clear popular places when user starts typing again
                if (showPopularPlaces) {
                  setShowPopularPlaces(false);
                  setPopularPlaces([]);
                }
                handleLocationSearch(e.target.value);
              }}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isLoading 
                  ? 'border-blue-300 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Type to search cities, places, or countries..."
              required
            />
            
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}

            {!isLoading && formData.location && !showSuggestions && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          {showSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {locationSuggestions.map((location, index) => (
                <div
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                    index !== locationSuggestions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{location.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{location.display_name}</div>
                      <div className="flex items-center mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {location.type}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">External API</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Places Preview - Right after location selection */}
        {showPopularPlaces && (
          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-900 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Popular Places in {formData.location}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowPopularPlaces(false);
                  setPopularPlaces([]);
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-100"
                title="Hide popular places"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isLoadingPlaces ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-3 text-sm text-blue-700">Discovering amazing places...</span>
              </div>
            ) : popularPlaces.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {popularPlaces.slice(0, 6).map((place, index) => (
                    <div 
                      key={index} 
                      className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => {
                        // Add to attractions if there's space
                        if (formData.attractions.length < 5 && !formData.attractions.includes(place.name)) {
                          setFormData(prev => ({
                            ...prev,
                            attractions: [...prev.attractions, place.name]
                          }));
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                            {place.name}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{place.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                              {place.estimated_cost}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              place.popularity === 'very popular' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {place.popularity}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between p-2 bg-blue-100 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-3 w-3 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-blue-700 font-medium">
                      Click places to add them to your attractions list
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                    {formData.attractions.length}/5 added
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <svg className="h-6 w-6 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-gray-500 text-sm font-medium">
                  No popular places found for this location
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  You can still add your own attractions manually below
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interactive Map for Place Selection */}
        {formData.location && (
          <div className="mt-6">
            {isLoadingPlaces && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading places...</p>
              </div>
            )}
            
            {!isLoadingPlaces && popularPlaces.length > 0 && (
              <PlaceSelectionMap
                location={formData.location}
                places={popularPlaces}
                selectedPlaces={selectedPlaces}
                onPlaceSelect={handlePlaceSelect}
                onPlaceDeselect={handlePlaceDeselect}
                height="500px"
                className="mb-6"
              />
            )}
            
            {!isLoadingPlaces && popularPlaces.length === 0 && formData.location && (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-600">No places found for "{formData.location}". Try a different location.</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Attractions List */}
        {formData.attractions.length > 0 && (
          <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-green-900 flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Selected Attractions ({formData.attractions.length})
              </h4>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, attractions: [] }))}
                className="text-green-600 hover:text-green-800 transition-colors text-xs"
              >
                Clear all
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.attractions.map((attraction, index) => (
                <div 
                  key={index}
                  className="flex items-center bg-white border border-green-200 rounded-full px-3 py-1"
                >
                  <span className="text-sm text-gray-800">{attraction}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        attractions: prev.attractions.filter((_, i) => i !== index)
                      }));
                    }}
                    className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-green-700 mt-2">
              These attractions will be added to your section notes automatically
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget Level
          </label>
          <select
            value={formData.budget_level}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_level: e.target.value as 'low' | 'medium' | 'high' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low Budget</option>
            <option value="medium">Medium Budget</option>
            <option value="high">High Budget</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Section'}
          </button>
        </div>
      </form>
    </div>
  );
}
