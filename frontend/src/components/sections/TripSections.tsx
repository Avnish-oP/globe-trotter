'use client';

import React, { useState, useEffect } from 'react';
import { sectionsAPI } from '@/lib/api';
import AddSectionForm from './AddSectionForm';
import PlaceSuggestions from './PlaceSuggestions';

interface Section {
  section_id: string;
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: string;
  section_order: number;
  places: Array<{
    place_id: string;
    name: string;
    latitude: number;
    longitude: number;
    description: string;
    estimated_cost: string;
    popularity: string;
    is_selected: boolean;
    place_order: number;
  }>;
}

interface TripSectionsProps {
  tripId: string;
  tripTitle: string;
}

export default function TripSections({ tripId, tripTitle }: TripSectionsProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, [tripId]);

  const loadSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await sectionsAPI.getTripSections(tripId);
      
      if (response.success) {
        setSections(response.data || []);
      } else {
        setError('Failed to load sections');
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      setError('Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionAdded = () => {
    setShowAddForm(false);
    loadSections();
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await sectionsAPI.deleteSection(sectionId);
      loadSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBudgetColor = (budget: string) => {
    switch (budget.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading sections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadSections}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tripTitle} - Sections</h1>
          <p className="text-gray-600 mt-1">
            Organize your trip into sections and discover amazing places to visit
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Section
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddSectionForm
            tripId={tripId}
            onSectionAdded={handleSectionAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {sections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No sections added yet</div>
          <p className="text-gray-400 mb-6">
            Start by adding your first section to organize your trip
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Section
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.section_id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-gray-600 mb-3">{section.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">📍 Location:</span>
                      <span className="ml-1">{section.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">📅 Dates:</span>
                      <span className="ml-1">
                        {formatDate(section.start_date)} - {formatDate(section.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getBudgetColor(section.budget_level)}`}>
                        {section.budget_level} budget
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSuggestions(
                      showSuggestions === section.section_id ? null : section.section_id
                    )}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {showSuggestions === section.section_id ? 'Hide Places' : 'Get Places'}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.section_id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {section.places && section.places.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Places:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.places
                      .filter(place => place.is_selected)
                      .map((place) => (
                        <div key={place.place_id} className="bg-gray-50 rounded-lg p-3">
                          <h5 className="font-medium text-gray-900">{place.name}</h5>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {place.description}
                          </p>
                          <div className="flex justify-between items-center mt-2 text-xs">
                            <span className="text-gray-700">{place.estimated_cost}</span>
                            <span className="text-blue-600">{place.popularity}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && (
        <div className="mt-6">
          <PlaceSuggestions
            sectionId={showSuggestions}
            sectionTitle={sections.find(s => s.section_id === showSuggestions)?.title || ''}
            onPlacesSaved={() => {
              setShowSuggestions(null);
              loadSections();
            }}
          />
        </div>
      )}
    </div>
  );
}
