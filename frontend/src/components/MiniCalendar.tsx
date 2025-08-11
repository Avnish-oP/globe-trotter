'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: Array<{
    startDate: Date;
    endDate: Date;
    status: string;
  }>;
}

export default function MiniCalendar({ currentDate, onDateChange, events }: MiniCalendarProps) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    onDateChange(newDate);
  };

  const hasEventsOnDate = (date: Date) => {
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="w-8 h-8"></div>
    );
  }
  
  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = new Date().toDateString() === date.toDateString();
    const hasEvents = hasEventsOnDate(date);
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => onDateChange(date)}
        className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors relative ${
          isToday 
            ? 'bg-purple-600 text-white font-bold' 
            : 'hover:bg-purple-100 text-gray-700'
        }`}
      >
        {day}
        {hasEvents && !isToday && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-purple-100 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-purple-600" />
        </button>
        
        <h3 className="text-sm font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-purple-100 rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-purple-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="text-xs text-gray-500 text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>

      <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Has events</span>
        </div>
      </div>
    </div>
  );
}
