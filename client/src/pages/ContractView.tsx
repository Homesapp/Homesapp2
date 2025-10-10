import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Home, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type RentalContract = {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  status: string;
  monthlyRent: string;
  leaseDurationMonths: number;
  depositAmount: string;
  administrativeFee: string;
  leaseStartDate: string;
  leaseEndDate: string;
  apartadoDate?: string;
  contractSignedDate?: string;
  checkInDate?: string;
  createdAt: string;
  property?: {
    title: string;
    location: string;
  };
};

type ContractTenantInfo = {
  id: string;
  rentalContractId: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

type ContractOwnerInfo = {
  id: string;
  rentalContractId: string;
  ownerFullName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
};

export default function ContractView() {
  const { contractId } = useParams<{ contractId: string }>();
  const [, setLocation] = useLocation();

  const { data: contract, isLoading } = useQuery<RentalContract & { 
    tenantInfo?: ContractTenantInfo; 
    ownerInfo?: ContractOwnerInfo;
  }>({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      draft: { label: "Borrador", variant: "secondary" },
      apartado: { label: "Apartado", variant: "outline" },
      firmado: { label: "Firmado", variant: "default" },
      check_in: { label: "Check-in", variant: "default" },
      activo: { label: "Activo", variant: "default" },
      completado: { label: "Completado", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const };

    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Contrato no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-contract-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-contract-title">
            Contrato de Renta
          </h1>
          <p className="text-muted-foreground" data-testid="text-contract-id">
            ID: {contract.id}
          </p>
        </div>
        {getStatusBadge(contract.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Information */}
        <Card data-testid="card-property-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Información de Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Propiedad</p>
              <p className="font-medium" data-testid="text-property-title">
                {contract.property?.title || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p data-testid="text-property-location">
                {contract.property?.location || "No especificado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card data-testid="card-financial-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Renta Mensual</p>
              <p className="font-medium text-lg" data-testid="text-monthly-rent">
                ${parseFloat(contract.monthlyRent).toLocaleString('es-MX')} MXN
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Depósito</p>
              <p data-testid="text-deposit">
                ${parseFloat(contract.depositAmount || '0').toLocaleString('es-MX')} MXN
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cuota Administrativa</p>
              <p data-testid="text-admin-fee">
                ${parseFloat(contract.administrativeFee || '0').toLocaleString('es-MX')} MXN
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lease Dates */}
        <Card data-testid="card-lease-dates">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas del Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Duración</p>
              <p data-testid="text-lease-duration">
                {contract.leaseDurationMonths} meses
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inicio del Contrato</p>
              <p data-testid="text-lease-start">
                {contract.leaseStartDate 
                  ? format(new Date(contract.leaseStartDate), "d 'de' MMMM, yyyy", { locale: es })
                  : "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fin del Contrato</p>
              <p data-testid="text-lease-end">
                {contract.leaseEndDate 
                  ? format(new Date(contract.leaseEndDate), "d 'de' MMMM, yyyy", { locale: es })
                  : "No especificado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Progress */}
        <Card data-testid="card-status-progress">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Progreso del Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {contract.tenantInfo ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" data-testid="icon-tenant-complete" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" data-testid="icon-tenant-pending" />
              )}
              <span className={contract.tenantInfo ? "text-green-600" : "text-muted-foreground"}>
                Formato de Inquilino
              </span>
            </div>
            <div className="flex items-center gap-2">
              {contract.ownerInfo ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" data-testid="icon-owner-complete" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" data-testid="icon-owner-pending" />
              )}
              <span className={contract.ownerInfo ? "text-green-600" : "text-muted-foreground"}>
                Formato de Propietario
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!contract.tenantInfo && (
          <Button 
            onClick={() => setLocation(`/contract-tenant-form/${contractId}`)}
            data-testid="button-complete-tenant-form"
          >
            <User className="mr-2 h-4 w-4" />
            Completar Formato de Inquilino
          </Button>
        )}
        {!contract.ownerInfo && (
          <Button 
            onClick={() => setLocation(`/contract-owner-form/${contractId}`)}
            variant="outline"
            data-testid="button-complete-owner-form"
          >
            <Home className="mr-2 h-4 w-4" />
            Completar Formato de Propietario
          </Button>
        )}
      </div>
    </div>
  );
}
