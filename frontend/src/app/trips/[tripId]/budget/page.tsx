'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { tripsAPI, sectionsAPI } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calculator,
  AlertTriangle,
  Edit3,
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  Wallet,
  CreditCard,
  Plane,
  Car,
  Home,
  Utensils,
  Camera,
  ShoppingBag,
  Coffee
} from 'lucide-react';

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  cover_image_url?: string;
  status: string;
}

interface TripSection {
  section_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  budget_level: 'low' | 'medium' | 'high';
  estimated_cost?: number;
  actual_cost?: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  budgeted: number;
  actual: number;
  color: string;
}

interface DailyBudget {
  date: string;
  planned: number;
  actual: number;
  categories: {
    transport: number;
    accommodation: number;
    food: number;
    activities: number;
    shopping: number;
    other: number;
  };
}

export default function TripBudgetScreen() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'daily' | 'categories'>('overview');

  // Budget state
  const [totalBudget, setTotalBudget] = useState(0);
  const [actualSpent, setActualSpent] = useState(0);
  const [currency, setCurrency] = useState('USD');

  // Categories with sample data - in real app, this would come from API
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([
    {
      id: 'transport',
      name: 'Transportation',
      icon: <Plane className="w-5 h-5" />,
      budgeted: 800,
      actual: 750,
      color: 'bg-blue-500'
    },
    {
      id: 'accommodation',
      name: 'Accommodation',
      icon: <Home className="w-5 h-5" />,
      budgeted: 1200,
      actual: 1350,
      color: 'bg-green-500'
    },
    {
      id: 'food',
      name: 'Food & Dining',
      icon: <Utensils className="w-5 h-5" />,
      budgeted: 600,
      actual: 580,
      color: 'bg-yellow-500'
    },
    {
      id: 'activities',
      name: 'Activities & Tours',
      icon: <Camera className="w-5 h-5" />,
      budgeted: 500,
      actual: 620,
      color: 'bg-purple-500'
    },
    {
      id: 'shopping',
      name: 'Shopping',
      icon: <ShoppingBag className="w-5 h-5" />,
      budgeted: 300,
      actual: 280,
      color: 'bg-pink-500'
    },
    {
      id: 'other',
      name: 'Miscellaneous',
      icon: <Coffee className="w-5 h-5" />,
      budgeted: 200,
      actual: 150,
      color: 'bg-gray-500'
    }
  ]);

  // Load trip and budget data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (tripId) {
      loadTripData();
    }
  }, [tripId, isAuthenticated]);

  const loadTripData = async () => {
    try {
      setIsLoading(true);
      
      // Load trip details and sections in parallel
      const [tripResponse, sectionsResponse] = await Promise.all([
        tripsAPI.getTripById(tripId),
        sectionsAPI.getTripSections(tripId)
      ]);

      const tripData = tripResponse.data;
      setTrip(tripData);
      setSections(sectionsResponse.data || []);
      setTotalBudget(tripData.total_budget || 0);
      setCurrency(tripData.currency || 'USD');
      
      // Calculate totals
      const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
      const totalActual = budgetCategories.reduce((sum, cat) => sum + cat.actual, 0);
      setActualSpent(totalActual);
      
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetCategory = (categoryId: string, field: 'budgeted' | 'actual', value: number) => {
    setBudgetCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, [field]: value } : cat
    ));
  };

  const saveBudget = async () => {
    try {
      // In a real app, you would save to the backend here
      const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
      const totalActual = budgetCategories.reduce((sum, cat) => sum + cat.actual, 0);
      
      await tripsAPI.updateTrip(tripId, { 
        total_budget: totalBudgeted,
        currency 
      });
      
      setTotalBudget(totalBudgeted);
      setActualSpent(totalActual);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getBudgetStatus = (budgeted: number, actual: number) => {
    const percentage = (actual / budgeted) * 100;
    if (percentage <= 80) return { status: 'under', color: 'text-green-600', icon: <TrendingDown className="w-4 h-4" /> };
    if (percentage <= 100) return { status: 'on-track', color: 'text-blue-600', icon: <TrendingUp className="w-4 h-4" /> };
    return { status: 'over', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
  };

  const getOverallBudgetStatus = () => {
    const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    const totalActual = budgetCategories.reduce((sum, cat) => sum + cat.actual, 0);
    return getBudgetStatus(totalBudgeted, totalActual);
  };

  const generateDailyBudgets = (): DailyBudget[] => {
    if (!trip) return [];
    
    const days = [];
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = totalBudgeted / totalDays;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        planned: dailyAverage,
        actual: dailyAverage * (0.8 + Math.random() * 0.4), // Mock data
        categories: {
          transport: Math.random() * 50,
          accommodation: dailyAverage * 0.4,
          food: Math.random() * 100,
          activities: Math.random() * 80,
          shopping: Math.random() * 30,
          other: Math.random() * 20
        }
      });
    }
    
    return days;
  };

  const dailyBudgets = generateDailyBudgets();
  const overallStatus = getOverallBudgetStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Budget Overview</h1>
                <p className="text-gray-600 mt-1">{trip.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={saveBudget}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Budget
                </button>
              )}
            </div>
          </div>

          {/* Budget Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0))}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Spent So Far</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.actual, 0))}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Remaining</div>
                  <div className={`text-2xl font-bold ${
                    budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0) - 
                    budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(
                      budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0) - 
                      budgetCategories.reduce((sum, cat) => sum + cat.actual, 0)
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0) - 
                  budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) >= 0 
                    ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Calculator className={`w-6 h-6 ${
                    budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0) - 
                    budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Daily Average</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (budgetCategories.reduce((sum, cat) => sum + cat.actual, 0)) / 
                      Math.max(1, Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)))
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 mb-6">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                activeView === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveView('categories')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                activeView === 'categories'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveView('daily')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                activeView === 'daily'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Daily Breakdown
            </button>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Budget vs Actual Chart Placeholder */}
            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart visualization would go here</p>
                  <p className="text-sm">Pie chart showing budget allocation</p>
                </div>
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Budget Status</h3>
              <div className="space-y-4">
                <div className={`flex items-center p-4 rounded-lg border-2 ${
                  overallStatus.status === 'over' ? 'border-red-200 bg-red-50' :
                  overallStatus.status === 'under' ? 'border-green-200 bg-green-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className={`mr-3 ${overallStatus.color}`}>
                    {overallStatus.icon}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {overallStatus.status === 'over' ? 'Over Budget' :
                       overallStatus.status === 'under' ? 'Under Budget' : 'On Track'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {overallStatus.status === 'over' ? 'Consider adjusting your spending' :
                       overallStatus.status === 'under' ? 'Great job staying within budget!' :
                       'You\'re spending as planned'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {Math.round((budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) / 
                                  budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        overallStatus.status === 'over' ? 'bg-red-500' :
                        overallStatus.status === 'under' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) / 
                                budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'categories' && (
          <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Budget by Category</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {budgetCategories.map((category) => {
                  const status = getBudgetStatus(category.budgeted, category.actual);
                  const percentage = category.budgeted > 0 ? (category.actual / category.budgeted) * 100 : 0;
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg text-white ${category.color}`}>
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                            <div className={`text-sm flex items-center ${status.color}`}>
                              {status.icon}
                              <span className="ml-1">
                                {status.status === 'over' ? 'Over budget' :
                                 status.status === 'under' ? 'Under budget' : 'On track'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(category.actual)} / {formatCurrency(category.budgeted)}
                          </div>
                          <div className="text-sm text-gray-600">{Math.round(percentage)}% used</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            percentage > 100 ? 'bg-red-500' :
                            percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>

                      {/* Edit fields */}
                      {isEditing && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Budgeted</label>
                            <input
                              type="number"
                              value={category.budgeted}
                              onChange={(e) => updateBudgetCategory(category.id, 'budgeted', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Actual</label>
                            <input
                              type="number"
                              value={category.actual}
                              onChange={(e) => updateBudgetCategory(category.id, 'actual', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeView === 'daily' && (
          <div className="bg-white rounded-2xl border border-purple-200/50 shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Daily Budget Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Planned</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Actual</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Difference</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyBudgets.map((day, index) => {
                      const difference = day.actual - day.planned;
                      const isOver = difference > 0;
                      
                      return (
                        <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">{formatCurrency(day.planned)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(day.actual)}</td>
                          <td className={`py-3 px-4 text-right font-medium ${
                            isOver ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isOver ? '+' : ''}{formatCurrency(difference)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isOver ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isOver ? 'Over' : 'Under'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
