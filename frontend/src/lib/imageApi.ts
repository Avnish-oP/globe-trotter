// Image API utility for fetching place images
const IMAGE_API_BASE = 'https://image-api.vercel.app/images';

export interface ImageData {
  id: string;
  description: string;
  photographer: {
    name: string;
    username: string;
  };
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
}

export interface ImageApiResponse {
  success: boolean;
  place: string;
  total_found: number;
  images: ImageData[];
}

// Cache for storing fetched images to avoid repeated API calls
const imageCache = new Map<string, ImageData[]>();

export const fetchPlaceImages = async (placeName: string, limit: number = 5): Promise<ImageData[]> => {
  try {
    // Check cache first
    const cacheKey = `${placeName.toLowerCase()}-${limit}`;
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey)!;
    }

    // Clean place name for API call
    const cleanPlaceName = placeName
      .replace(/,.*$/, '') // Remove country/state parts
      .trim()
      .toLowerCase();

    const response = await fetch(`${IMAGE_API_BASE}/${encodeURIComponent(cleanPlaceName)}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch images for ${placeName}:`, response.statusText);
      return [];
    }

    const data: ImageApiResponse = await response.json();
    
    if (data.success && data.images) {
      const limitedImages = data.images.slice(0, limit);
      // Cache the result
      imageCache.set(cacheKey, limitedImages);
      return limitedImages;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching images for ${placeName}:`, error);
    return [];
  }
};

export const getPlaceImageUrl = async (placeName: string, size: 'thumb' | 'small' | 'regular' = 'small'): Promise<string | null> => {
  try {
    const images = await fetchPlaceImages(placeName, 1);
    if (images.length > 0) {
      return images[0].urls[size];
    }
    return null;
  } catch (error) {
    console.error(`Error getting image URL for ${placeName}:`, error);
    return null;
  }
};

// Preload images for multiple places
export const preloadPlaceImages = async (placeNames: string[]): Promise<Map<string, ImageData[]>> => {
  const imageMap = new Map<string, ImageData[]>();
  
  const promises = placeNames.map(async (placeName) => {
    const images = await fetchPlaceImages(placeName, 3);
    imageMap.set(placeName, images);
    return { placeName, images };
  });

  await Promise.allSettled(promises);
  return imageMap;
};
