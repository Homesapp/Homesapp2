import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, Bed, Bath, DollarSign, MapPin, Share2, Save } from "lucide-react";

export type ClientPresentationCardProps = {
  id: string;
  clientName: string;
  propertyType: string;
  modality: "rent" | "sale" | "both";
  minPrice: number;
  maxPrice: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  matchCount?: number;
  onSave?: () => void;
  onShare?: () => void;
  onViewMatches?: () => void;
};

export function ClientPresentationCard({
  clientName,
  propertyType,
  modality,
  minPrice,
  maxPrice,
  location,
  bedrooms,
  bathrooms,
  amenities,
  matchCount,
  onSave,
  onShare,
  onViewMatches,
}: ClientPresentationCardProps) {
  const modalityLabels = {
    rent: "Renta",
    sale: "Venta",
    both: "Renta o Venta",
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{clientName}</h3>
          <p className="text-sm text-muted-foreground">Tarjeta de Presentación</p>
        </div>
        {matchCount !== undefined && (
          <Badge variant="default">
            {matchCount} {matchCount === 1 ? "coincidencia" : "coincidencias"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{propertyType}</span>
            <span className="text-muted-foreground">•</span>
            <span>{modalityLabels[modality]}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} MXN
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
          </div>

          {(bedrooms || bathrooms) && (
            <div className="flex items-center gap-4 text-sm">
              {bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>{bedrooms}+ recámaras</span>
                </div>
              )}
              {bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>{bathrooms}+ baños</span>
                </div>
              )}
            </div>
          )}
        </div>

        {amenities && amenities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Amenidades:</p>
            <div className="flex flex-wrap gap-1">
              {amenities.map((amenity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        {onSave && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSave}
            data-testid="button-save-card"
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        )}
        {onShare && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShare}
            data-testid="button-share-card"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Compartir
          </Button>
        )}
        {onViewMatches && matchCount !== undefined && matchCount > 0 && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onViewMatches}
            data-testid="button-view-matches"
          >
            Ver Coincidencias
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
