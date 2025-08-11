'use client';

import React, { useState, useEffect } from 'react';
import { sectionsAPI } from '@/lib/api';

interface Place {
  name: string;
  lat?: number;
  lng?: number;
  description: string;
  estimated_cost: string;
  popularity: string;
}

interface PlaceSuggestionsProps {
  sectionId: string;
  sectionTitle: string;
  onPlacesSaved: () => void;
}

export default function PlaceSuggestions({ sectionId, sectionTitle, onPlacesSaved }: PlaceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [sectionId]);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await sectionsAPI.getSuggestions(sectionId);
      
      if (response.success && response.data?.suggestions?.places) {
        setSuggestions(response.data.suggestions.places);
      } else {
        setError('No suggestions available for this location');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setError('Failed to load place suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaceSelection = (place: Place) => {
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.name === place.name);
      if (isSelected) {
        return prev.filter(p => p.name !== place.name);
      } else {
        return [...prev, place];
      }
    });
  };

  const isPlaceSelected = (place: Place) => {
    return selectedPlaces.some(p => p.name === place.name);
  };

  const savePlaces = async () => {
    if (selectedPlaces.length === 0) {
      alert('Please select at least one place');
      return;
    }

    try {
      setIsSaving(true);
      await sectionsAPI.savePlaces(sectionId, selectedPlaces);
      onPlacesSaved();
    } catch (error) {
      console.error('Error saving places:', error);
      alert('Failed to save places. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity.toLowerCase()) {
      case 'very popular':
        return 'bg-red-100 text-red-800';
      case 'popular':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Place Suggestions for {sectionTitle}
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Place Suggestions for {sectionTitle}
        </h3>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadSuggestions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Place Suggestions for {sectionTitle}
        </h3>
        <div className="text-sm text-gray-600">
          {selectedPlaces.length} of {suggestions.length} selected
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No suggestions available for this location.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {suggestions.map((place, index) => {
              const selected = isPlaceSelected(place);
              return (
                <div
                  key={index}
                  onClick={() => togglePlaceSelection(place)}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 flex-1">{place.name}</h4>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePlaceSelection(place)}
                      className="ml-2 mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {place.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full ${getPopularityColor(place.popularity)}`}>
                      {place.popularity}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {place.estimated_cost}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPlaces.length > 0 && (
            <div className="border-t pt-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Selected Places:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlaces.map((place, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {place.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlaceSelection(place);
                        }}
                        className="ml-2 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={savePlaces}
                  disabled={isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : `Save ${selectedPlaces.length} Places`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
