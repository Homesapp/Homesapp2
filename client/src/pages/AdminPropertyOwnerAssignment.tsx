import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Home, ArrowRightLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  approvalStatus: string;
  active: boolean;
  published: boolean;
}

interface OwnershipStat {
  ownerId: string;
  ownerEmail: string;
  propertyCount: number;
}

export default function AdminPropertyOwnerAssignment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [targetOwnerId, setTargetOwnerId] = useState<string>("");

  // Fetch property owners
  const { data: owners = [], isLoading: loadingOwners } = useQuery<User[]>({
    queryKey: ["/api/admin/property-owners"],
  });

  // Fetch ownership statistics
  const { data: stats = [], isLoading: loadingStats } = useQuery<OwnershipStat[]>({
    queryKey: ["/api/admin/property-ownership-stats"],
  });

  // Fetch properties by owner
  const { data: properties = [], isLoading: loadingProperties } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties/by-owner", selectedOwnerId],
    enabled: !!selectedOwnerId,
  });

  // Reassign single property mutation
  const reassignPropertyMutation = useMutation({
    mutationFn: async ({ propertyId, newOwnerId }: { propertyId: string; newOwnerId: string }) => {
      return apiRequest("PATCH", `/api/admin/properties/${propertyId}/reassign-owner`, { newOwnerId });
    },
    onSuccess: () => {
      toast({
        title: "Propiedad reasignada",
        description: "La propiedad ha sido reasignada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/property-ownership-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/by-owner"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al reasignar",
        description: error.message || "No se pudo reasignar la propiedad",
        variant: "destructive",
      });
    },
  });

  // Reassign multiple properties mutation
  const reassignMultipleMutation = useMutation({
    mutationFn: async ({ propertyIds, newOwnerId }: { propertyIds: string[]; newOwnerId: string }) => {
      return apiRequest("POST", "/api/admin/properties/reassign-multiple", { propertyIds, newOwnerId });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Propiedades reasignadas",
        description: `${data.count} propiedades han sido reasignadas exitosamente`,
      });
      setSelectedProperties(new Set());
      setTargetOwnerId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/property-ownership-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/by-owner"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al reasignar",
        description: error.message || "No se pudieron reasignar las propiedades",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(new Set(properties.map(p => p.id)));
    } else {
      setSelectedProperties(new Set());
    }
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    const newSelected = new Set(selectedProperties);
    if (checked) {
      newSelected.add(propertyId);
    } else {
      newSelected.delete(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleReassignSelected = () => {
    if (selectedProperties.size === 0) {
      toast({
        title: "Seleccione propiedades",
        description: "Debe seleccionar al menos una propiedad para reasignar",
        variant: "destructive",
      });
      return;
    }

    if (!targetOwnerId) {
      toast({
        title: "Seleccione propietario",
        description: "Debe seleccionar el propietario destino",
        variant: "destructive",
      });
      return;
    }

    reassignMultipleMutation.mutate({
      propertyIds: Array.from(selectedProperties),
      newOwnerId: targetOwnerId,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-owner-assignment">
          Gestión de Propietarios
        </h1>
        <p className="text-muted-foreground mt-2">
          Asigna y reasigna propiedades a sus propietarios
        </p>
      </div>

      {/* Ownership Statistics */}
      <Card data-testid="card-ownership-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estadísticas de Propiedades por Propietario
          </CardTitle>
          <CardDescription>
            Distribución actual de propiedades entre propietarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay estadísticas disponibles
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {stats.map((stat) => (
                <div
                  key={stat.ownerId}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`stat-owner-${stat.ownerId}`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{stat.ownerEmail}</p>
                      <p className="text-sm text-muted-foreground">ID: {stat.ownerId}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-count-${stat.ownerId}`}>
                    {stat.propertyCount} {stat.propertyCount === 1 ? 'propiedad' : 'propiedades'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Property Reassignment Interface */}
      <Card data-testid="card-reassignment">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Reasignar Propiedades
          </CardTitle>
          <CardDescription>
            Selecciona un propietario para ver y reasignar sus propiedades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Owner Selection */}
          <div className="space-y-2">
            <Label>Propietario Actual</Label>
            <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
              <SelectTrigger data-testid="select-current-owner">
                <SelectValue placeholder="Seleccione un propietario" />
              </SelectTrigger>
              <SelectContent>
                {loadingOwners ? (
                  <SelectItem value="loading" disabled>
                    Cargando...
                  </SelectItem>
                ) : (
                  owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.email} ({owner.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Properties Table */}
          {selectedOwnerId && (
            <>
              <div className="space-y-2">
                <Label>Propiedades del Propietario</Label>
                {loadingProperties ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : properties.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este propietario no tiene propiedades asignadas
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedProperties.size === properties.length && properties.length > 0}
                              onCheckedChange={handleSelectAll}
                              data-testid="checkbox-select-all"
                            />
                          </TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow key={property.id} data-testid={`row-property-${property.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedProperties.has(property.id)}
                                onCheckedChange={(checked) => handleSelectProperty(property.id, checked as boolean)}
                                data-testid={`checkbox-property-${property.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{property.title}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {property.address}, {property.city}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Badge variant={property.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                                  {property.approvalStatus}
                                </Badge>
                                {property.active && <Badge variant="outline">Activa</Badge>}
                                {property.published && <Badge variant="outline">Publicada</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Reassignment Controls */}
              {properties.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nuevo Propietario</Label>
                      <Select value={targetOwnerId} onValueChange={setTargetOwnerId}>
                        <SelectTrigger data-testid="select-target-owner">
                          <SelectValue placeholder="Seleccione el nuevo propietario" />
                        </SelectTrigger>
                        <SelectContent>
                          {owners
                            .filter((owner) => owner.id !== selectedOwnerId)
                            .map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.email} ({owner.role})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Nota:</strong> Al reasignar propiedades, el nuevo propietario tendrá
                        acceso completo para gestionarlas desde su cuenta.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleReassignSelected}
                        disabled={selectedProperties.size === 0 || !targetOwnerId || reassignMultipleMutation.isPending}
                        data-testid="button-reassign"
                      >
                        {reassignMultipleMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Reasignando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Reasignar {selectedProperties.size} {selectedProperties.size === 1 ? 'Propiedad' : 'Propiedades'}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProperties(new Set());
                          setTargetOwnerId("");
                        }}
                        disabled={reassignMultipleMutation.isPending}
                        data-testid="button-clear-selection"
                      >
                        Limpiar Selección
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
