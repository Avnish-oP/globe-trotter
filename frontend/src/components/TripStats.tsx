'use client';

import React from 'react';
import { Calendar, MapPin, DollarSign, Clock, TrendingUp, Globe } from 'lucide-react';

interface TripStatsProps {
  events: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    budget?: number;
    currency: string;
    type: 'trip' | 'stop';
    destinations: string[];
  }>;
}

export default function TripStats({ events }: TripStatsProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const trips = events.filter(event => event.type === 'trip');
  const destinations = events.filter(event => event.type === 'stop');

  // Calculate statistics
  const totalTrips = trips.length;
  const totalDestinations = destinations.length;
  
  const thisYearTrips = trips.filter(trip => 
    trip.startDate.getFullYear() === currentYear
  ).length;

  const thisMonthTrips = trips.filter(trip => 
    trip.startDate.getFullYear() === currentYear && 
    trip.startDate.getMonth() === currentMonth
  ).length;

  const upcomingTrips = trips.filter(trip => 
    trip.startDate > currentDate
  ).length;

  const ongoingTrips = trips.filter(trip => 
    trip.startDate <= currentDate && trip.endDate >= currentDate
  ).length;

  const completedTrips = trips.filter(trip => 
    trip.endDate < currentDate
  ).length;

  const totalBudget = trips.reduce((sum, trip) => {
    if (trip.budget && trip.currency === 'USD') { // Assuming USD for simplicity
      return sum + trip.budget;
    }
    return sum;
  }, 0);

  const uniqueCountries = new Set(
    destinations.flatMap(dest => 
      dest.destinations.map(d => d.split(', ')[1]).filter(Boolean)
    )
  ).size;

  const averageTripDuration = trips.length > 0 
    ? trips.reduce((sum, trip) => {
        const duration = (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + duration;
      }, 0) / trips.length
    : 0;

  const stats = [
    {
      icon: Calendar,
      label: 'Total Trips',
      value: totalTrips,
      subvalue: `${thisYearTrips} this year`,
      color: 'purple'
    },
    {
      icon: MapPin,
      label: 'Destinations',
      value: totalDestinations,
      subvalue: `${uniqueCountries} countries`,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'This Month',
      value: thisMonthTrips,
      subvalue: `${upcomingTrips} upcoming`,
      color: 'green'
    },
    {
      icon: Clock,
      label: 'Avg Duration',
      value: Math.round(averageTripDuration),
      subvalue: 'days per trip',
      color: 'amber'
    },
    {
      icon: DollarSign,
      label: 'Total Budget',
      value: totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : 'N/A',
      subvalue: 'USD equivalent',
      color: 'emerald'
    },
    {
      icon: Globe,
      label: 'Status',
      value: ongoingTrips,
      subvalue: `${completedTrips} completed`,
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-500 text-purple-600',
      blue: 'bg-blue-500 text-blue-600',
      green: 'bg-green-500 text-green-600',
      amber: 'bg-amber-500 text-amber-600',
      emerald: 'bg-emerald-500 text-emerald-600',
      indigo: 'bg-indigo-500 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Travel Statistics</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = getColorClasses(stat.color);
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`h-5 w-5 ${colorClasses.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.subvalue}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${colorClasses.split(' ')[1]}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicators */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Year Progress</span>
            <span className="font-medium">{Math.round((currentMonth + 1) / 12 * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentMonth + 1) / 12 * 100}%` }}
            ></div>
          </div>
        </div>

        {thisYearTrips > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Trips Completed</span>
              <span className="font-medium">
                {Math.round(completedTrips / totalTrips * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completedTrips / totalTrips * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
