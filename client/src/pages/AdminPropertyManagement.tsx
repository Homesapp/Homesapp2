import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, FileText, Search, Filter, Home, Building2, MapPin, Bed, Bath, DollarSign, Eye, CheckSquare, XSquare, MoreVertical, Key, User, Lock, Copy, Shield, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type AccessInfo = 
  | {
      accessType: "unattended";
      method: "lockbox" | "smart_lock";
      lockboxCode?: string;
      lockboxLocation?: string;
      smartLockInstructions?: string;
      smartLockProvider?: string;
    }
  | {
      accessType: "attended";
      contactPerson: string;
      contactPhone: string;
      contactNotes?: string;
    };

type Property = {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  area: string | null;
  location: string;
  approvalStatus: string;
  published: boolean;
  featured: boolean;
  images: string[];
  primaryImages: string[];
  ownerId: string;
  accessInfo?: AccessInfo;
  createdAt: string;
  updatedAt: string;
};

type PropertyStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  inspectionScheduled: number;
  inspectionCompleted: number;
  published: number;
  featured: number;
};

const scheduleInspectionSchema = z.object({
  inspectorId: z.string().min(1, "Debes seleccionar un conserje"),
  inspectionDate: z.string().min(1, "Debes seleccionar una fecha"),
});

export default function AdminPropertyManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [scheduleInspectionProperty, setScheduleInspectionProperty] = useState<Property | null>(null);

  // Schedule inspection form
  const scheduleForm = useForm<z.infer<typeof scheduleInspectionSchema>>({
    resolver: zodResolver(scheduleInspectionSchema),
    defaultValues: {
      inspectorId: "",
      inspectionDate: "",
    },
  });

  const handleScheduleInspection = (values: z.infer<typeof scheduleInspectionSchema>) => {
    if (!scheduleInspectionProperty) return;
    
    scheduleInspectionMutation.mutate({
      propertyId: scheduleInspectionProperty.id,
      inspectorId: values.inspectorId,
      inspectionDate: values.inspectionDate,
    });
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (scheduleInspectionProperty) {
      scheduleForm.reset({
        inspectorId: "",
        inspectionDate: "",
      });
    }
  }, [scheduleInspectionProperty]);

  // Fetch appointments for selected property
  const { data: propertyAppointments = [] } = useQuery({
    queryKey: ["/api/appointments", detailProperty?.id],
    queryFn: async () => {
      if (!detailProperty?.id) return [];
      const response = await fetch(`/api/appointments?propertyId=${detailProperty.id}`);
      return response.json();
    },
    enabled: !!detailProperty?.id,
  });

  // Filter confirmed appointments with concierges
  const authorizedConcierges = propertyAppointments
    .filter((apt: any) => apt.status === "confirmed" && apt.concierge)
    .map((apt: any) => apt.concierge)
    .filter((concierge: any, index: number, self: any[]) => 
      // Remove duplicates
      self.findIndex((c: any) => c.id === concierge.id) === index
    );

  // Fetch all providers (maintenance/service personnel with general access)
  const { data: allProviders = [] } = useQuery<any[]>({
    queryKey: ["/api", "users", "role", "provider"],
    enabled: !!detailProperty?.id,
  });

  // Fetch all concierges for inspection scheduling
  const { data: allConcierges = [] } = useQuery<any[]>({
    queryKey: ["/api", "users", "role", "concierge"],
    enabled: !!scheduleInspectionProperty,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<PropertyStats>({
    queryKey: ["/api/admin/properties/stats"],
  });

  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties", selectedStatus, selectedType, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("approvalStatus", selectedStatus);
      if (selectedType !== "all") params.append("propertyType", selectedType);
      if (searchQuery) params.append("q", searchQuery);
      return fetch(`/api/admin/properties?${params}`).then(r => r.json());
    },
  });

  // Accept property mutation (draft/pending_review → accepted)
  const acceptMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("POST", `/api/properties/${propertyId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad aceptada", description: "La propiedad ha sido aceptada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo aceptar la propiedad", variant: "destructive" });
    },
  });

  // Validate documents mutation (accepted → documents_validated)
  const validateDocumentsMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("POST", `/api/properties/${propertyId}/validate-documents`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Documentos validados", description: "Los documentos han sido validados" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron validar los documentos", variant: "destructive" });
    },
  });

  // Approve without inspection mutation (documents_validated → approved)
  const approveWithoutInspectionMutation = useMutation({
    mutationFn: (data: { propertyId: string; reason?: string }) =>
      apiRequest("POST", `/api/properties/${data.propertyId}/approve-without-inspection`, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad aprobada", description: "La propiedad ha sido aprobada sin inspección" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo aprobar la propiedad", variant: "destructive" });
    },
  });

  // Approve property mutation (inspection_completed → approved)
  const approveMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("POST", `/api/properties/${propertyId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad aprobada", description: "La propiedad ha sido aprobada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo aprobar la propiedad", variant: "destructive" });
    },
  });

  // Publish property mutation (approved → published)
  const publishMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("POST", `/api/properties/${propertyId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad publicada", description: "La propiedad ha sido publicada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo publicar la propiedad", variant: "destructive" });
    },
  });

  // Schedule inspection mutation (documents_validated → inspection_scheduled)
  const scheduleInspectionMutation = useMutation({
    mutationFn: (data: { propertyId: string; inspectorId: string; inspectionDate: string }) =>
      apiRequest("POST", `/api/properties/${data.propertyId}/schedule-inspection`, { 
        inspectorId: data.inspectorId, 
        inspectionDate: data.inspectionDate 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      setScheduleInspectionProperty(null);
      toast({ title: "Inspección programada", description: "La inspección ha sido programada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo programar la inspección", variant: "destructive" });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiRequest("PATCH", `/api/admin/properties/${propertyId}/reject`, { notes: "Rechazada desde panel de administración" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      toast({ title: "Propiedad rechazada", description: "La propiedad ha sido rechazada" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo rechazar la propiedad", variant: "destructive" });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (propertyIds: string[]) =>
      apiRequest("PATCH", "/api/admin/properties/bulk-approve", { propertyIds, publish: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      setSelectedProperties([]);
      toast({ title: "Propiedades aprobadas", description: `${selectedProperties.length} propiedades aprobadas` });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al aprobar propiedades en masa", variant: "destructive" });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: (propertyIds: string[]) =>
      apiRequest("PATCH", "/api/admin/properties/bulk-reject", { propertyIds, notes: "Rechazadas desde panel de administración" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties/stats"] });
      setSelectedProperties([]);
      toast({ title: "Propiedades rechazadas", description: `${selectedProperties.length} propiedades rechazadas` });
    },
    onError: () => {
      toast({ title: "Error", description: "Error al rechazar propiedades en masa", variant: "destructive" });
    },
  });

  const handleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; variant: any; label: string }> = {
      draft: { icon: FileText, variant: "secondary", label: "Borrador" },
      pending_review: { icon: Clock, variant: "outline", label: "Pendiente" },
      changes_requested: { icon: Clock, variant: "outline", label: "Cambios Solicitados" },
      accepted: { icon: CheckCircle2, variant: "outline", label: "Aceptada" },
      documents_validated: { icon: CheckCircle2, variant: "default", label: "Docs Validados" },
      inspection_scheduled: { icon: Clock, variant: "outline", label: "Inspección Programada" },
      inspection_completed: { icon: CheckCircle2, variant: "outline", label: "Inspección Completa" },
      approved: { icon: CheckCircle2, variant: "default", label: "Aprobada" },
      published: { icon: Eye, variant: "default", label: "Publicada" },
      rejected: { icon: XCircle, variant: "destructive", label: "Rechazada" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      house: Home,
      apartment: Building2,
      land: MapPin,
    };
    return icons[type] || Home;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestión de Propiedades</h1>
        <p className="text-muted-foreground">Administra y aprueba propiedades del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats?.pending || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats?.approved || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
                <Eye className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats?.published || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-properties"
                  placeholder="Título, ubicación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de Aprobación</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="select-approval-status">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending_review">Pendiente</SelectItem>
                  <SelectItem value="changes_requested">Cambios Solicitados</SelectItem>
                  <SelectItem value="accepted">Aceptada</SelectItem>
                  <SelectItem value="documents_validated">Docs Validados</SelectItem>
                  <SelectItem value="inspection_scheduled">Inspección Programada</SelectItem>
                  <SelectItem value="inspection_completed">Inspección Completa</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Propiedad</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-property-type">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="house">Casa</SelectItem>
                  <SelectItem value="apartment">Departamento</SelectItem>
                  <SelectItem value="land">Terreno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  data-testid="checkbox-select-all"
                  checked={selectedProperties.length === properties.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">{selectedProperties.length} propiedades seleccionadas</span>
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-bulk-approve"
                  size="sm"
                  onClick={() => bulkApproveMutation.mutate(selectedProperties)}
                  disabled={bulkApproveMutation.isPending}
                  className="gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Aprobar Seleccionadas
                </Button>
                <Button
                  data-testid="button-bulk-reject"
                  size="sm"
                  variant="destructive"
                  onClick={() => bulkRejectMutation.mutate(selectedProperties)}
                  disabled={bulkRejectMutation.isPending}
                  className="gap-2"
                >
                  <XSquare className="w-4 h-4" />
                  Rechazar Seleccionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades ({properties.length})</CardTitle>
          <CardDescription>Lista de todas las propiedades en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {propertiesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-32 h-24 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No hay propiedades</h3>
              <p className="text-muted-foreground">No se encontraron propiedades con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property) => {
                const TypeIcon = getPropertyTypeIcon(property.propertyType);
                const coverImage = property.primaryImages?.[0] || property.images?.[0];

                return (
                  <div
                    key={property.id}
                    className="flex gap-4 p-4 border rounded-lg hover-elevate transition-all"
                    data-testid={`property-card-${property.id}`}
                  >
                    <Checkbox
                      data-testid={`checkbox-property-${property.id}`}
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={() => handleSelectProperty(property.id)}
                    />

                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={property.title}
                        className="w-32 h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-muted rounded-md flex items-center justify-center">
                        <TypeIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate" data-testid={`text-property-title-${property.id}`}>
                            {property.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{property.description}</p>
                        </div>
                        <div className="flex gap-2 items-start">
                          {getStatusBadge(property.approvalStatus)}
                          {property.published && (
                            <Badge variant="outline" className="gap-1">
                              <Eye className="w-3 h-3" />
                              Publicada
                            </Badge>
                          )}
                          {property.featured && (
                            <Badge variant="default">Destacada</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <TypeIcon className="w-4 h-4" />
                          <span className="capitalize">{property.propertyType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{property.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{property.bedrooms} hab.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms} baños</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${parseFloat(property.price).toLocaleString()} MXN</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              data-testid={`button-view-details-${property.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailProperty(property)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{detailProperty?.title}</DialogTitle>
                              <DialogDescription>{detailProperty?.location}</DialogDescription>
                            </DialogHeader>
                            {detailProperty && (
                              <div className="space-y-4">
                                {detailProperty.primaryImages?.[0] && (
                                  <img
                                    src={detailProperty.primaryImages[0]}
                                    alt={detailProperty.title}
                                    className="w-full h-64 object-cover rounded-lg"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                                    <p className="capitalize">{detailProperty.propertyType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Precio</label>
                                    <p>${parseFloat(detailProperty.price).toLocaleString()} MXN</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Habitaciones</label>
                                    <p>{detailProperty.bedrooms}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Baños</label>
                                    <p>{detailProperty.bathrooms}</p>
                                  </div>
                                  {detailProperty.area && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Área</label>
                                      <p>{detailProperty.area} m²</p>
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                                    <div className="mt-1">{getStatusBadge(detailProperty.approvalStatus)}</div>
                                  </div>
                                </div>
                                {detailProperty.description && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                                    <p className="mt-1 whitespace-pre-wrap">{detailProperty.description}</p>
                                  </div>
                                )}

                                {/* Access Information Section */}
                                {detailProperty.accessInfo && (
                                  <Card className="border-primary/20">
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-base">
                                        <Shield className="w-4 h-4" />
                                        Información de Acceso (Confidencial)
                                      </CardTitle>
                                      <CardDescription className="text-xs">
                                        Esta información es privada y solo debe compartirse con personal autorizado para citas confirmadas
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {detailProperty.accessInfo.accessType === "unattended" ? (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <Key className="w-4 h-4 mt-1 text-primary" />
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">Acceso Desatendido</div>
                                              <div className="text-sm text-muted-foreground capitalize">
                                                {detailProperty.accessInfo.method === "lockbox" ? "Lockbox con clave única" : "Cerradura inteligente con clave variable"}
                                              </div>
                                            </div>
                                          </div>

                                          {detailProperty.accessInfo.method === "lockbox" && (
                                            <>
                                              {detailProperty.accessInfo.lockboxCode && (
                                                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                  <div>
                                                    <div className="text-xs text-muted-foreground">Código de Lockbox</div>
                                                    <div className="font-mono text-sm font-semibold">{detailProperty.accessInfo.lockboxCode}</div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "unattended" ? detailProperty.accessInfo!.lockboxCode || "" : "");
                                                      toast({ title: "Copiado", description: "Código copiado al portapapeles" });
                                                    }}
                                                    data-testid="button-copy-lockbox-code"
                                                  >
                                                    <Copy className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              )}
                                              {detailProperty.accessInfo.lockboxLocation && (
                                                <div className="text-sm">
                                                  <span className="text-muted-foreground">Ubicación: </span>
                                                  {detailProperty.accessInfo.lockboxLocation}
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {detailProperty.accessInfo.method === "smart_lock" && (
                                            <>
                                              {detailProperty.accessInfo.smartLockProvider && (
                                                <div className="text-sm">
                                                  <span className="text-muted-foreground">Proveedor: </span>
                                                  {detailProperty.accessInfo.smartLockProvider}
                                                </div>
                                              )}
                                              {detailProperty.accessInfo.smartLockInstructions && (
                                                <div className="p-2 bg-muted rounded-md">
                                                  <div className="text-xs text-muted-foreground mb-1">Instrucciones para generar clave:</div>
                                                  <div className="text-sm whitespace-pre-wrap">{detailProperty.accessInfo.smartLockInstructions}</div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 mt-1 text-primary" />
                                            <div className="flex-1">
                                              <div className="text-sm font-medium">Acceso Asistido</div>
                                              <div className="text-sm text-muted-foreground">Alguien abrirá la propiedad</div>
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                              <div>
                                                <div className="text-xs text-muted-foreground">Contacto</div>
                                                <div className="text-sm font-semibold">{detailProperty.accessInfo.contactPerson}</div>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "attended" ? detailProperty.accessInfo!.contactPerson : "");
                                                  toast({ title: "Copiado", description: "Nombre copiado al portapapeles" });
                                                }}
                                                data-testid="button-copy-contact-person"
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>
                                            </div>

                                            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                                              <div>
                                                <div className="text-xs text-muted-foreground">Teléfono</div>
                                                <div className="text-sm font-semibold">{detailProperty.accessInfo.contactPhone}</div>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(detailProperty.accessInfo!.accessType === "attended" ? detailProperty.accessInfo!.contactPhone : "");
                                                  toast({ title: "Copiado", description: "Teléfono copiado al portapapeles" });
                                                }}
                                                data-testid="button-copy-contact-phone"
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>
                                            </div>

                                            {detailProperty.accessInfo.contactNotes && (
                                              <div className="p-2 bg-muted rounded-md">
                                                <div className="text-xs text-muted-foreground mb-1">Notas adicionales:</div>
                                                <div className="text-sm whitespace-pre-wrap">{detailProperty.accessInfo.contactNotes}</div>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Authorized Personnel Section */}
                                {detailProperty.accessInfo && (authorizedConcierges.length > 0 || allProviders.length > 0) && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="w-4 h-4" />
                                        Personal Autorizado con Acceso
                                      </CardTitle>
                                      <CardDescription className="text-xs">
                                        Personal que puede acceder a las credenciales de la propiedad
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {/* Concierges Section */}
                                      {authorizedConcierges.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Conserjes (con citas confirmadas)</h4>
                                          <div className="space-y-2">
                                            {authorizedConcierges.map((concierge: any) => (
                                              <div key={concierge.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div>
                                                  <div className="text-sm font-semibold">
                                                    {concierge.firstName} {concierge.lastName}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">{concierge.email}</div>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(concierge.email);
                                                    toast({ title: "Copiado", description: "Email copiado al portapapeles" });
                                                  }}
                                                  data-testid={`button-copy-concierge-${concierge.id}`}
                                                >
                                                  <Copy className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Providers Section */}
                                      {allProviders.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Personal de Servicio / Mantenimiento (acceso general)</h4>
                                          <div className="space-y-2">
                                            {allProviders.map((provider: any) => (
                                              <div key={provider.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div>
                                                  <div className="text-sm font-semibold">
                                                    {provider.firstName} {provider.lastName}
                                                  </div>
                                                  <div className="text-xs text-muted-foreground">{provider.email}</div>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(provider.email);
                                                    toast({ title: "Copiado", description: "Email copiado al portapapeles" });
                                                  }}
                                                  data-testid={`button-copy-provider-${provider.id}`}
                                                >
                                                  <Copy className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Action buttons based on approval status */}
                        {(property.approvalStatus === "draft" || property.approvalStatus === "pending_review" || property.approvalStatus === "changes_requested") && (
                          <Button
                            data-testid={`button-accept-${property.id}`}
                            size="sm"
                            onClick={() => acceptMutation.mutate(property.id)}
                            disabled={acceptMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aceptar
                          </Button>
                        )}
                        
                        {property.approvalStatus === "accepted" && (
                          <Button
                            data-testid={`button-validate-documents-${property.id}`}
                            size="sm"
                            onClick={() => validateDocumentsMutation.mutate(property.id)}
                            disabled={validateDocumentsMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Validar Documentos
                          </Button>
                        )}
                        
                        {property.approvalStatus === "documents_validated" && (
                          <>
                            <Button
                              data-testid={`button-schedule-inspection-${property.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setScheduleInspectionProperty(property);
                                scheduleForm.reset();
                              }}
                              className="gap-2"
                            >
                              <Clock className="w-4 h-4" />
                              Programar Inspección
                            </Button>
                            <Button
                              data-testid={`button-approve-without-inspection-${property.id}`}
                              size="sm"
                              onClick={() => approveWithoutInspectionMutation.mutate({ propertyId: property.id, reason: "Propiedad de confianza" })}
                              disabled={approveWithoutInspectionMutation.isPending}
                              className="gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprobar sin Inspección
                            </Button>
                          </>
                        )}
                        
                        {property.approvalStatus === "inspection_completed" && (
                          <Button
                            data-testid={`button-approve-${property.id}`}
                            size="sm"
                            onClick={() => approveMutation.mutate(property.id)}
                            disabled={approveMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Aprobar
                          </Button>
                        )}
                        
                        {property.approvalStatus === "approved" && (
                          <Button
                            data-testid={`button-publish-${property.id}`}
                            size="sm"
                            onClick={() => publishMutation.mutate(property.id)}
                            disabled={publishMutation.isPending}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Publicar
                          </Button>
                        )}
                        
                        {/* Reject button - available for most states except published */}
                        {property.approvalStatus !== "published" && property.approvalStatus !== "rejected" && (
                          <Button
                            data-testid={`button-reject-${property.id}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(property.id)}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Inspection Dialog */}
      <Dialog open={!!scheduleInspectionProperty} onOpenChange={(open) => !open && setScheduleInspectionProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Inspección</DialogTitle>
            <DialogDescription>
              {scheduleInspectionProperty?.title}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...scheduleForm}>
            <form onSubmit={scheduleForm.handleSubmit(handleScheduleInspection)} className="space-y-4">
              <FormField
                control={scheduleForm.control}
                name="inspectorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conserje Inspector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-inspector">
                          <SelectValue placeholder="Selecciona un conserje" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allConcierges.map((concierge: any) => (
                          <SelectItem key={concierge.id} value={concierge.id}>
                            {concierge.firstName} {concierge.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={scheduleForm.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha y Hora de Inspección</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        data-testid="input-inspection-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleInspectionProperty(null)}
                  data-testid="button-cancel-schedule"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={scheduleInspectionMutation.isPending}
                  data-testid="button-confirm-schedule"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
