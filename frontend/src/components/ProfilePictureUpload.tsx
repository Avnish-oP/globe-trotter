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
    <div className="relative">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 ${
          dragOver ? 'border-primary border-dashed' : 'border-border'
        } ${
          editable ? 'cursor-pointer hover:border-primary/50' : 'cursor-default'
        } transition-all duration-200 relative group`}
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
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className={`text-muted-foreground font-bold ${textSizes[size]}`}>
              {userName ? userName.charAt(0).toUpperCase() : <User className={iconSizes[size]} />}
            </span>
          </div>
        )}

        {/* Upload Overlay */}
        {editable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {uploading ? (
                <div className="animate-spin rounded-full border-2 border-white border-t-transparent w-6 h-6" />
              ) : (
                <Camera className="text-white h-6 w-6" />
              )}
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        {dragOver && editable && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center border-2 border-primary border-dashed rounded-full">
            <Upload className="text-primary h-6 w-6" />
          </div>
        )}
      </div>

      {/* Delete Button - Hidden as per requirement */}
      {/* The removal functionality is still available through the API if needed in the future */}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Instructions */}
      {editable && !currentImageUrl && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground text-center whitespace-nowrap">
          Click or drag to upload
        </div>
      )}
    </div>
  );
}
