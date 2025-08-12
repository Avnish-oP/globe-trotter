'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, Clock, DollarSign } from 'lucide-react';

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

interface TripCalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  viewMode: 'month' | 'year';
}

export default function TripCalendar({
  events,
  onEventClick,
  onDateSelect,
  selectedDate,
  viewMode
}: TripCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string, type: 'trip' | 'stop') => {
    const baseColors = {
      planning: type === 'trip' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-amber-50 text-amber-700 border-amber-100',
      booked: type === 'trip' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-50 text-blue-700 border-blue-100',
      ongoing: type === 'trip' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-green-50 text-green-700 border-green-100',
      completed: type === 'trip' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-50 text-purple-700 border-purple-100',
      cancelled: type === 'trip' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-red-50 text-red-700 border-red-100'
    };
    
    return baseColors[status.toLowerCase() as keyof typeof baseColors] || 
           (type === 'trip' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-50 text-gray-700 border-gray-100');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const isDateInRange = (date: Date, startDate: Date, endDate: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return checkDate >= start && checkDate <= end;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -firstDayOfWeek + i + 1);
      calendarDays.push(
        <div key={`prev-${i}`} className="p-2 text-gray-400 bg-gray-50/50">
          <div className="w-8 h-8 flex items-center justify-center text-sm">
            {prevMonthDate.getDate()}
          </div>
        </div>
      );
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() && 
        date.getMonth() === selectedDate.getMonth() && 
        date.getFullYear() === selectedDate.getFullYear();
      
      const isToday = new Date().toDateString() === date.toDateString();
      
      calendarDays.push(
        <div
          key={day}
          className={`p-1 min-h-[100px] border border-gray-100 cursor-pointer transition-colors hover:bg-purple-50/50 ${
            isSelected ? 'bg-purple-100 border-purple-300' : ''
          } ${isToday ? 'ring-2 ring-purple-400' : ''}`}
          onClick={() => onDateSelect(date)}
        >
          <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium mb-1 rounded-full ${
            isToday ? 'bg-purple-600 text-white' : 'text-gray-900'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer transition-all hover:shadow-sm ${getStatusColor(event.status, event.type)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                title={`${event.title} (${event.type})`}
              >
                <div className="truncate">
                  {event.type === 'trip' ? '✈️' : '📍'} {event.title}
                </div>
              </div>
            ))}
            
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 px-2">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      calendarDays.push(
        <div key={`next-${i}`} className="p-2 text-gray-400 bg-gray-50/50">
          <div className="w-8 h-8 flex items-center justify-center text-sm">
            {nextMonthDate.getDate()}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div key={day} className="bg-purple-50 p-3 text-center font-semibold text-purple-700 text-sm border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays}
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthEvents = events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return (eventStart.getFullYear() === year && eventStart.getMonth() === month) ||
               (eventEnd.getFullYear() === year && eventEnd.getMonth() === month) ||
               (eventStart.getFullYear() <= year && eventStart.getMonth() <= month &&
                eventEnd.getFullYear() >= year && eventEnd.getMonth() >= month);
      });
      
      const tripEvents = monthEvents.filter(e => e.type === 'trip');
      const stopEvents = monthEvents.filter(e => e.type === 'stop');
      
      months.push(
        <div
          key={month}
          className="bg-white border border-purple-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setCurrentDate(new Date(year, month, 1));
          }}
        >
          <h3 className="font-semibold text-gray-900 mb-3">{monthNames[month]}</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trips:</span>
              <span className="font-medium text-purple-700">{tripEvents.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Destinations:</span>
              <span className="font-medium text-blue-700">{stopEvents.length}</span>
            </div>
          </div>
          
          {monthEvents.length > 0 && (
            <div className="mt-3 space-y-1">
              {monthEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`px-2 py-1 rounded text-xs border ${getStatusColor(event.status, event.type)}`}
                >
                  <div className="truncate">
                    {event.type === 'trip' ? '✈️' : '📍'} {event.title}
                  </div>
                </div>
              ))}
              {monthEvents.length > 2 && (
                <div className="text-xs text-gray-500 px-2">
                  +{monthEvents.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateYear('prev')}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-purple-600" />
          </button>
          
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : currentDate.getFullYear()
            }
          </h2>
          
          <button
            onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateYear('next')}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-purple-600" />
          </button>
        </div>
        
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
        >
          Today
        </button>
      </div>

      {/* Calendar Content */}
      {viewMode === 'month' ? renderMonthView() : renderYearView()}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
          <span>✈️ Trips</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-100 rounded"></div>
          <span>📍 Destinations</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span>Ongoing</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
          <span>Planning</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
          <span>Completed</span>
        </div>
      </div>

      {/* Event Tooltip */}
      {hoveredEvent && (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm pointer-events-none"
             style={{ 
               position: 'fixed',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)'
             }}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{hoveredEvent.title}</h4>
            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(hoveredEvent.status, hoveredEvent.type)}`}>
              {hoveredEvent.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {hoveredEvent.startDate.toLocaleDateString()} - {hoveredEvent.endDate.toLocaleDateString()}
            </div>
            
            {hoveredEvent.destinations.length > 0 && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {hoveredEvent.destinations.slice(0, 2).join(', ')}
                {hoveredEvent.destinations.length > 2 && ` +${hoveredEvent.destinations.length - 2} more`}
              </div>
            )}
            
            {hoveredEvent.budget && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                {hoveredEvent.currency} {hoveredEvent.budget.toLocaleString()}
              </div>
            )}
            
            {hoveredEvent.description && (
              <p className="text-gray-700 mt-2">{hoveredEvent.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
