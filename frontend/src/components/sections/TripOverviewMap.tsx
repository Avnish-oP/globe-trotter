'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Calendar, Clock, Star, Navigation, Info } from 'lucide-react';
import { getPlaceImageUrl } from '@/lib/imageApi';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

type LatLngTuple = [number, number];

let L: any;
let sectionIcons: any = {};
let placeIcon: any;

if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
  
  // Fix for default markers in React Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Create custom icons
  const createCustomIcon = (color: string, size: 'small' | 'large' = 'small') => {
    const iconSize = size === 'large' ? [35, 51] : [25, 41];
    const iconAnchor = size === 'large' ? [17, 51] : [12, 41];
    const popupAnchor = size === 'large' ? [1, -46] : [1, -34];
    const shadowSize = size === 'large' ? [51, 51] : [41, 41];

    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize,
      iconAnchor,
      popupAnchor,
      shadowSize
    });
  };

  // Section icons based on budget level
  sectionIcons = {
    low: createCustomIcon('green', 'large'),      // Budget sections
    medium: createCustomIcon('orange', 'large'),  // Medium budget
    high: createCustomIcon('red', 'large')        // High budget
  };

  placeIcon = createCustomIcon('blue', 'small');
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
}

interface Section {
  section_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
  latitude?: number;
  longitude?: number;
  places?: Place[];
}

interface TripOverviewMapProps {
  sections: Section[];
  onSectionSelect?: (section: Section) => void;
  onPlaceSelect?: (place: Place) => void;
  className?: string;
  height?: string;
}

const TripOverviewMap: React.FC<TripOverviewMapProps> = ({
  sections,
  onSectionSelect,
  onPlaceSelect,
  className = '',
  height = '500px'
}) => {
  const [isClient, setIsClient] = useState(false);
  const [sectionsWithCoords, setSectionsWithCoords] = useState<Section[]>([]);
  const [sectionImages, setSectionImages] = useState<Map<string, string>>(new Map());
  const [placeImages, setPlaceImages] = useState<Map<string, string>>(new Map());
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([51.505, -0.09]);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load images for sections and places
  useEffect(() => {
    const loadImages = async () => {
      const sectionImageMap = new Map<string, string>();
      const placeImageMap = new Map<string, string>();
      
      // Load section images
      for (const section of sections) {
        try {
          const imageUrl = await getPlaceImageUrl(section.location, 'small');
          if (imageUrl) {
            sectionImageMap.set(section.section_id, imageUrl);
          }
        } catch (error) {
          console.error(`Error loading image for section ${section.title}:`, error);
        }
      }
      
      // Load place images
      for (const section of sections) {
        if (section.places) {
          for (const place of section.places) {
            try {
              const imageUrl = await getPlaceImageUrl(place.name, 'small');
              if (imageUrl) {
                placeImageMap.set(place.name, imageUrl);
              }
            } catch (error) {
              console.error(`Error loading image for place ${place.name}:`, error);
            }
          }
        }
      }
      
      setSectionImages(sectionImageMap);
      setPlaceImages(placeImageMap);
    };

    if (sections.length > 0 && isClient) {
      loadImages();
    }
  }, [sections, isClient]);

  // Process sections and assign coordinates
  useEffect(() => {
    const locationCoords: { [key: string]: LatLngTuple } = {
      'paris': [48.8566, 2.3522],
      'london': [51.5074, -0.1278],
      'tokyo': [35.6762, 139.6503],
      'new york': [40.7128, -74.0060],
      'sydney': [-33.8688, 151.2093],
      'rome': [41.9028, 12.4964],
      'barcelona': [41.3851, 2.1734],
      'amsterdam': [52.3676, 4.9041],
      'berlin': [52.5200, 13.4050],
      'prague': [50.0755, 14.4378],
      'mumbai': [19.0760, 72.8777],
      'delhi': [28.6139, 77.2090],
      'bangalore': [12.9716, 77.5946],
      'madrid': [40.4168, -3.7038],
      'vienna': [48.2082, 16.3738],
      'istanbul': [41.0082, 28.9784]
    };

    const processedSections = sections.map((section, index) => {
      let coords: LatLngTuple;
      
      if (section.latitude && section.longitude) {
        coords = [section.latitude, section.longitude];
      } else {
        // Find coordinates based on location name
        const locationKey = section.location.toLowerCase();
        const coordsKey = Object.keys(locationCoords).find(key => locationKey.includes(key));
        
        if (coordsKey) {
          coords = locationCoords[coordsKey];
        } else {
          // Generate coordinates around the world
          const latRange = [-60, 70]; // Avoid extreme polar regions
          const lngRange = [-180, 180];
          coords = [
            latRange[0] + Math.random() * (latRange[1] - latRange[0]),
            lngRange[0] + Math.random() * (lngRange[1] - lngRange[0])
          ];
        }
      }
      
      // Process places within the section
      const processedPlaces = section.places?.map((place, placeIndex) => {
        if (place.latitude && place.longitude) {
          return place;
        }
        
        // Generate random coordinates around the section center
        const latOffset = (Math.random() - 0.5) * 0.01; // ~500m radius
        const lngOffset = (Math.random() - 0.5) * 0.01;
        
        return {
          ...place,
          latitude: coords[0] + latOffset,
          longitude: coords[1] + lngOffset
        };
      });
      
      return {
        ...section,
        latitude: coords[0],
        longitude: coords[1],
        places: processedPlaces
      };
    });

    setSectionsWithCoords(processedSections);

    // Calculate map center
    if (processedSections.length > 0) {
      const avgLat = processedSections.reduce((sum, section) => sum + (section.latitude || 0), 0) / processedSections.length;
      const avgLng = processedSections.reduce((sum, section) => sum + (section.longitude || 0), 0) / processedSections.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [sections]);

  // Get section routes
  const getSectionRoutes = () => {
    if (sectionsWithCoords.length < 2) return [];
    
    return sectionsWithCoords
      .filter(section => section.latitude && section.longitude)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .map(section => [section.latitude!, section.longitude!] as LatLngTuple);
  };

  // Get budget color
  const getBudgetColor = (budgetLevel: string) => {
    switch (budgetLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading trip map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Map Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Low Budget
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            Medium Budget
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            High Budget
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Places
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Section markers */}
          {sectionsWithCoords.map((section, index) => (
            section.latitude && section.longitude && (
              <Marker
                key={`section-${section.section_id}`}
                position={[section.latitude, section.longitude]}
                icon={sectionIcons[section.budget_level] || sectionIcons.medium}
                eventHandlers={{
                  click: () => onSectionSelect?.(section)
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-3 max-w-sm">
                    {sectionImages.get(section.section_id) && (
                      <img 
                        src={sectionImages.get(section.section_id)} 
                        alt={section.location}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4 className="font-semibold text-gray-900 mb-2">{section.title}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-3 w-3 mr-2" />
                        {section.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-2" />
                        {new Date(section.start_date).toLocaleDateString()} - {new Date(section.end_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetColor(section.budget_level)}`}>
                          {section.budget_level.charAt(0).toUpperCase() + section.budget_level.slice(1)} Budget
                        </span>
                      </div>
                      {section.description && (
                        <p className="text-gray-600 mt-2">{section.description}</p>
                      )}
                      {section.places && section.places.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-500">
                            {section.places.length} place{section.places.length !== 1 ? 's' : ''} planned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Place markers */}
          {sectionsWithCoords.map((section) =>
            section.places?.map((place, placeIndex) => (
              place.latitude && place.longitude && (
                <Marker
                  key={`place-${section.section_id}-${placeIndex}`}
                  position={[place.latitude, place.longitude]}
                  icon={placeIcon}
                  eventHandlers={{
                    click: () => onPlaceSelect?.(place)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 max-w-xs">
                      {placeImages.get(place.name) && (
                        <img 
                          src={placeImages.get(place.name)} 
                          alt={place.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h4 className="font-semibold text-gray-900 mb-1">{place.name}</h4>
                      {place.description && (
                        <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        <div>Part of: {section.title}</div>
                        {place.estimated_cost && (
                          <div className="text-green-600 font-medium mt-1">{place.estimated_cost}</div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))
          )}

          {/* Routes between sections */}
          {getSectionRoutes().length > 1 && (
            <Polyline
              positions={getSectionRoutes()}
              color="purple"
              weight={3}
              opacity={0.6}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Trip Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Navigation className="h-4 w-4 mr-2" />
          Trip Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Sections:</span>
            <span className="ml-2 font-medium">{sections.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Places:</span>
            <span className="ml-2 font-medium">
              {sections.reduce((total, section) => total + (section.places?.length || 0), 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 font-medium">
              {sections.length > 0 ? 
                `${Math.ceil(
                  (new Date(sections[sections.length - 1].end_date).getTime() - 
                   new Date(sections[0].start_date).getTime()) / (1000 * 60 * 60 * 24)
                )} days` : 
                'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripOverviewMap;
