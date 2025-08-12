'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { tripsAPI, sectionsAPI, locationAPI } from '@/lib/api';
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Save,
  ArrowLeft,
  GripVertical,
  Search,
  DollarSign,
  Users,
  Star,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  cover_image_url?: string;
  status: string;
}

interface TripSection {
  section_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
  places?: Place[];
}

interface Place {
  place_id?: string;
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  estimated_cost?: string;
  popularity?: string;
  category?: string;
  address?: string;
  image_url?: string;
}

interface NewSection {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
}

export default function ItineraryBuilder() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // New section form state
  const [newSection, setNewSection] = useState<NewSection>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    budget_level: 'medium'
  });

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);

  // Load trip and sections
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (tripId) {
      loadTripData();
    }
  }, [tripId, isAuthenticated]);

  const loadTripData = async () => {
    try {
      setIsLoading(true);
      
      // Load trip details and sections in parallel
      const [tripResponse, sectionsResponse] = await Promise.all([
        tripsAPI.getTripById(tripId),
        sectionsAPI.getTripSections(tripId)
      ]);

      setTrip(tripResponse.data);
      setSections(sectionsResponse.data || []);
      
      // Expand all sections by default
      const sectionIds = new Set<string>((sectionsResponse.data?.map((s: TripSection) => String(s.section_id))) || []);
      setExpandedSections(sectionIds);
      
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocations(true);
    try {
      const response = await locationAPI.searchLocations(query);
      setLocationSuggestions(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocations(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSection.title || !newSection.location || !newSection.start_date || !newSection.end_date) {
      return;
    }

    try {
      const response = await sectionsAPI.createSection(tripId, newSection);
      const createdSection = response.data;
      
      setSections(prev => [...prev, createdSection]);
      setExpandedSections(prev => new Set([...prev, createdSection.section_id]));
      
      // Reset form
      setNewSection({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        budget_level: 'medium'
      });
      setIsAddingSection(false);
      setLocationSuggestions([]);
      
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleUpdateSection = async (sectionId: string, updates: Partial<TripSection>) => {
    try {
      await sectionsAPI.updateSection(sectionId, updates);
      setSections(prev => prev.map(section => 
        section.section_id === sectionId 
          ? { ...section, ...updates }
          : section
      ));
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await sectionsAPI.deleteSection(sectionId);
      setSections(prev => prev.filter(section => section.section_id !== sectionId));
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getBudgetLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
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
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-purple-600 hover:text-purple-700 font-medium mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
              <p className="text-gray-600 mt-1">{trip.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {getDaysDifference(trip.start_date, trip.end_date)} days
            </div>
            {trip.total_budget && (
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: trip.currency || 'USD'
                }).format(trip.total_budget)}
              </div>
            )}
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={section.section_id}
              className="bg-white rounded-2xl border border-purple-200/50 shadow-md overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {section.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(section.start_date)} - {formatDate(section.end_date)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetLevelColor(section.budget_level)}`}>
                          {section.budget_level} budget
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingSection(section.section_id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.section_id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleSectionExpanded(section.section_id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {expandedSections.has(section.section_id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {section.description && (
                  <p className="text-gray-600 mt-3 text-sm">{section.description}</p>
                )}
              </div>

              {/* Section Content - Expanded */}
              {expandedSections.has(section.section_id) && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Places & Activities</h4>
                    <button
                      onClick={() => router.push(`/trips/${tripId}/sections/${section.section_id}/places`)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Places
                    </button>
                  </div>

                  {/* Places List */}
                  {section.places && section.places.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.places.map((place, placeIndex) => (
                        <div
                          key={place.place_id || placeIndex}
                          className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{place.name}</h5>
                              {place.description && (
                                <p className="text-gray-600 text-sm mt-1">{place.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {place.estimated_cost && (
                                  <span className="flex items-center">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {place.estimated_cost}
                                  </span>
                                )}
                                {place.popularity && (
                                  <span className="flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    {place.popularity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No places added yet</p>
                      <p className="text-sm">Click "Add Places" to start building your itinerary</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add New Section */}
          {isAddingSection ? (
            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Section</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Exploring Paris"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newSection.location}
                    onChange={(e) => {
                      setNewSection(prev => ({ ...prev, location: e.target.value }));
                      searchLocations(e.target.value);
                    }}
                    placeholder="e.g., Paris, France"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  {/* Location Suggestions */}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setNewSection(prev => ({ ...prev, location: location.display_name }));
                            setLocationSuggestions([]);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors"
                        >
                          <div className="font-medium">{location.name}</div>
                          {location.country && (
                            <div className="text-sm text-gray-600">{location.country}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newSection.start_date}
                    onChange={(e) => setNewSection(prev => ({ ...prev, start_date: e.target.value }))}
                    min={trip.start_date}
                    max={trip.end_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newSection.end_date}
                    onChange={(e) => setNewSection(prev => ({ ...prev, end_date: e.target.value }))}
                    min={newSection.start_date || trip.start_date}
                    max={trip.end_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Level
                  </label>
                  <select
                    value={newSection.budget_level}
                    onChange={(e) => setNewSection(prev => ({ ...prev, budget_level: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low Budget</option>
                    <option value="medium">Medium Budget</option>
                    <option value="high">High Budget</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newSection.description}
                  onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what you plan to do in this section..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddSection}
                  disabled={!newSection.title || !newSection.location || !newSection.start_date || !newSection.end_date}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Section
                </button>
                <button
                  onClick={() => {
                    setIsAddingSection(false);
                    setNewSection({
                      title: '',
                      description: '',
                      start_date: '',
                      end_date: '',
                      location: '',
                      budget_level: 'medium'
                    });
                    setLocationSuggestions([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSection(true)}
              className="w-full p-6 border-2 border-dashed border-purple-300 rounded-2xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center"
            >
              <Plus className="w-6 h-6 mr-2" />
              Add New Section
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push(`/trips/${tripId}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Preview Trip
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/trips/${tripId}/budget`)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Budget Overview
            </button>
            <button
              onClick={() => router.push(`/trips/${tripId}/calendar`)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
