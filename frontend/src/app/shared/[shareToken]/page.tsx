'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Heart,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  User,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { sharingAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface TripStats {
  like_count: number;
  view_count: number;
  comment_count: number;
  user_liked: boolean;
}

export default function PublicTripView() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const shareToken = params.shareToken as string;

  const [trip, setTrip] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState<TripStats>({
    like_count: 0,
    view_count: 0,
    comment_count: 0,
    user_liked: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (shareToken) {
      fetchTripData();
    }
  }, [shareToken]);

  const fetchTripData = async () => {
    try {
      setIsLoading(true);
      const response = await sharingAPI.getPublicTrip(shareToken);
      if (response.success) {
        setTrip(response.data.trip);
        setComments(response.data.comments || []);
        setStats(response.data.stats || {});
        setIsLiked(response.data.stats?.user_liked || false);
      }
    } catch (error: any) {
      console.error('Error fetching trip:', error);
      if (error.response?.status === 404) {
        router.push('/404');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      // Redirect to login
      router.push('/auth/login');
      return;
    }

    try {
      const response = await sharingAPI.toggleTripLike(shareToken);
      if (response.success) {
        setIsLiked(response.data.liked);
        setStats(prev => ({
          ...prev,
          like_count: prev.like_count + (response.data.liked ? 1 : -1)
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const submitComment = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const response = await sharingAPI.addComment(shareToken, {
        comment_text: newComment.trim()
      });
      
      if (response.success) {
        setNewComment('');
        fetchTripData(); // Refresh to get new comment
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // Could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h1>
          <p className="text-gray-600 mb-4">This trip is not available or the link has expired.</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={copyShareLink}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </button>
              
              <button
                onClick={() => {/* Share functionality */}}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{trip.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{trip.description}</p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{calculateDuration(trip.start_date, trip.end_date)} days</span>
                </div>
                {trip.total_budget && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{trip.currency} {trip.total_budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator Info */}
            <div className="flex items-center space-x-3 ml-6">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                {trip.creator_avatar ? (
                  <img 
                    src={trip.creator_avatar} 
                    alt={trip.creator_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <div className="font-medium">Created by</div>
                <div className="text-blue-100">{trip.creator_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destinations */}
            {trip.stops && trip.stops.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Destinations</h2>
                <div className="space-y-4">
                  {trip.stops.map((stop: any, index: number) => (
                    <div key={stop.stop_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{stop.city_name}</h3>
                        <p className="text-sm text-gray-600">{stop.country_name}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(stop.arrival_date)} - {formatDate(stop.departure_date)}</span>
                        </div>
                      </div>
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trip Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Status</h2>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                  trip.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                  trip.status === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                </span>
                <span className="text-gray-600">
                  Created {new Date(trip.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interaction Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Engagement</h3>
                <div className="flex items-center space-x-2">
                  <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">{stats.like_count || 0}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={toggleLike}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    isLiked 
                      ? 'bg-red-50 text-red-600 border border-red-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                {trip.allow_comments && (
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Comments ({comments.length})</span>
                  </button>
                )}

                {trip.allow_cloning && (
                  <button
                    onClick={() => {/* Clone trip functionality */}}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Use as Template</span>
                  </button>
                )}
              </div>
            </div>

            {/* Trip Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{calculateDuration(trip.start_date, trip.end_date)} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Destinations</span>
                  <span className="font-medium">{trip.stops?.length || 0}</span>
                </div>
                {trip.total_budget && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium">{trip.currency} {trip.total_budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {trip.allow_comments && showComments && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Comments</h3>
            
            {/* Add Comment */}
            {user ? (
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={submitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-2">Sign in to leave a comment</p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {comment.commenter_avatar ? (
                        <img 
                          src={comment.commenter_avatar} 
                          alt={comment.commenter_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm">{comment.commenter_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.commenter_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.comment_text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
