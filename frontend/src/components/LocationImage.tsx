'use client';

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { getPlaceImageUrl } from '@/lib/imageApi';

interface LocationImageProps {
  location: string;
  alt?: string;
  className?: string;
  size?: 'thumb' | 'small' | 'regular';
  showFallback?: boolean;
  onImageLoad?: (url: string | null) => void;
}

export const LocationImage: React.FC<LocationImageProps> = ({
  location,
  alt,
  className = "w-full h-full object-cover",
  size = 'small',
  showFallback = true,
  onImageLoad
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const url = await getPlaceImageUrl(location, size);
        
        if (isMounted) {
          setImageUrl(url);
          onImageLoad?.(url);
        }
      } catch (error) {
        console.error(`Error loading image for ${location}:`, error);
        if (isMounted) {
          setHasError(true);
          onImageLoad?.(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (location) {
      loadImage();
    }

    return () => {
      isMounted = false;
    };
  }, [location, size, onImageLoad]);

  const handleImageError = () => {
    setHasError(true);
    setImageUrl(null);
    onImageLoad?.(null);
  };

  if (isLoading) {
    return showFallback ? (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-100`}>
        <div className="animate-pulse">
          <MapPin className="w-8 h-8 text-violet-300" />
        </div>
      </div>
    ) : null;
  }

  if (hasError || !imageUrl) {
    return showFallback ? (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-100`}>
        <MapPin className="w-8 h-8 text-violet-300" />
      </div>
    ) : null;
  }

  return (
    <img
      src={imageUrl}
      alt={alt || location}
      className={className}
      onError={handleImageError}
    />
  );
};

export default LocationImage;
