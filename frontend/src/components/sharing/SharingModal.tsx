'use client';

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Mail, 
  Settings, 
  Globe, 
  Lock, 
  Users, 
  Eye,
  MessageSquare,
  Copy,
  Heart,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
import { sharingAPI } from '@/lib/api';

interface SharingModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  initialTrip?: any;
}

interface SharingSettings {
  visibility: 'private' | 'public' | 'unlisted' | 'friends_only';
  allow_comments: boolean;
  allow_cloning: boolean;
  share_token?: string;
}

export default function SharingModal({ tripId, isOpen, onClose, initialTrip }: SharingModalProps) {
  const [settings, setSettings] = useState<SharingSettings>({
    visibility: 'private',
    allow_comments: false,
    allow_cloning: false
  });
  const [shareEmails, setShareEmails] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'share' | 'analytics'>('settings');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharingData, setSharingData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && tripId) {
      fetchSharingData();
    }
  }, [isOpen, tripId]);

  useEffect(() => {
    if (initialTrip) {
      setSettings({
        visibility: initialTrip.visibility || 'private',
        allow_comments: initialTrip.allow_comments || false,
        allow_cloning: initialTrip.allow_cloning || false,
        share_token: initialTrip.share_token
      });
    }
  }, [initialTrip]);

  const fetchSharingData = async () => {
    try {
      setIsLoading(true);
      const response = await sharingAPI.getTripSharing(tripId);
      if (response.success) {
        const tripData = response.data.trip;
        setSettings({
          visibility: tripData.visibility,
          allow_comments: tripData.allow_comments,
          allow_cloning: tripData.allow_cloning,
          share_token: tripData.share_token
        });
        setSharingData(response.data);
      }
    } catch (error) {
      console.error('Error fetching sharing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSharingSettings = async (newSettings: Partial<SharingSettings>) => {
    try {
      setIsUpdating(true);
      const response = await sharingAPI.updateTripSharing(tripId, newSettings);
      if (response.success) {
        setSettings(prev => ({ ...prev, ...response.data }));
        if (newSettings.visibility && ['public', 'unlisted'].includes(newSettings.visibility)) {
          fetchSharingData(); // Refresh to get new share token
        }
      }
    } catch (error) {
      console.error('Error updating sharing settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const shareWithUsers = async () => {
    if (!shareEmails.trim()) return;

    try {
      setIsUpdating(true);
      const emails = shareEmails.split(',').map(email => email.trim()).filter(Boolean);
      const response = await sharingAPI.shareTrip(tripId, {
        emails,
        message: shareMessage.trim() || undefined
      });
      
      if (response.success) {
        setShareEmails('');
        setShareMessage('');
        fetchSharingData(); // Refresh sharing data
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyShareLink = () => {
    if (settings.share_token) {
      const shareUrl = `${window.location.origin}/shared/${settings.share_token}`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'unlisted': return <Link className="h-4 w-4" />;
      case 'friends_only': return <Users className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Anyone can discover and view this trip';
      case 'unlisted': return 'Only people with the link can view';
      case 'friends_only': return 'Only your friends can see this trip';
      default: return 'Only you can see this trip';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Share2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Share Trip</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'settings', label: 'Privacy', icon: Settings },
                { key: 'share', label: 'Share', icon: Share2 },
                { key: 'analytics', label: 'Analytics', icon: Eye }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Privacy Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Visibility</h3>
                      <div className="space-y-3">
                        {[
                          { value: 'private', label: 'Private', description: 'Only you can see this trip', icon: '🔒' },
                          { value: 'public', label: 'Public', description: 'Anyone can discover and view this trip', icon: '🌍' },
                          { value: 'unlisted', label: 'Unlisted', description: 'Only people with the link can view', icon: '🔗' },
                          { value: 'friends_only', label: 'Friends Only', description: 'Only your friends can see this trip', icon: '👥' }
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                              settings.visibility === option.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visibility"
                              value={option.value}
                              checked={settings.visibility === option.value}
                              onChange={(e) => {
                                const newVisibility = e.target.value as any;
                                setSettings(prev => ({ ...prev, visibility: newVisibility }));
                                updateSharingSettings({ visibility: newVisibility });
                              }}
                              className="sr-only"
                              disabled={isUpdating}
                            />
                            <div className="flex items-start space-x-3 w-full">
                              <span className="text-xl">{option.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{option.label}</div>
                                <div className="text-sm text-gray-600">{option.description}</div>
                              </div>
                              {settings.visibility === option.value && (
                                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Additional Settings for Public/Unlisted */}
                    {(settings.visibility === 'public' || settings.visibility === 'unlisted') && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction Settings</h3>
                        <div className="space-y-4">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.allow_comments}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                setSettings(prev => ({ ...prev, allow_comments: newValue }));
                                updateSharingSettings({ allow_comments: newValue });
                              }}
                              disabled={isUpdating}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Allow Comments</div>
                              <div className="text-sm text-gray-600">Let others comment on your trip and suggest improvements</div>
                            </div>
                          </label>
                          
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.allow_cloning}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                setSettings(prev => ({ ...prev, allow_cloning: newValue }));
                                updateSharingSettings({ allow_cloning: newValue });
                              }}
                              disabled={isUpdating}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Allow Cloning</div>
                              <div className="text-sm text-gray-600">Let others use your trip as a template for their own</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Share Tab */}
                {activeTab === 'share' && (
                  <div className="space-y-6">
                    {/* Share Link */}
                    {settings.share_token && (settings.visibility === 'public' || settings.visibility === 'unlisted') && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Share Link</h3>
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={`${window.location.origin}/shared/${settings.share_token}`}
                            readOnly
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-600"
                          />
                          <button
                            onClick={copyShareLink}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Share with Specific Users */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Share with People</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email addresses (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={shareEmails}
                            onChange={(e) => setShareEmails(e.target.value)}
                            placeholder="email1@example.com, email2@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message (optional)
                          </label>
                          <textarea
                            value={shareMessage}
                            onChange={(e) => setShareMessage(e.target.value)}
                            rows={3}
                            placeholder="Add a personal message..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <button
                          onClick={shareWithUsers}
                          disabled={!shareEmails.trim() || isUpdating}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          <span>{isUpdating ? 'Sending...' : 'Send Invites'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Shared Users List */}
                    {sharingData?.shared_users && sharingData.shared_users.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Shared With</h3>
                        <div className="space-y-2">
                          {sharingData.shared_users.map((share: any) => (
                            <div key={share.share_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {share.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{share.name}</div>
                                  <div className="text-sm text-gray-600">{share.email}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 capitalize">
                                {share.permission_level}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && sharingData?.stats && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Analytics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Total Views</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 mt-2">
                          {sharingData.stats.total_views}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-900">Unique Viewers</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900 mt-2">
                          {sharingData.stats.unique_viewers}
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-purple-900">Comments</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900 mt-2">
                          {sharingData.stats.comment_count || 0}
                        </div>
                      </div>
                    </div>

                    {/* Recent Views */}
                    {sharingData.stats.recent_views && sharingData.stats.recent_views.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recent Views</h4>
                        <div className="space-y-2">
                          {sharingData.stats.recent_views.slice(0, 5).map((view: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  {view.viewer_name ? (
                                    <span className="text-gray-600 text-xs">{view.viewer_name.charAt(0)}</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">?</span>
                                  )}
                                </div>
                                <span className="text-gray-900">
                                  {view.viewer_name || 'Anonymous'}
                                </span>
                              </div>
                              <span className="text-gray-500">
                                {new Date(view.viewed_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Loading Overlay */}
          {isUpdating && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
