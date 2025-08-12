'use client';

import React, { useState } from 'react';
import { Download, Share2, Calendar, FileText, Image, X } from 'lucide-react';

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

interface CalendarExportProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarExport({ events, isOpen, onClose }: CalendarExportProps) {
  const [exportFormat, setExportFormat] = useState<'ical' | 'csv' | 'json'>('ical');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year'>('year');
  const [includeStops, setIncludeStops] = useState(true);

  if (!isOpen) return null;

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventDate = event.startDate;
    
    if (dateRange === 'month') {
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear();
    } else if (dateRange === 'year') {
      return eventDate.getFullYear() === now.getFullYear();
    }
    return true; // all
  }).filter(event => {
    if (!includeStops && event.type === 'stop') return false;
    return true;
  });

  const generateICalData = () => {
    const icalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GlobeTrotter//Travel Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    filteredEvents.forEach(event => {
      const dtstart = event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtend = event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `${event.id}@globetrotter.com`;
      
      icalData.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''} - Status: ${event.status}`,
        `LOCATION:${event.destinations.join(', ')}`,
        `STATUS:${event.status.toUpperCase()}`,
        `CATEGORIES:${event.type === 'trip' ? 'TRAVEL' : 'DESTINATION'}`,
        'END:VEVENT'
      );
    });

    icalData.push('END:VCALENDAR');
    return icalData.join('\r\n');
  };

  const generateCSVData = () => {
    const headers = ['Title', 'Type', 'Start Date', 'End Date', 'Status', 'Destinations', 'Budget', 'Currency', 'Description'];
    const rows = [headers.join(',')];

    filteredEvents.forEach(event => {
      const row = [
        `"${event.title}"`,
        event.type,
        event.startDate.toISOString().split('T')[0],
        event.endDate.toISOString().split('T')[0],
        event.status,
        `"${event.destinations.join('; ')}"`,
        event.budget || '',
        event.currency,
        `"${event.description || ''}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  };

  const generateJSONData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEvents: filteredEvents.length,
      dateRange,
      includeStops,
      events: filteredEvents.map(event => ({
        id: event.id,
        title: event.title,
        type: event.type,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        status: event.status,
        destinations: event.destinations,
        budget: event.budget,
        currency: event.currency,
        description: event.description,
        tripId: event.tripId
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  const downloadData = () => {
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case 'ical':
        data = generateICalData();
        filename = `travel-calendar-${dateRange}.ics`;
        mimeType = 'text/calendar';
        break;
      case 'csv':
        data = generateCSVData();
        filename = `travel-calendar-${dateRange}.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        data = generateJSONData();
        filename = `travel-calendar-${dateRange}.json`;
        mimeType = 'application/json';
        break;
      default:
        return;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareCalendar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Travel Calendar',
          text: `I have ${filteredEvents.length} travel events planned!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Calendar link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Export Calendar</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="space-y-2">
              {[
                { value: 'ical', label: 'iCalendar (.ics)', description: 'Import to Google Calendar, Outlook, etc.' },
                { value: 'csv', label: 'CSV (.csv)', description: 'Spreadsheet-friendly format' },
                { value: 'json', label: 'JSON (.json)', description: 'Data format for developers' }
              ].map((format) => (
                <label key={format.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.value}
                    checked={exportFormat === format.value}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-xs text-gray-500">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Events</option>
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStops}
                onChange={(e) => setIncludeStops(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include individual destination stops</span>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <strong>{filteredEvents.length}</strong> events will be exported
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={downloadData}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={shareCalendar}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
