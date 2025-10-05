import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Bed, Bath, Square, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import type { Property } from "@shared/schema";

const approvalStatusLabels: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const approvalStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const approvalStatusIcons: Record<string, typeof Clock> = {
  draft: AlertCircle,
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function MyProperties() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/owner/properties"],
  });

  const handlePropertyClick = (propertyId: string) => {
    setLocation(`/owner/property/${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Mis Propiedades</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y administra tus propiedades
          </p>
        </div>
        <Button 
          onClick={() => setLocation("/owner/property/new")}
          data-testid="button-add-property"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propiedad
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes propiedades</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera propiedad para gestionar y administrar.
            </p>
            <Button onClick={() => setLocation("/owner/property/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Propiedad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const StatusIcon = approvalStatusIcons[property.approvalStatus || "draft"];
            
            return (
              <Card
                key={property.id}
                className="overflow-hidden hover-elevate cursor-pointer"
                onClick={() => handlePropertyClick(property.id)}
                data-testid={`card-property-${property.id}`}
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={approvalStatusColors[property.approvalStatus || "draft"]}
                      className="gap-1"
                    >
                      <StatusIcon className="h-3 w-3" />
                      {approvalStatusLabels[property.approvalStatus || "draft"]}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="space-y-2">
                  <CardTitle className="line-clamp-1" data-testid={`text-property-title-${property.id}`}>
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <DollarSign className="h-5 w-5" />
                    <span data-testid={`text-property-price-${property.id}`}>
                      ${Number(property.price).toLocaleString()}
                    </span>
                    {(property.status === "rent" || property.status === "both") && (
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span>{property.area}m²</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePropertyClick(property.id);
                    }}
                    data-testid={`button-view-property-${property.id}`}
                  >
                    Ver Detalles
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
