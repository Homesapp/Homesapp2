import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileSignature,
  Home,
  Calendar,
  DollarSign,
  User,
  Building,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  sellerId: string;
  status: "draft" | "apartado" | "firmado" | "check_in" | "activo" | "completado" | "cancelado";
  monthlyRent: string;
  leaseDurationMonths: number;
  depositAmount: string;
  administrativeFee: string;
  isForSublease: boolean;
  totalCommissionMonths: string;
  totalCommissionAmount: string;
  sellerCommissionPercent: string;
  referralCommissionPercent: string;
  homesappCommissionPercent: string;
  sellerCommissionAmount: string;
  referralCommissionAmount: string;
  homesappCommissionAmount: string;
  apartadoDate: string | null;
  contractSignedDate: string | null;
  checkInDate: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  payoutReleasedAt: string | null;
  ownerTermsSignedAt: string | null;
  tenantTermsSignedAt: string | null;
  createdAt: string;
  // Relations
  property?: { title: string; address: string };
  tenant?: { fullName: string; email: string };
  owner?: { fullName: string; email: string };
  seller?: { fullName: string; email: string };
}

export default function AdminContractManagement() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: contracts, isLoading } = useQuery<RentalContract[]>({
    queryKey: [`/api/admin/rental-contracts${statusFilter && statusFilter !== "all" ? `?status=${statusFilter}` : ""}`, statusFilter],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Borrador", color: "bg-gray-100 dark:bg-gray-800" },
      apartado: { variant: "outline" as const, label: "Apartado", color: "bg-blue-100 dark:bg-blue-950" },
      firmado: { variant: "outline" as const, label: "Firmado", color: "bg-purple-100 dark:bg-purple-950" },
      check_in: { variant: "outline" as const, label: "Check-in", color: "bg-indigo-100 dark:bg-indigo-950" },
      activo: { variant: "outline" as const, label: "Activo", color: "bg-green-100 dark:bg-green-950" },
      completado: { variant: "outline" as const, label: "Completado", color: "bg-emerald-100 dark:bg-emerald-950" },
      cancelado: { variant: "outline" as const, label: "Cancelado", color: "bg-red-100 dark:bg-red-950" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getProgressPercentage = (status: string) => {
    const progress = {
      draft: 10,
      apartado: 30,
      firmado: 50,
      check_in: 70,
      activo: 85,
      completado: 100,
      cancelado: 0,
    };
    return progress[status as keyof typeof progress] || 0;
  };

  const filteredContracts = contracts?.filter((contract) => {
    const matchesSearch = 
      (contract.property?.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.tenant?.fullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.owner?.fullName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openContractDetail = (contract: RentalContract) => {
    setSelectedContract(contract);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                Gestión de Contratos
              </h1>
              <p className="text-muted-foreground mt-1">
                Administra el ciclo de vida de los contratos de renta
              </p>
            </div>
            <Button data-testid="button-export-contracts">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por propiedad, inquilino o propietario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-contracts"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="apartado">Apartado</SelectItem>
                <SelectItem value="firmado">Firmado</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Renta Mensual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts?.map((contract) => (
                    <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.property?.title}</div>
                          <div className="text-sm text-muted-foreground">{contract.property?.address}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.tenant?.fullName}</div>
                          <div className="text-sm text-muted-foreground">{contract.tenant?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.owner?.fullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(parseFloat(contract.monthlyRent), "MXN")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contract.leaseDurationMonths} meses
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={getProgressPercentage(contract.status)} className="w-20" />
                          <span className="text-sm text-muted-foreground">
                            {getProgressPercentage(contract.status)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openContractDetail(contract)}
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Contract Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Contrato</DialogTitle>
            <DialogDescription>
              Información completa del contrato de renta
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Información de la Propiedad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Propiedad</p>
                        <p className="font-medium">{selectedContract.property?.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dirección</p>
                        <p className="font-medium">{selectedContract.property?.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Partes Involucradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Inquilino</p>
                        <p className="font-medium">{selectedContract.tenant?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedContract.tenant?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Propietario</p>
                        <p className="font-medium">{selectedContract.owner?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedContract.owner?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vendedor</p>
                        <p className="font-medium">{selectedContract.seller?.fullName || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Términos Económicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Renta Mensual</p>
                        <p className="font-medium text-lg">
                          {formatCurrency(parseFloat(selectedContract.monthlyRent), "MXN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duración</p>
                        <p className="font-medium text-lg">{selectedContract.leaseDurationMonths} meses</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Depósito</p>
                        <p className="font-medium text-lg">
                          {formatCurrency(parseFloat(selectedContract.depositAmount || "0"), "MXN")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comisiones" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Comisiones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Comisión Total</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(parseFloat(selectedContract.totalCommissionAmount), "MXN")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ({selectedContract.totalCommissionMonths} meses de renta)
                      </p>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Vendedor</p>
                          <p className="text-sm text-muted-foreground">{selectedContract.sellerCommissionPercent}%</p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(parseFloat(selectedContract.sellerCommissionAmount), "MXN")}
                        </p>
                      </div>

                      {parseFloat(selectedContract.referralCommissionPercent || "0") > 0 && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Referido</p>
                            <p className="text-sm text-muted-foreground">{selectedContract.referralCommissionPercent}%</p>
                          </div>
                          <p className="font-medium">
                            {formatCurrency(parseFloat(selectedContract.referralCommissionAmount || "0"), "MXN")}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">HomesApp</p>
                          <p className="text-sm text-muted-foreground">{selectedContract.homesappCommissionPercent}%</p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(parseFloat(selectedContract.homesappCommissionAmount), "MXN")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Línea de Tiempo del Contrato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-1 ${selectedContract.apartadoDate ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Apartado</p>
                          {selectedContract.apartadoDate ? (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedContract.apartadoDate), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Pendiente</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-1 ${selectedContract.contractSignedDate ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          <FileSignature className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Firma de Contrato</p>
                          {selectedContract.contractSignedDate ? (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedContract.contractSignedDate), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Pendiente</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-1 ${selectedContract.checkInDate ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          <Home className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Check-in</p>
                          {selectedContract.checkInDate ? (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedContract.checkInDate), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Pendiente</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`mt-1 rounded-full p-1 ${selectedContract.payoutReleasedAt ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Pago Liberado</p>
                          {selectedContract.payoutReleasedAt ? (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedContract.payoutReleasedAt), "dd 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Pendiente</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
