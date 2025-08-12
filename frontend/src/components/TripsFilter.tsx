'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  ChevronDown,
  X
} from 'lucide-react';

interface TripsFilterProps {
  onSearchChange?: (search: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: SortOption) => void;
  onGroupChange?: (group: GroupOption) => void;
}

export interface FilterState {
  status: string[];
  countries: string[];
  dateRange: {
    start: string;
    end: string;
  };
  budget: {
    min: number;
    max: number;
  };
}

export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'budget-asc' | 'budget-desc';
export type GroupOption = 'none' | 'status' | 'country' | 'month' | 'year';

const TripsFilter: React.FC<TripsFilterProps> = ({
  onSearchChange,
  onFilterChange,
  onSortChange,
  onGroupChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    status: [],
    countries: [],
    dateRange: { start: '', end: '' },
    budget: { min: 0, max: 10000 }
  });
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    onSortChange?.(sort);
  };

  const handleGroupChange = (group: GroupOption) => {
    setGroupBy(group);
    onGroupChange?.(group);
  };

  const toggleStatusFilter = (status: string) => {
    const newStatus = activeFilters.status.includes(status)
      ? activeFilters.status.filter(s => s !== status)
      : [...activeFilters.status, status];
    handleFilterChange({ status: newStatus });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      status: [],
      countries: [],
      dateRange: { start: '', end: '' },
      budget: { min: 0, max: 10000 }
    };
    setActiveFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
    setSearchTerm('');
    onSearchChange?.('');
  };

  const hasActiveFilters = 
    activeFilters.status.length > 0 ||
    activeFilters.countries.length > 0 ||
    activeFilters.dateRange.start ||
    activeFilters.dateRange.end ||
    searchTerm;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 p-6 shadow-md">
      {/* Search and Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search trips by destination, country, or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-purple-50/50 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 placeholder-purple-400"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            showFilters 
              ? 'bg-purple-500 text-white border-purple-500' 
              : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="border-t border-purple-200 pt-4 space-y-4">
          {/* Quick Status Filters */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Trip Status</label>
            <div className="flex flex-wrap gap-2">
              {['upcoming', 'current', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeFilters.status.includes(status)
                      ? status === 'upcoming' 
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : status === 'current'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
              <input
                type="date"
                value={activeFilters.dateRange.start}
                onChange={(e) => handleFilterChange({ 
                  dateRange: { ...activeFilters.dateRange, start: e.target.value }
                })}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
              <input
                type="date"
                value={activeFilters.dateRange.end}
                onChange={(e) => handleFilterChange({ 
                  dateRange: { ...activeFilters.dateRange, end: e.target.value }
                })}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort and Group Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        {/* Sort By */}
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="w-full appearance-none bg-purple-50/50 border border-purple-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>

        {/* Group By */}
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Group By</label>
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => handleGroupChange(e.target.value as GroupOption)}
              className="w-full appearance-none bg-purple-50/50 border border-purple-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
            >
              <option value="none">No Grouping</option>
              <option value="status">By Status</option>
              <option value="country">By Country</option>
              <option value="month">By Month</option>
              <option value="year">By Year</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripsFilter;
