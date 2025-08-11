'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Plane, 
  Info,
  ChevronRight 
} from 'lucide-react';

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

interface TripTimelineProps {
  stops: Stop[];
  tripStartDate: string;
  tripEndDate: string;
  className?: string;
}

interface TimelinePoint {
  id: string;
  type: 'start' | 'stop' | 'end';
  date: string;
  city?: string;
  country?: string;
  stop?: Stop;
  position: number; // Percentage position on timeline
}

const TripTimeline: React.FC<TripTimelineProps> = ({ 
  stops, 
  tripStartDate, 
  tripEndDate,
  className = '' 
}) => {
  const [selectedPoint, setSelectedPoint] = useState<TimelinePoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);

  // Calculate timeline points
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
      position: 0
    });

    // Add stop points (both arrival and departure if different dates)
    const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
    
    sortedStops.forEach((stop) => {
      const arrivalDate = new Date(stop.arrival_date);
      const departureDate = new Date(stop.departure_date);
      
      // Arrival point
      const arrivalPosition = ((arrivalDate.getTime() - startDate.getTime()) / totalDuration) * 100;
      points.push({
        id: `${stop.stop_id}-arrival`,
        type: 'stop',
        date: stop.arrival_date,
        city: stop.city_name,
        country: stop.country_name,
        stop,
        position: Math.max(0, Math.min(100, arrivalPosition))
      });

      // Departure point (only if different from arrival date)
      if (arrivalDate.toDateString() !== departureDate.toDateString()) {
        const departurePosition = ((departureDate.getTime() - startDate.getTime()) / totalDuration) * 100;
        points.push({
          id: `${stop.stop_id}-departure`,
          type: 'stop',
          date: stop.departure_date,
          city: stop.city_name,
          country: stop.country_name,
          stop,
          position: Math.max(0, Math.min(100, departurePosition))
        });
      }
    });

    // Add end point
    points.push({
      id: 'end',
      type: 'end',
      date: tripEndDate,
      position: 100
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

  const getDaysStay = (stop: Stop) => {
    const arrival = new Date(stop.arrival_date);
    const departure = new Date(stop.departure_date);
    const diffTime = departure.getTime() - arrival.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const getPointIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Plane className="w-4 h-4 text-green-600" />;
      case 'end':
        return <Plane className="w-4 h-4 text-red-600 transform rotate-180" />;
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
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  const timelinePoints = calculateTimelinePoints();

  const DetailPopup = ({ point }: { point: TimelinePoint }) => (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-64 z-10">
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
                <span>{getDaysStay(point.stop)} day{getDaysStay(point.stop) !== 1 ? 's' : ''} stay</span>
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

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Trip Timeline
        </h2>
        <div className="text-sm text-gray-500">
          {timelinePoints.filter(p => p.type === 'stop').length} stops
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
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-blue-200 to-red-200 rounded-full transform -translate-y-1/2"></div>
          
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

              {/* City Label */}
              {point.city && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow border">
                    {point.city}
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

        {/* Trip Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.ceil((new Date(tripEndDate).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Total Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stops.length}
              </div>
              <div className="text-sm text-gray-600">Destinations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(stops.map(stop => stop.country_name)).size}
              </div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </div>

        {/* Interactive Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Hover over or click on timeline points to see details about each stop
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;
