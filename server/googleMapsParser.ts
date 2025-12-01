interface ParsedCoordinates {
  latitude: number;
  longitude: number;
  confidence: 'parsed' | 'geocoded';
  source: string;
}

interface ParseResult {
  success: boolean;
  data?: ParsedCoordinates;
  error?: string;
}

export function parseGoogleMapsUrl(url: string): ParseResult {
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();
  
  try {
    let lat: number | null = null;
    let lng: number | null = null;
    let source = 'unknown';

    // Pattern 1: !8m2!3d{lat}!4d{lng} (place coordinates in data param - HIGHEST PRIORITY)
    // This is the ACTUAL place location, not the viewport
    const dataMatch = trimmedUrl.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dataMatch) {
      lat = parseFloat(dataMatch[1]);
      lng = parseFloat(dataMatch[2]);
      source = 'place_data_param';
    }

    // Pattern 2: !3d{lat}!4d{lng} (embedded maps format - second priority for place coords)
    if (!lat) {
      const embeddedMatch = trimmedUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
      if (embeddedMatch) {
        lat = parseFloat(embeddedMatch[1]);
        lng = parseFloat(embeddedMatch[2]);
        source = 'embedded_param';
      }
    }

    // Pattern 3: ?q=lat,lng or ?ll=lat,lng
    if (!lat) {
      const queryMatch = trimmedUrl.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (queryMatch) {
        lat = parseFloat(queryMatch[1]);
        lng = parseFloat(queryMatch[2]);
        source = 'query_param';
      }
    }

    // Pattern 4: Direct coordinate format (20.2085,-87.4278)
    if (!lat) {
      const directMatch = trimmedUrl.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (directMatch) {
        lat = parseFloat(directMatch[1]);
        lng = parseFloat(directMatch[2]);
        source = 'direct_coords';
      }
    }

    // Pattern 5: /@lat,lng,zoom (Google Maps view URL - LOWER PRIORITY)
    // Note: This is the viewport/camera position, not necessarily the place location
    // Only use this if no place coordinates were found above
    if (!lat) {
      const atMatch = trimmedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+\.?\d*[zm]/);
      if (atMatch) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
        source = 'viewport_param';
      }
    }

    // Pattern 6: /place/.../@lat,lng (place URL with coordinates in path)
    if (!lat) {
      const placeMatch = trimmedUrl.match(/\/place\/[^@]*@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (placeMatch) {
        lat = parseFloat(placeMatch[1]);
        lng = parseFloat(placeMatch[2]);
        source = 'place_path_param';
      }
    }

    // Pattern 7: maps/dir/lat,lng or similar path-based formats
    if (!lat) {
      const pathMatch = trimmedUrl.match(/\/(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (pathMatch) {
        lat = parseFloat(pathMatch[1]);
        lng = parseFloat(pathMatch[2]);
        source = 'path_param';
      }
    }

    // Validate coordinates
    if (lat !== null && lng !== null) {
      // Verify coordinates are within valid ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        // Additional validation: coordinates should have reasonable precision
        // and not be exactly 0,0 (often indicates parsing error)
        if (lat === 0 && lng === 0) {
          return { success: false, error: 'Invalid coordinates (0,0)' };
        }

        return {
          success: true,
          data: {
            latitude: lat,
            longitude: lng,
            confidence: 'parsed',
            source
          }
        };
      } else {
        return { success: false, error: 'Coordinates out of valid range' };
      }
    }

    // If no coordinates found, check if it's a short URL that needs resolving
    if (trimmedUrl.includes('goo.gl') || trimmedUrl.includes('maps.app.goo.gl')) {
      return { 
        success: false, 
        error: 'Short URL detected. Please use the full Google Maps URL (click "Share" then "Copy link" in Google Maps)' 
      };
    }

    return { success: false, error: 'Could not extract coordinates from URL. Please paste the full Google Maps link or enter coordinates manually.' };

  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    return { success: false, error: 'Error parsing URL' };
  }
}

export async function resolveShortUrl(shortUrl: string): Promise<string | null> {
  try {
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.url;
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return null;
  }
}

export async function parseGoogleMapsUrlWithResolve(url: string): Promise<ParseResult> {
  const trimmedUrl = url.trim();
  
  // First try direct parsing
  let result = parseGoogleMapsUrl(trimmedUrl);
  
  if (!result.success && (trimmedUrl.includes('goo.gl') || trimmedUrl.includes('maps.app.goo.gl'))) {
    // Try to resolve short URL
    const resolvedUrl = await resolveShortUrl(trimmedUrl);
    if (resolvedUrl) {
      result = parseGoogleMapsUrl(resolvedUrl);
      if (result.success && result.data) {
        result.data.source = 'resolved_short_url';
      }
    }
  }
  
  return result;
}
