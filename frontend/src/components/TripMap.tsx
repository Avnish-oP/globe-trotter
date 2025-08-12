'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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

// Types for Leaflet
type LatLngTuple = [number, number];

let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
}

// Fix for default markers in React Leaflet
const createCustomIcon = (color: string) => {
  if (typeof window === 'undefined' || !L) return null;
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

let upcomingTripIcon: any;
let completedTripIcon: any;
let currentTripIcon: any;

if (typeof window !== 'undefined') {
  upcomingTripIcon = createCustomIcon('green');
  completedTripIcon = createCustomIcon('blue');
  currentTripIcon = createCustomIcon('red');
}

interface TripLocation {
  id: string;
  name: string;
  coordinates: LatLngTuple;
  country: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'completed' | 'current';
  description?: string;
}

interface TripMapProps {
  trips?: TripLocation[];
  className?: string;
  height?: string;
}

// Sample trip data for demonstration
const sampleTrips: TripLocation[] = [
  {
    id: '1',
    name: 'Paris, France',
    coordinates: [48.8566, 2.3522],
    country: 'France',
    startDate: '2025-09-15',
    endDate: '2025-09-22',
    status: 'upcoming',
    description: 'Romantic getaway in the City of Light'
  },
  {
    id: '2',
    name: 'Tokyo, Japan',
    coordinates: [35.6762, 139.6503],
    country: 'Japan',
    startDate: '2025-07-10',
    endDate: '2025-07-20',
    status: 'completed',
    description: 'Cultural exploration and amazing food'
  },
  {
    id: '3',
    name: 'New York, USA',
    coordinates: [40.7128, -74.0060],
    country: 'USA',
    startDate: '2025-08-05',
    endDate: '2025-08-15',
    status: 'current',
    description: 'Business trip with some sightseeing'
  },
  {
    id: '4',
    name: 'London, UK',
    coordinates: [51.5074, -0.1278],
    country: 'UK',
    startDate: '2025-06-01',
    endDate: '2025-06-07',
    status: 'completed',
    description: 'Historical sites and museums'
  },
  {
    id: '5',
    name: 'Sydney, Australia',
    coordinates: [-33.8688, 151.2093],
    country: 'Australia',
    startDate: '2025-10-12',
    endDate: '2025-10-25',
    status: 'upcoming',
    description: 'Beach and city exploration'
  }
];

const TripMap: React.FC<TripMapProps> = ({ 
  trips = [], 
  className = '',
  height = '400px'
}) => {
  const [isClient, setIsClient] = useState(false);
  const [placeImages, setPlaceImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    setIsClient(true);
    
    // Preload images for all trip locations
    const loadPlaceImages = async () => {
      const imageMap = new Map<string, string>();
      
      for (const trip of trips) {
        try {
          const imageUrl = await getPlaceImageUrl(trip.name, 'small');
          if (imageUrl) {
            imageMap.set(trip.name, imageUrl);
          }
        } catch (error) {
          console.error(`Error loading image for ${trip.name}:`, error);
        }
      }
      
      setPlaceImages(imageMap);
    };

    if (trips.length > 0) {
      loadPlaceImages();
    }
  }, [trips]);

  if (!isClient) {
    return (
      <div 
        className={`bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-300 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-purple-600 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  // Calculate center point based on trips
  const centerLat = trips.length > 0 
    ? trips.reduce((sum, trip) => sum + trip.coordinates[0], 0) / trips.length
    : 20;
  const centerLng = trips.length > 0 
    ? trips.reduce((sum, trip) => sum + trip.coordinates[1], 0) / trips.length
    : 0;

  const center: LatLngTuple = [centerLat, centerLng];

  // Create polyline connecting completed trips chronologically
  const completedTrips = trips
    .filter(trip => trip.status === 'completed')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const tripPath: LatLngTuple[] = completedTrips.map(trip => trip.coordinates);

  const getIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return upcomingTripIcon;
      case 'current':
        return currentTripIcon;
      case 'completed':
      default:
        return completedTripIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-green-600 bg-green-100';
      case 'current':
        return 'text-red-600 bg-red-100';
      case 'completed':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Single high-quality English map tile configuration
  const tileLayer = {
    url: "https://mts1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; Google Maps'
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-purple-200/50 shadow-lg ${className}`}>
      <MapContainer
        center={center}
        zoom={2}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          maxZoom={18}
        />
        
        {/* Draw path for completed trips */}
        {tripPath.length > 1 && (
          <Polyline
            positions={tripPath}
            color="#8b5cf6"
            weight={3}
            opacity={0.7}
            dashArray="10, 5"
          />
        )}

        {/* Trip markers */}
        {trips.map((trip) => (
          <Marker
            key={trip.id}
            position={trip.coordinates}
            icon={getIcon(trip.status)}
          >
            <Popup className="trip-popup">
              <div className="p-2 min-w-[200px] max-w-[250px]">
                {/* Place Image */}
                {placeImages.has(trip.name) && (
                  <div className="mb-3 -m-2 -mt-2">
                    <img
                      src={placeImages.get(trip.name)}
                      alt={trip.name}
                      className="w-full h-24 object-cover rounded-t"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{trip.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">Country:</span> {trip.country}</p>
                  <p><span className="font-medium">Dates:</span> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                  {trip.description && (
                    <p className="text-gray-700 mt-2 text-xs italic">{trip.description}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="bg-white/95 backdrop-blur-sm p-3 border-t border-purple-200/50">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Upcoming</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-0.5 bg-purple-500 opacity-70" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-600">Travel Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMap;
