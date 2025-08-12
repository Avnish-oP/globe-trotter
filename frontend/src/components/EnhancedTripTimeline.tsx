'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Plane, 
  Info,
  ChevronRight,
  Star,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import { fetchPlaceImages, getPlaceImageUrl, ImageData } from '@/lib/imageApi';

interface Stop {
  stop_id: string;
  city_id: string;
  city_name: string;
  country_name: string;
  arrival_date: string;
  departure_date: string;
  stop_order: number;
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
  estimated_cost?: string;
  popularity?: string;
  category?: string;
  address?: string;
  image_url?: string;
  is_selected?: boolean;
}

interface EnhancedTripTimelineProps {
  stops: Stop[];
  sections: TripSection[];
  tripStartDate: string;
  tripEndDate: string;
  className?: string;
}

interface TimelinePoint {
  id: string;
  type: 'start' | 'stop' | 'section' | 'end';
  date: string;
  city?: string;
  country?: string;
  stop?: Stop;
  section?: TripSection;
  position: number; // Percentage position on timeline
  title?: string;
}

const EnhancedTripTimeline: React.FC<EnhancedTripTimelineProps> = ({ 
  stops, 
  sections,
  tripStartDate, 
  tripEndDate,
  className = '' 
}) => {
  const [selectedPoint, setSelectedPoint] = useState<TimelinePoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sectionImages, setSectionImages] = useState<Map<string, ImageData[]>>(new Map());
  const [placeImages, setPlaceImages] = useState<Map<string, ImageData[]>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Load images for sections and places
  useEffect(() => {
    const loadImages = async () => {
      const imagesToLoad = new Set<string>();
      
      // Collect section locations
      sections.forEach(section => {
        if (section.location) {
          imagesToLoad.add(section.location);
        }
        
        // Collect place names
        if (section.places) {
          section.places.forEach(place => {
            if (place.name && place.is_selected !== false) {
              imagesToLoad.add(place.name);
            }
          });
        }
      });

      // Load images for all unique locations and places
      const loadPromises = Array.from(imagesToLoad).map(async (name) => {
        if (sectionImages.has(name) || placeImages.has(name)) return;
        
        setLoadingImages(prev => new Set([...prev, name]));
        
        try {
          const images = await fetchPlaceImages(name, 3);
          
          // Determine if this is a section location or place
          const isSection = sections.some(s => s.location === name);
          
          if (isSection) {
            setSectionImages(prev => new Map([...prev, [name, images]]));
          } else {
            setPlaceImages(prev => new Map([...prev, [name, images]]));
          }
        } catch (error) {
          console.error(`Failed to load images for ${name}:`, error);
        } finally {
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(name);
            return newSet;
          });
        }
      });

      await Promise.allSettled(loadPromises);
    };

    if (sections.length > 0) {
      loadImages();
    }
  }, [sections]);

  // Calculate timeline points including sections
  const calculateTimelinePoints = (): TimelinePoint[] => {
    const startDate = new Date(tripStartDate);
    const endDate = new Date(tripEndDate);
    const totalDuration = endDate.getTime() - startDate.getTime();
    
    const points: TimelinePoint[] = [];

    // Add start point
    points.push({
      id: 'start',
      type: 'start',
      date: tripStartDate,
      position: 0,
      title: 'Trip Start'
    });

    // Add section points (these are more detailed than basic stops)
    if (sections && sections.length > 0) {
      sections.forEach((section) => {
        const sectionStartDate = new Date(section.start_date);
        const position = ((sectionStartDate.getTime() - startDate.getTime()) / totalDuration) * 100;
        
        points.push({
          id: `section-${section.section_id}`,
          type: 'section',
          date: section.start_date,
          city: section.location,
          section,
          position: Math.max(0, Math.min(100, position)),
          title: section.title
        });
      });
    } else {
      // Fallback to basic stops if no sections are available
      const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
      
      sortedStops.forEach((stop) => {
        const arrivalDate = new Date(stop.arrival_date);
        const arrivalPosition = ((arrivalDate.getTime() - startDate.getTime()) / totalDuration) * 100;
        
        points.push({
          id: `stop-${stop.stop_id}`,
          type: 'stop',
          date: stop.arrival_date,
          city: stop.city_name,
          country: stop.country_name,
          stop,
          position: Math.max(0, Math.min(100, arrivalPosition)),
          title: `${stop.city_name}, ${stop.country_name}`
        });
      });
    }

    // Add end point
    points.push({
      id: 'end',
      type: 'end',
      date: tripEndDate,
      position: 100,
      title: 'Trip End'
    });

    return points.sort((a, b) => a.position - b.position);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDetailedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysStay = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const getPointIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Plane className="w-4 h-4 text-green-600" />;
      case 'end':
        return <Plane className="w-4 h-4 text-red-600 transform rotate-180" />;
      case 'section':
        return <Star className="w-4 h-4 text-purple-600" />;
      default:
        return <MapPin className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPointColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-green-500 border-green-600';
      case 'end':
        return 'bg-red-500 border-red-600';
      case 'section':
        return 'bg-purple-500 border-purple-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const getBudgetLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const timelinePoints = calculateTimelinePoints();

  const DetailPopup = ({ point }: { point: TimelinePoint }) => {
    const sectionImage = point.section ? getImageForLocation(point.section.location) : null;
    
    return (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-80 max-w-96 z-10">
        <div className="text-center">
          {point.type === 'start' && (
            <>
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                <Plane className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Trip Start</h4>
              <p className="text-sm text-gray-600">{formatDetailedDate(point.date)}</p>
            </>
          )}
          
          {point.type === 'end' && (
            <>
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-2">
                <Plane className="w-5 h-5 text-red-600 transform rotate-180" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Trip End</h4>
              <p className="text-sm text-gray-600">{formatDetailedDate(point.date)}</p>
            </>
          )}
          
          {point.type === 'section' && point.section && (
            <>
              {/* Section Image */}
              {sectionImage && (
                <div className="mb-3 -mx-4 -mt-4">
                  <img
                    src={sectionImage.urls.small}
                    alt={point.section.location}
                    className="w-full h-32 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    Photo by {sectionImage.photographer.name}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{point.section.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{point.section.location}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDetailedDate(point.section.start_date)} - {formatDetailedDate(point.section.end_date)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{getDaysStay(point.section.start_date, point.section.end_date)} day{getDaysStay(point.section.start_date, point.section.end_date) !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center justify-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className={`px-2 py-1 rounded text-xs border ${getBudgetLevelColor(point.section.budget_level)}`}>
                    {point.section.budget_level} budget
                  </span>
                </div>
                
                {point.section.places && point.section.places.length > 0 && (
                  <div className="flex items-center justify-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{point.section.places.filter(p => p.is_selected !== false).length} places planned</span>
                  </div>
                )}
              </div>
              
              {point.section.description && (
                <p className="text-xs text-gray-500 mt-2 italic">{point.section.description}</p>
              )}
            </>
          )}
          
          {point.type === 'stop' && point.stop && (
            <>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {point.city}, {point.country}
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDetailedDate(point.date)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{getDaysStay(point.stop.arrival_date, point.stop.departure_date)} day{getDaysStay(point.stop.arrival_date, point.stop.departure_date) !== 1 ? 's' : ''} stay</span>
                </div>
                <div className="flex items-center justify-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Stop #{point.stop.stop_order}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200"></div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px] border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
      </div>
    );
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

  const getImageForLocation = (location: string): ImageData | null => {
    const images = sectionImages.get(location);
    return images && images.length > 0 ? images[0] : null;
  };

  const getImageForPlace = (placeName: string): ImageData | null => {
    const images = placeImages.get(placeName);
    return images && images.length > 0 ? images[0] : null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Trip Timeline
        </h2>
        <div className="text-sm text-gray-500">
          {sections && sections.length > 0 ? (
            <span>{sections.length} section{sections.length !== 1 ? 's' : ''} planned</span>
          ) : (
            <span>{stops.length} destination{stops.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>{formatDate(tripStartDate)}</span>
          <span>{formatDate(tripEndDate)}</span>
        </div>

        {/* Main Timeline */}
        <div className="relative h-20 mb-8">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-purple-200 to-red-200 rounded-full transform -translate-y-1/2"></div>
          
          {/* Timeline Points */}
          {timelinePoints.map((point) => (
            <div
              key={point.id}
              className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
              style={{ left: `${point.position}%` }}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
            >
              {/* Point Circle */}
              <div className={`
                w-8 h-8 rounded-full border-2 shadow-lg transform -translate-x-1/2 
                transition-all duration-200 hover:scale-110 
                ${getPointColor(point.type)}
                ${selectedPoint?.id === point.id ? 'scale-125 ring-4 ring-blue-200' : ''}
              `}>
                <div className="w-full h-full flex items-center justify-center">
                  {getPointIcon(point.type)}
                </div>
              </div>

              {/* Point Label */}
              {point.city && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow border">
                    {point.type === 'section' ? point.section?.title : point.city}
                  </div>
                </div>
              )}

              {/* Detail Popup on Hover or Click */}
              {(hoveredPoint?.id === point.id || selectedPoint?.id === point.id) && (
                <DetailPopup point={point} />
              )}
            </div>
          ))}
        </div>

        {/* Detailed Sections View */}
        {sections && sections.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Itinerary</h3>
            {sections
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .map((section) => {
                const sectionImage = getImageForLocation(section.location);
                return (
                  <div key={section.section_id} className="border border-purple-200 rounded-lg overflow-hidden bg-gradient-to-r from-white to-purple-50/30">
                    {/* Section Header with Image */}
                    <div className="relative">
                      {sectionImage && (
                        <div className="h-40 w-full relative">
                          <img
                            src={sectionImage.urls.regular}
                            alt={section.location}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          <div className="absolute bottom-2 left-4 text-white">
                            <h4 className="font-semibold text-lg">{section.title}</h4>
                            <p className="text-sm opacity-90">{section.location}</p>
                          </div>
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Photo by {sectionImage.photographer.name}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4">
                        {!sectionImage && (
                          <div className="flex items-center space-x-3 mb-2">
                            <Star className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">{section.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs border ${getBudgetLevelColor(section.budget_level)}`}>
                              {section.budget_level} budget
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {sectionImage && (
                              <span className={`inline-block px-2 py-1 rounded text-xs border ${getBudgetLevelColor(section.budget_level)} mb-2`}>
                                {section.budget_level} budget
                              </span>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {!sectionImage && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {section.location}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(section.start_date)} - {formatDate(section.end_date)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {getDaysStay(section.start_date, section.end_date)} days
                              </div>
                              {section.places && section.places.length > 0 && (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 mr-1" />
                                  {section.places.filter(p => p.is_selected !== false).length} places
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {section.places && section.places.length > 0 && (
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
                          )}
                        </div>
                        
                        {section.description && (
                          <p className="text-gray-600 mt-2 text-sm">{section.description}</p>
                        )}
                        
                        {/* Places List */}
                        {expandedSections.has(section.section_id) && section.places && section.places.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h5 className="font-medium text-gray-900 mb-3">Places & Activities:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {section.places
                                .filter(place => place.is_selected !== false)
                                .map((place, index) => {
                                  const placeImage = getImageForPlace(place.name);
                                  return (
                                    <div key={place.place_id || index} className="bg-white/80 rounded-lg border border-gray-200 overflow-hidden">
                                      {placeImage && (
                                        <div className="relative">
                                          <img
                                            src={placeImage.urls.small}
                                            alt={place.name}
                                            className="w-full h-24 object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                          <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                            📸
                                          </div>
                                        </div>
                                      )}
                                      <div className="p-3">
                                        <h6 className="font-medium text-gray-900">{place.name}</h6>
                                        {place.description && (
                                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{place.description}</p>
                                        )}
                                        <div className="flex justify-between items-center mt-2 text-xs">
                                          {place.estimated_cost && (
                                            <span className="text-gray-700">{place.estimated_cost}</span>
                                          )}
                                          {place.popularity && (
                                            <span className="text-blue-600">{place.popularity}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Trip Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.ceil((new Date(tripEndDate).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Total Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sections && sections.length > 0 ? sections.length : stops.length}
              </div>
              <div className="text-sm text-gray-600">
                {sections && sections.length > 0 ? 'Sections' : 'Destinations'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sections && sections.length > 0 
                  ? sections.reduce((total, section) => total + (section.places?.filter(p => p.is_selected !== false).length || 0), 0)
                  : stops.length
                }
              </div>
              <div className="text-sm text-gray-600">
                {sections && sections.length > 0 ? 'Places' : 'Cities'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {sections && sections.length > 0 
                  ? new Set(sections.map(section => section.location.split(',')[section.location.split(',').length - 1]?.trim())).size
                  : new Set(stops.map(stop => stop.country_name)).size
                }
              </div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </div>

        {/* Interactive Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Hover over or click on timeline points to see details • Click the chevron to expand section details
        </div>
      </div>
    </div>
  );
};

export default EnhancedTripTimeline;
