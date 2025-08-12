'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Eye, Plus, X, Navigation, LayoutGrid, Map as MapIcon } from 'lucide-react';
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
let defaultIcon: any;
let selectedIcon: any;
let popularIcon: any;
let veryPopularIcon: any;

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
  const createCustomIcon = (color: string) => {
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  defaultIcon = createCustomIcon('blue');
  selectedIcon = createCustomIcon('green');
  popularIcon = createCustomIcon('orange');
  veryPopularIcon = createCustomIcon('red');
}

interface Place {
  name: string;
  lat?: number;
  lng?: number;
  description: string;
  estimated_cost: string;
  popularity: string;
  category?: string;
  address?: string;
  image_url?: string;
  is_selected?: boolean;
}

interface PlaceSelectionMapProps {
  location: string;
  places: Place[];
  selectedPlaces: Place[];
  onPlaceSelect: (place: Place) => void;
  onPlaceDeselect: (place: Place) => void;
  className?: string;
  height?: string;
}

const PlaceSelectionMap: React.FC<PlaceSelectionMapProps> = ({
  location,
  places,
  selectedPlaces,
  onPlaceSelect,
  onPlaceDeselect,
  className = '',
  height = '400px'
}) => {
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [placeImages, setPlaceImages] = useState<Map<string, string>>(new Map());
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([51.505, -0.09]);
  const [placesWithCoords, setPlacesWithCoords] = useState<Place[]>([]);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load place images
  useEffect(() => {
    const loadPlaceImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const place of places) {
        try {
          const imageUrl = await getPlaceImageUrl(place.name, 'small');
          if (imageUrl) {
            imageMap.set(place.name, imageUrl);
          }
        } catch (error) {
          console.error(`Error loading image for ${place.name}:`, error);
        }
      }
      
      setPlaceImages(imageMap);
    };

    if (places.length > 0 && isClient) {
      loadPlaceImages();
    }
  }, [places, isClient]);

  // Process places and assign coordinates
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
    
    const locationKey = location.toLowerCase();
    let centerCoords: LatLngTuple = [51.505, -0.09];
    
    // Find matching coordinates
    const coordsKey = Object.keys(locationCoords).find(key => locationKey.includes(key));
    if (coordsKey) {
      centerCoords = locationCoords[coordsKey];
    }
    
    setMapCenter(centerCoords);

    // Process places and assign coordinates if missing
    const processedPlaces = places.map((place, index) => {
      if (place.lat && place.lng) {
        return place;
      }
      
      // Generate random coordinates around the center
      const latOffset = (Math.random() - 0.5) * 0.02; // ~1km radius
      const lngOffset = (Math.random() - 0.5) * 0.02;
      
      return {
        ...place,
        lat: centerCoords[0] + latOffset,
        lng: centerCoords[1] + lngOffset
      };
    });
    
    setPlacesWithCoords(processedPlaces);
  }, [location, places]);

  // Get icon for place
  const getPlaceIcon = (place: Place) => {
    if (typeof window === 'undefined' || !L) return null;
    
    const isSelected = selectedPlaces.some(p => p.name === place.name);
    
    if (isSelected) return selectedIcon;
    if (place.popularity === 'very popular') return veryPopularIcon;
    if (place.popularity === 'popular') return popularIcon;
    return defaultIcon;
  };

  // Calculate routes between selected places
  const getSelectedPlacesRoute = () => {
    if (selectedPlaces.length < 2) return [];
    
    return selectedPlaces
      .filter(place => place.lat && place.lng)
      .map(place => [place.lat!, place.lng!] as LatLngTuple);
  };

  // Handle place selection/deselection
  const togglePlaceSelection = (place: Place) => {
    const isSelected = selectedPlaces.some(p => p.name === place.name);
    if (isSelected) {
      onPlaceDeselect(place);
    } else {
      onPlaceSelect(place);
    }
  };

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Places to Visit {location && `in ${location}`}
        </h3>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapIcon className="h-4 w-4 mr-1" />
            Map
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Place markers */}
            {placesWithCoords.map((place, index) => (
              place.lat && place.lng && (
                <Marker
                  key={`${place.name}-${index}`}
                  position={[place.lat, place.lng]}
                  icon={getPlaceIcon(place)}
                  eventHandlers={{
                    click: () => togglePlaceSelection(place)
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
                      <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-600 font-medium">{place.estimated_cost}</span>
                        <button
                          onClick={() => togglePlaceSelection(place)}
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            selectedPlaces.some(p => p.name === place.name)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                          }`}
                        >
                          {selectedPlaces.some(p => p.name === place.name) ? 'Remove' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Route between selected places */}
            {getSelectedPlacesRoute().length > 1 && (
              <Polyline
                positions={getSelectedPlacesRoute()}
                color="purple"
                weight={3}
                opacity={0.7}
                dashArray="5, 10"
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ maxHeight: height, overflowY: 'auto' }}>
          {placesWithCoords.map((place, index) => {
            const isSelected = selectedPlaces.some(p => p.name === place.name);
            
            return (
              <div
                key={`${place.name}-${index}`}
                className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => togglePlaceSelection(place)}
              >
                {placeImages.get(place.name) && (
                  <img 
                    src={placeImages.get(place.name)} 
                    alt={place.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex-1">{place.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    place.popularity === 'very popular' ? 'bg-red-100 text-red-600' :
                    place.popularity === 'popular' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {place.popularity}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{place.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">{place.estimated_cost}</span>
                  <button
                    className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Select
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selection Summary */}
      {selectedPlaces.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-green-900">
              Selected Places ({selectedPlaces.length})
            </h4>
            {selectedPlaces.length > 1 && viewMode === 'map' && (
              <span className="text-sm text-green-600">
                <Navigation className="h-4 w-4 inline mr-1" />
                Route shown on map
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPlaces.map((place, index) => (
              <span
                key={`selected-${place.name}-${index}`}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-sm rounded-md"
              >
                {place.name}
                <button
                  onClick={() => onPlaceDeselect(place)}
                  className="ml-1 text-green-500 hover:text-green-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSelectionMap;
