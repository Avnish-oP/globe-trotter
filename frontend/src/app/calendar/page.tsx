'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TripCalendar from '@/components/TripCalendar';
import MiniCalendar from '@/components/MiniCalendar';
import TripStats from '@/components/TripStats';
import CalendarExport from '@/components/CalendarExport';
import { tripsAPI } from '@/lib/api';
import { Calendar, Filter, Search, MapPin, Eye, Edit, Download } from 'lucide-react';

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  status: string;
  stops: Array<{
    stop_id: string;
    city_name: string;
    country_name: string;
    arrival_date: string;
    departure_date: string;
    stop_order: number;
  }>;
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  budget?: number;
  currency: string;
  description?: string;
  destinations: string[];
  type: 'trip' | 'stop';
  tripId: string;
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'booked' | 'ongoing' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  useEffect(() => {
    if (trips.length > 0) {
      generateCalendarEvents();
    }
  }, [trips, filterStatus, searchQuery]);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tripsAPI.getUserTrips();
      
      if (response.success) {
        setTrips(response.data || []);
      } else {
        setError('Failed to load trips');
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setError('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarEvents = () => {
    const calendarEvents: CalendarEvent[] = [];
    
    const filteredTrips = trips.filter(trip => {
      const matchesStatus = filterStatus === 'all' || trip.status.toLowerCase() === filterStatus;
      const matchesSearch = !searchQuery || 
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.stops?.some(stop => 
          stop.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stop.country_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      return matchesStatus && matchesSearch;
    });

    filteredTrips.forEach(trip => {
      // Add main trip event
      calendarEvents.push({
        id: `trip-${trip.trip_id}`,
        title: trip.title,
        startDate: new Date(trip.start_date),
        endDate: new Date(trip.end_date),
        status: trip.status,
        budget: trip.total_budget,
        currency: trip.currency,
        description: trip.description,
        destinations: trip.stops?.map(stop => `${stop.city_name}, ${stop.country_name}`) || [],
        type: 'trip',
        tripId: trip.trip_id
      });

      // Add individual stop events
      trip.stops?.forEach(stop => {
        calendarEvents.push({
          id: `stop-${stop.stop_id}`,
          title: `${stop.city_name}, ${stop.country_name}`,
          startDate: new Date(stop.arrival_date),
          endDate: new Date(stop.departure_date),
          status: trip.status,
          currency: trip.currency,
          description: `Stop ${stop.stop_order} of ${trip.title}`,
          destinations: [`${stop.city_name}, ${stop.country_name}`],
          type: 'stop',
          tripId: trip.trip_id
        });
      });
    });

    setEvents(calendarEvents);
  };

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/trips/${event.tripId}`);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Check if the date falls within the event range
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getUpcomingTrips = () => {
    const now = new Date();
    return events
      .filter(event => event.type === 'trip' && new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation currentPage="trips" />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            <span className="ml-2 text-gray-800">Loading calendar...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation currentPage="trips" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-700 font-medium mb-4">{error}</div>
            <button
              onClick={loadTrips}
              className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const upcomingTrips = getUpcomingTrips();

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="trips" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Travel Calendar
              </h1>
              <p className="text-purple-700 mt-2">View and manage your trip schedules</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-800">View:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'month' | 'year')}
                  className="px-3 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              
              <button
                onClick={() => router.push('/trips/new')}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-200 shadow-md"
              >
                Plan New Trip
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 h-4 w-4" />
              <input
                type="text"
                placeholder="Search trips, destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-800" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="booked">Booked</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <TripCalendar
                events={events}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                viewMode={viewMode}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini Calendar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <MiniCalendar
                currentDate={selectedDate || new Date()}
                onDateChange={(date) => {
                  setSelectedDate(date);
                  // Also navigate main calendar to this month if needed
                  const mainCalendarDate = new Date();
                  if (date.getMonth() !== mainCalendarDate.getMonth() || 
                      date.getFullYear() !== mainCalendarDate.getFullYear()) {
                    // This would require updating TripCalendar to accept controlled date
                  }
                }}
                events={events}
              />
            </div>

            {/* Travel Statistics */}
            <TripStats events={events} />

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">Total Trips</span>
                  <span className="font-bold text-purple-800">{trips.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">This Month</span>
                  <span className="font-bold text-green-800">
                    {events.filter(event => {
                      const now = new Date();
                      const eventDate = new Date(event.startDate);
                      return eventDate.getMonth() === now.getMonth() && 
                             eventDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">Upcoming</span>
                  <span className="font-bold text-blue-800">{upcomingTrips.length}</span>
                </div>
              </div>
            </div>

            {/* Upcoming Trips */}
            {upcomingTrips.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Trips</h3>
                <div className="space-y-3">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleEventClick(trip)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {trip.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-700 font-medium mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {trip.startDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          {trip.destinations.length > 0 && (
                            <div className="flex items-center text-xs text-gray-700 font-medium mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">
                                {trip.destinations[0]}
                                {trip.destinations.length > 1 && ` +${trip.destinations.length - 1}`}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/trips/${trip.tripId}`);
                            }}
                            className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/trips/${trip.tripId}?tab=sections`);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                {(() => {
                  const dayEvents = getEventsForDate(selectedDate);
                  return dayEvents.length > 0 ? (
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          <h4 className="font-medium text-gray-900 text-sm">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {event.type === 'trip' ? 'Trip' : 'Destination'} • {event.status}
                          </p>
                          {event.budget && (
                            <p className="text-xs text-purple-700 font-medium mt-1">
                              Budget: {event.currency} {event.budget.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No trips scheduled for this date</p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <CalendarExport
        events={events}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
