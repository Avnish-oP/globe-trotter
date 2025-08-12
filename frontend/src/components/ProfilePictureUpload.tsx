'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  userName?: string;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  onImageChange,
  size = 'md',
  editable = true,
  userName = ''
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await authAPI.uploadProfilePicture(file);
      if (response.success) {
        onImageChange(response.data.profile_picture_url);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDeleteImage = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    try {
      const response = await authAPI.deleteProfilePicture();
      if (response.success) {
        onImageChange(null);
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete image');
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      {/* Animated ring gradient */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
      
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${
          dragOver ? 'ring-4 ring-purple-400 ring-opacity-50' : ''
        } ${
          editable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
        } transition-all duration-300 relative group shadow-xl`}
        onDrop={editable ? handleDrop : undefined}
        onDragOver={editable ? handleDragOver : undefined}
        onDragLeave={editable ? handleDragLeave : undefined}
        onClick={editable ? openFileDialog : undefined}
      >
        {/* Current Image or Placeholder */}
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={userName || 'Profile'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 via-indigo-400 to-purple-500 flex items-center justify-center">
            <span className={`text-white font-black ${textSizes[size]} drop-shadow-lg`}>
              {userName ? userName.charAt(0).toUpperCase() : <User className={`${iconSizes[size]} text-white`} />}
            </span>
          </div>
        )}

        {/* Enhanced Upload Overlay */}
        {editable && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              {uploading ? (
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <Camera className="text-white h-6 w-6 drop-shadow-lg" />
                  <span className="text-white text-xs font-semibold drop-shadow-lg">Change</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Drag Overlay */}
        {dragOver && editable && (
          <div className="absolute inset-0 bg-purple-500/30 backdrop-blur-sm flex items-center justify-center rounded-full border-4 border-purple-400 border-dashed">
            <div className="text-center">
              <Upload className="text-white h-8 w-8 mx-auto mb-1 drop-shadow-lg" />
              <span className="text-white text-xs font-bold drop-shadow-lg">Drop here</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Upload Instructions */}
      {/* {editable && !currentImageUrl && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 text-center whitespace-nowrap font-medium">
          Click or drag to upload
        </div>
      )} */}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
