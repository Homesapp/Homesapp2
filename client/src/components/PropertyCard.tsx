import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square, MapPin, Eye, Edit, Calendar } from "lucide-react";

export type PropertyCardProps = {
  id: string;
  title: string;
  price: number;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  status: "rent" | "sale" | "both";
  image?: string;
  onView?: () => void;
  onEdit?: () => void;
  onSchedule?: () => void;
  showActions?: boolean;
};

export function PropertyCard({
  title,
  price,
  currency = "MXN",
  bedrooms,
  bathrooms,
  area,
  location,
  status,
  image,
  onView,
  onEdit,
  onSchedule,
  showActions = true,
}: PropertyCardProps) {
  const statusLabels = {
    rent: "En Renta",
    sale: "En Venta",
    both: "Renta y Venta",
  };

  const statusVariants = {
    rent: "default" as const,
    sale: "secondary" as const,
    both: "outline" as const,
  };

  return (
    <Card className="overflow-hidden hover-elevate">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Square className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
      </div>
      
      <CardHeader className="gap-1 space-y-0 pb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{location}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-2xl font-bold text-primary">
          ${price.toLocaleString()} {currency}
          {status === "rent" && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span>{bathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4 text-muted-foreground" />
            <span>{area} m²</span>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onView}
            data-testid="button-view-property"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onEdit}
              data-testid="button-edit-property"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
          {onSchedule && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onSchedule}
              data-testid="button-schedule-appointment"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Agendar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
