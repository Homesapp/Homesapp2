import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Home, User, Users, ArrowLeft, DollarSign, BedDouble, Bath } from "lucide-react";
import { format } from "date-fns";

interface PropertySummary {
  id: string;
  title: string;
  unitNumber: string | null;
  propertyType: string;
  status: string;
  bedrooms: number;
  bathrooms: string;
  price: string;
  ownerId: string;
  managementId: string | null;
}

interface CondominiumDetails {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
  active: boolean;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  propertiesCount: number;
  properties: PropertySummary[];
}

export default function CondominiumDetails() {
  const [, params] = useRoute("/admin/condominiums/:id");
  const condominiumId = params?.id;

  const { data: condominium, isLoading } = useQuery<CondominiumDetails>({
    queryKey: [`/api/admin/condominiums/${condominiumId}/details`],
    enabled: !!condominiumId,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const getUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "No asignado";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      available: { variant: "default", label: "Disponible" },
      rented: { variant: "default", label: "Rentada" },
      maintenance: { variant: "default", label: "Mantenimiento" },
      reserved: { variant: "default", label: "Reservada" },
      sold: { variant: "destructive", label: "Vendida" },
    };

    const config = statusConfig[status] || { variant: "default", label: status };

    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando detalles del condominio...</div>
        </div>
      </div>
    );
  }

  if (!condominium) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Condominio no encontrado</p>
            <Link href="/admin/condominiums">
              <Button variant="outline" className="mt-4" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Condominios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/condominiums">
          <Button variant="outline" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-condominium-name">
            <Building2 className="w-6 h-6" />
            {condominium.name}
          </h1>
          <p className="text-muted-foreground">
            Detalles del condominio y sus unidades
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm font-medium">Nombre</div>
                <div className="text-sm text-muted-foreground" data-testid="text-condominium-name">
                  {condominium.name}
                </div>
              </div>
            </div>
            
            {condominium.zone && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm font-medium">Zona</div>
                  <div className="text-sm text-muted-foreground" data-testid="text-condominium-zone">
                    {condominium.zone}
                  </div>
                </div>
              </div>
            )}

            {condominium.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm font-medium">Dirección</div>
                  <div className="text-sm text-muted-foreground" data-testid="text-condominium-address">
                    {condominium.address}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm font-medium">Total de Propiedades</div>
                <div className="text-sm text-muted-foreground" data-testid="text-properties-count">
                  {condominium.propertiesCount} {condominium.propertiesCount === 1 ? 'propiedad' : 'propiedades'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm font-medium">Estado</div>
                <div className="flex gap-2 mt-1">
                  {condominium.active ? (
                    <Badge variant="default">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Suspendido</Badge>
                  )}
                  {condominium.approvalStatus === "approved" && (
                    <Badge variant="default">Aprobado</Badge>
                  )}
                  {condominium.approvalStatus === "pending_review" && (
                    <Badge variant="default">Pendiente</Badge>
                  )}
                  {condominium.approvalStatus === "rejected" && (
                    <Badge variant="destructive">Rechazado</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm font-medium">Fechas</div>
                <div className="text-sm text-muted-foreground">
                  Creado: {format(new Date(condominium.createdAt), "dd/MM/yyyy HH:mm")}
                </div>
                <div className="text-sm text-muted-foreground">
                  Actualizado: {format(new Date(condominium.updatedAt), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-total-units">
                  {condominium.propertiesCount}
                </div>
                <div className="text-sm text-muted-foreground">Total Unidades</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-available-units">
                  {condominium.properties.filter(p => p.status === "available").length}
                </div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-rented-units">
                  {condominium.properties.filter(p => p.status === "rented").length}
                </div>
                <div className="text-sm text-muted-foreground">Rentadas</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-maintenance-units">
                  {condominium.properties.filter(p => p.status === "maintenance").length}
                </div>
                <div className="text-sm text-muted-foreground">Mantenimiento</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades del Condominio</CardTitle>
          <CardDescription>
            Lista de todas las propiedades en este condominio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {condominium.properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Home className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-properties">
                No hay propiedades en este condominio
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {condominium.properties.map((property) => (
                <Link key={property.id} href={`/propiedad/${property.id}`}>
                  <Card className="hover-elevate" data-testid={`card-property-${property.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold" data-testid={`text-property-title-${property.id}`}>
                              {property.title}
                            </h3>
                            {property.unitNumber && (
                              <Badge variant="outline" data-testid={`badge-unit-${property.id}`}>
                                Unidad {property.unitNumber}
                              </Badge>
                            )}
                            {getStatusBadge(property.status)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <BedDouble className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`text-bedrooms-${property.id}`}>
                                {property.bedrooms} {property.bedrooms === 1 ? 'recámara' : 'recámaras'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`text-bathrooms-${property.id}`}>
                                {property.bathrooms} {Number(property.bathrooms) === 1 ? 'baño' : 'baños'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span data-testid={`text-price-${property.id}`}>
                                ${parseFloat(property.price).toLocaleString()} MXN
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">{property.propertyType}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Propietario:</span>
                              <span data-testid={`text-owner-${property.id}`}>
                                {getUser(property.ownerId)}
                              </span>
                            </div>
                            {property.managementId && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Encargado:</span>
                                <span data-testid={`text-manager-${property.id}`}>
                                  {getUser(property.managementId)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
