import { useState, useCallback, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Bed, Bath, Square, ExternalLink, Home, Loader2, Building2, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface PropertyLocation {
  id: string;
  title?: string;
  unitNumber: string;
  condominiumName?: string;
  latitude: number;
  longitude: number;
  price?: number | string;
  salePrice?: number | string;
  currency?: string;
  saleCurrency?: string;
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number | string;
  area?: number | string;
  propertyType?: string;
  zone?: string;
  city?: string;
  primaryImages?: string[];
  slug?: string;
  agencySlug?: string;
}

interface LocationCluster {
  key: string;
  lat: number;
  lng: number;
  properties: PropertyLocation[];
  condominiumName?: string;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onPropertyClick?: (property: PropertyLocation) => void;
  showInfoWindow?: boolean;
  language?: "es" | "en";
  linkPrefix?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.2119,
  lng: -87.4297,
};

const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

export function PropertyMap({
  properties,
  center,
  zoom = 13,
  height = "500px",
  onPropertyClick,
  showInfoWindow = true,
  language = "es",
  linkPrefix = "/public-unit",
}: PropertyMapProps) {
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const t = {
    es: {
      loading: "Cargando mapa...",
      noProperties: "No hay propiedades para mostrar en el mapa",
      viewDetails: "Ver detalles",
      rent: "Renta",
      sale: "Venta",
      rentSale: "Renta/Venta",
      bedrooms: "Recámaras",
      bathrooms: "Baños",
      area: "Área",
      mapError: "Error al cargar el mapa",
      noApiKey: "Configuración del mapa pendiente",
    },
    en: {
      loading: "Loading map...",
      noProperties: "No properties to display on the map",
      viewDetails: "View details",
      rent: "Rent",
      sale: "Sale",
      rentSale: "Rent/Sale",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      area: "Area",
      mapError: "Error loading map",
      noApiKey: "Map configuration pending",
    },
  };

  const labels = t[language];

  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        p.latitude &&
        p.longitude &&
        !isNaN(Number(p.latitude)) &&
        !isNaN(Number(p.longitude)) &&
        Number(p.latitude) !== 0 &&
        Number(p.longitude) !== 0
    );
  }, [properties]);

  // Group properties by location (cluster properties at same coordinates)
  const locationClusters = useMemo(() => {
    const clusters = new Map<string, LocationCluster>();
    
    for (const property of validProperties) {
      // Round to 5 decimal places to group very close properties
      const lat = Number(property.latitude).toFixed(5);
      const lng = Number(property.longitude).toFixed(5);
      const key = `${lat},${lng}`;
      
      if (!clusters.has(key)) {
        clusters.set(key, {
          key,
          lat: Number(property.latitude),
          lng: Number(property.longitude),
          properties: [],
          condominiumName: property.condominiumName,
        });
      }
      
      clusters.get(key)!.properties.push(property);
    }
    
    return Array.from(clusters.values());
  }, [validProperties]);

  const mapCenter = useMemo(() => {
    if (center) return center;
    if (validProperties.length === 0) return defaultCenter;

    const sumLat = validProperties.reduce((sum, p) => sum + Number(p.latitude), 0);
    const sumLng = validProperties.reduce((sum, p) => sum + Number(p.longitude), 0);

    return {
      lat: sumLat / validProperties.length,
      lng: sumLng / validProperties.length,
    };
  }, [center, validProperties]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleClusterClick = (cluster: LocationCluster) => {
    if (cluster.properties.length === 1) {
      // Single property - show property info directly
      setSelectedProperty(cluster.properties[0]);
      setSelectedCluster(null);
      if (onPropertyClick) {
        onPropertyClick(cluster.properties[0]);
      }
    } else {
      // For clusters with many properties, zoom in first
      if (map && cluster.properties.length > 15) {
        const currentZoom = map.getZoom() || 13;
        if (currentZoom < 17) {
          map.setZoom(Math.min(currentZoom + 2, 18));
          map.panTo({ lat: cluster.lat, lng: cluster.lng });
        }
      }
      // Show cluster list
      setSelectedCluster(cluster);
      setSelectedProperty(null);
    }
  };

  const handlePropertySelect = (property: PropertyLocation) => {
    setSelectedProperty(property);
    setSelectedCluster(null);
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  const getClusterIcon = (count: number) => {
    if (count === 1) {
      // Single property marker - pin style
      const width = 30;
      const height = 38;
      return {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="${width}" height="${height}" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 14 22 15 23 1-1 15-11.75 15-23C30 6.716 23.284 0 15 0z" fill="#4F46E5"/>
            <circle cx="15" cy="13" r="6" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(width, height),
        anchor: new google.maps.Point(width / 2, height),
      };
    }
    // Cluster marker with count - circle style
    const size = count > 50 ? 48 : count > 20 ? 44 : count > 10 ? 40 : 36;
    const fontSize = count > 99 ? 11 : count > 9 ? 12 : 13;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#4F46E5" stroke="white" stroke-width="2"/>
          <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${count}</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  };

  const formatPrice = (price: number | string | undefined, currency: string = "MXN") => {
    if (!price) return null;
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return null;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getPropertyLink = (property: PropertyLocation) => {
    if (property.slug && property.agencySlug) {
      return `/${property.agencySlug}/${property.slug}`;
    }
    return `${linkPrefix}/${property.id}`;
  };

  const getListingTypeLabel = (listingType?: string) => {
    if (!listingType) return null;
    switch (listingType) {
      case "rent":
        return labels.rent;
      case "sale":
        return labels.sale;
      case "both":
        return labels.rentSale;
      default:
        return null;
    }
  };

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{labels.noApiKey}</p>
        </div>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-destructive">
          <MapPin className="h-12 w-12 mx-auto mb-3" />
          <p>{labels.mapError}</p>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-background" style={{ height }}>
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-sm text-muted-foreground">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (validProperties.length === 0) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{labels.noProperties}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {locationClusters.map((cluster) => (
          <Marker
            key={cluster.key}
            position={{
              lat: cluster.lat,
              lng: cluster.lng,
            }}
            onClick={() => handleClusterClick(cluster)}
            icon={getClusterIcon(cluster.properties.length)}
            title={cluster.properties.length > 1 
              ? `${cluster.properties.length} propiedades${cluster.condominiumName ? ` en ${cluster.condominiumName}` : ''}`
              : cluster.properties[0]?.title || cluster.properties[0]?.unitNumber
            }
          />
        ))}

        {/* Cluster InfoWindow - Scrollable list of all properties at same location */}
        {showInfoWindow && selectedCluster && selectedCluster.properties.length > 1 && (
          <InfoWindow
            position={{
              lat: selectedCluster.lat,
              lng: selectedCluster.lng,
            }}
            onCloseClick={() => setSelectedCluster(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -20),
              maxWidth: 300,
            }}
          >
            <div style={{ width: '270px', maxHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              {/* Header with count */}
              <div className="flex items-center gap-2 px-3 py-2 border-b bg-indigo-50 rounded-t">
                <Building2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {selectedCluster.condominiumName || selectedCluster.properties[0]?.condominiumName || selectedCluster.properties[0]?.zone || "Ubicación"}
                  </h3>
                </div>
                <Badge className="text-xs px-2 py-0.5 bg-indigo-600 text-white">
                  {selectedCluster.properties.length} {language === "es" ? "unidades" : "units"}
                </Badge>
              </div>
              
              {/* Scrollable property list */}
              <div 
                className="overflow-y-auto" 
                style={{ 
                  maxHeight: '320px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#6366f1 #f1f5f9'
                }}
              >
                <div className="p-2 space-y-1.5">
                  {selectedCluster.properties.map((property, index) => (
                    <Link 
                      key={property.id} 
                      href={getPropertyLink(property)}
                      data-testid={`cluster-property-${property.id}`}
                    >
                      <div
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                      >
                        {/* Property number indicator */}
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {property.propertyType || 'Unidad'} {property.unitNumber}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {property.bedrooms !== undefined && (
                              <span className="flex items-center gap-0.5">
                                <Bed className="h-3 w-3" />{property.bedrooms}
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="h-3 w-3" />{property.bathrooms}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatPrice(property.price, property.currency)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Footer scroll indicator */}
              {selectedCluster.properties.length > 5 && (
                <div className="px-3 py-1.5 border-t bg-gray-50 text-center rounded-b">
                  <span className="text-[11px] text-gray-500">
                    ↓ {language === "es" ? "Desliza para ver más" : "Scroll to see more"}
                  </span>
                </div>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Single property InfoWindow - Compact design */}
        {showInfoWindow && selectedProperty && (
          <InfoWindow
            position={{
              lat: Number(selectedProperty.latitude),
              lng: Number(selectedProperty.longitude),
            }}
            onCloseClick={() => setSelectedProperty(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -40),
              maxWidth: 260,
            }}
          >
            <Link href={getPropertyLink(selectedProperty)} data-testid={`link-property-${selectedProperty.id}`}>
              <div className="cursor-pointer hover:opacity-90 transition-opacity" style={{ width: '240px' }}>
                {selectedProperty.primaryImages && selectedProperty.primaryImages[0] && (
                  <div className="rounded-t overflow-hidden">
                    <img
                      src={selectedProperty.primaryImages[0]}
                      alt={selectedProperty.title || selectedProperty.unitNumber}
                      className="w-full h-28 object-cover"
                    />
                  </div>
                )}
                
                <div className="p-2 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                      {selectedProperty.title || `${selectedProperty.propertyType || 'Unidad'} ${selectedProperty.unitNumber}`}
                    </h3>
                    {selectedProperty.listingType && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                        {getListingTypeLabel(selectedProperty.listingType)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {selectedProperty.bedrooms !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Bed className="h-3 w-3" />
                          {selectedProperty.bedrooms}
                        </span>
                      )}
                      {selectedProperty.bathrooms && (
                        <span className="flex items-center gap-0.5">
                          <Bath className="h-3 w-3" />
                          {selectedProperty.bathrooms}
                        </span>
                      )}
                      {selectedProperty.area && (
                        <span className="flex items-center gap-0.5">
                          <Square className="h-3 w-3" />
                          {selectedProperty.area}m²
                        </span>
                      )}
                    </div>
                    {selectedProperty.price && (
                      <span className="text-sm font-semibold text-indigo-600">
                        {formatPrice(selectedProperty.price, selectedProperty.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
