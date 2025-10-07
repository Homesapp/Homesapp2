import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Users, Home, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ClientReferral, OwnerReferral, ReferralConfig } from "@shared/schema";

interface ReferralUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  profileImageUrl?: string | null;
}

interface UserReferrals {
  user: ReferralUser;
  clientReferrals: ClientReferral[];
  ownerReferrals: OwnerReferral[];
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
  switch (status) {
    case "completado":
    case "aprobado":
    case "pagado":
      return "default";
    case "pendiente_confirmacion":
    case "confirmado":
    case "en_revision":
      return "secondary";
    case "rechazado":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    pendiente_confirmacion: "Pendiente Confirmación",
    confirmado: "Confirmado",
    en_revision: "En Revisión",
    completado: "Completado",
    rechazado: "Rechazado",
    aprobado: "Aprobado",
    pagado: "Pagado",
  };
  return labels[status] || status;
};

const configSchema = z.object({
  clientReferralCommissionPercent: z.coerce.number().min(0).max(100),
  ownerReferralCommissionPercent: z.coerce.number().min(0).max(100),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface UserCustomConfigDialogProps {
  user: ReferralUser;
  globalConfig?: ReferralConfig;
}

function UserCustomConfigDialog({ user, globalConfig }: UserCustomConfigDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      clientReferralCommissionPercent: parseFloat((user as any).customClientReferralPercent || globalConfig?.clientReferralCommissionPercent || "5"),
      ownerReferralCommissionPercent: parseFloat((user as any).customOwnerReferralPercent || globalConfig?.ownerReferralCommissionPercent || "10"),
    },
  });

  const updateUserConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      return apiRequest("PATCH", `/api/admin/users/${user.id}/referral-config`, {
        customClientReferralPercent: data.clientReferralCommissionPercent,
        customOwnerReferralPercent: data.ownerReferralCommissionPercent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals/all"] });
      toast({
        title: "Configuración personalizada actualizada",
        description: `Los porcentajes de comisión para ${user.firstName} ${user.lastName} han sido actualizados`,
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const resetToGlobalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/admin/users/${user.id}/referral-config`, {
        customClientReferralPercent: null,
        customOwnerReferralPercent: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals/all"] });
      toast({
        title: "Configuración restablecida",
        description: `${user.firstName} ${user.lastName} ahora usa los valores globales`,
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo restablecer la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateUserConfigMutation.mutate(data);
  };

  const hasCustomConfig = (user as any).customClientReferralPercent || (user as any).customOwnerReferralPercent;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-custom-config-${user.id}`}>
          <Settings className="h-4 w-4 mr-2" />
          {hasCustomConfig ? "Editar personalización" : "Personalizar"}
        </Button>
      </DialogTrigger>
      <DialogContent data-testid={`dialog-user-config-${user.id}`}>
        <DialogHeader>
          <DialogTitle>Configuración Personalizada de Comisiones</DialogTitle>
          <DialogDescription>
            Configura porcentajes específicos para {user.firstName} {user.lastName}
            {hasCustomConfig ? " (actualmente personalizado)" : " (usa valores globales)"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientReferralCommissionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión por Referidos de Clientes (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder={globalConfig?.clientReferralCommissionPercent || "5.00"}
                      {...field}
                      data-testid="input-user-client-commission"
                    />
                  </FormControl>
                  <FormDescription>
                    Global: {globalConfig?.clientReferralCommissionPercent}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerReferralCommissionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión por Referidos de Propietarios (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder={globalConfig?.ownerReferralCommissionPercent || "10.00"}
                      {...field}
                      data-testid="input-user-owner-commission"
                    />
                  </FormControl>
                  <FormDescription>
                    Global: {globalConfig?.ownerReferralCommissionPercent}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {hasCustomConfig && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetToGlobalMutation.mutate()}
                  disabled={resetToGlobalMutation.isPending}
                  data-testid="button-reset-to-global"
                  className="w-full sm:w-auto"
                >
                  Usar Valores Globales
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-user-config"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateUserConfigMutation.isPending}
                data-testid="button-save-user-config"
              >
                {updateUserConfigMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReferralConfigDialog({ config }: { config?: ReferralConfig }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      clientReferralCommissionPercent: parseFloat(config?.clientReferralCommissionPercent || "5"),
      ownerReferralCommissionPercent: parseFloat(config?.ownerReferralCommissionPercent || "10"),
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      return apiRequest("PATCH", "/api/referrals/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/config"] });
      toast({
        title: "Configuración actualizada",
        description: "Los porcentajes de comisión han sido actualizados correctamente",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-open-config">
          <Settings className="h-4 w-4 mr-2" />
          Configurar Comisiones
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-referral-config">
        <DialogHeader>
          <DialogTitle>Configuración de Comisiones de Referidos</DialogTitle>
          <DialogDescription>
            Establece los porcentajes de comisión para clientes y propietarios referidos
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientReferralCommissionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión por Referidos de Clientes (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="5.00"
                      {...field}
                      data-testid="input-client-commission"
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje de comisión por cada cliente referido
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ownerReferralCommissionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión por Referidos de Propietarios (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="10.00"
                      {...field}
                      data-testid="input-owner-commission"
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje de comisión por cada propietario referido
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-config"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateConfigMutation.isPending}
                data-testid="button-save-config"
              >
                {updateConfigMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminReferrals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data: config } = useQuery<ReferralConfig>({
    queryKey: ["/api/referrals/config"],
  });

  const { data: referralsByUser = [], isLoading, isError } = useQuery<UserReferrals[]>({
    queryKey: ["/api/admin/referrals/all", { type: typeFilter === "all" ? undefined : typeFilter, status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredReferrals = referralsByUser.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.toLowerCase();
    const userEmail = item.user.email.toLowerCase();
    return userName.includes(query) || userEmail.includes(query);
  });

  const totalClientReferrals = referralsByUser.reduce((sum, item) => sum + item.clientReferrals.length, 0);
  const totalOwnerReferrals = referralsByUser.reduce((sum, item) => sum + item.ownerReferrals.length, 0);
  
  const completedClientReferrals = referralsByUser.reduce((sum, item) => 
    sum + item.clientReferrals.filter(r => r.status === "completado").length, 0
  );
  const completedOwnerReferrals = referralsByUser.reduce((sum, item) => 
    sum + item.ownerReferrals.filter(r => r.status === "aprobado" || r.status === "pagado").length, 0
  );

  const totalEarnings = referralsByUser.reduce((sum, item) => {
    const clientEarnings = item.clientReferrals
      .filter(r => r.status === "completado")
      .reduce((s, r) => s + parseFloat(r.commissionAmount || "0"), 0);
    const ownerEarnings = item.ownerReferrals
      .filter(r => r.status === "aprobado" || r.status === "pagado")
      .reduce((s, r) => s + parseFloat(r.commissionAmount || "0"), 0);
    return sum + clientEarnings + ownerEarnings;
  }, 0);

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-referrals-title">
            Gestión de Referidos
          </h1>
          <p className="text-secondary-foreground mt-2">
            Vista administrativa de todos los referidos del sistema
          </p>
        </div>
        
        <Alert variant="destructive" data-testid="alert-referrals-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudo cargar la información de referidos. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Referidos</h1>
          <p className="text-secondary-foreground mt-2">
            Vista administrativa de todos los referidos del sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-referrals-title">
            Gestión de Referidos
          </h1>
          <p className="text-secondary-foreground mt-2">
            Vista administrativa de todos los referidos del sistema
          </p>
        </div>
        <ReferralConfigDialog config={config} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Referidos</CardTitle>
            <Users className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-referrals">
              {totalClientReferrals + totalOwnerReferrals}
            </div>
            <p className="text-xs text-secondary-foreground">
              {totalClientReferrals} clientes · {totalOwnerReferrals} propietarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referidos Completados</CardTitle>
            <Home className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-referrals">
              {completedClientReferrals + completedOwnerReferrals}
            </div>
            <p className="text-xs text-secondary-foreground">
              {completedClientReferrals} clientes · {completedOwnerReferrals} propietarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-earnings">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-secondary-foreground">
              {config?.clientReferralCommissionPercent}% clientes · {config?.ownerReferralCommissionPercent}% propietarios
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra referidos por usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo de referido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="client">Solo clientes</SelectItem>
                <SelectItem value="owner">Solo propietarios</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente_confirmacion">Pendiente Confirmación</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReferrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-secondary-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron referidos</h3>
              <p className="text-secondary-foreground">
                {searchQuery ? "Intenta con otros términos de búsqueda" : "No hay referidos registrados en el sistema"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReferrals.map((item) => {
            const isExpanded = expandedUsers.has(item.user.id);
            const userName = item.user.firstName && item.user.lastName 
              ? `${item.user.firstName} ${item.user.lastName}`
              : item.user.email;
            const initials = item.user.firstName && item.user.lastName
              ? `${item.user.firstName[0]}${item.user.lastName[0]}`
              : item.user.email[0].toUpperCase();

            return (
              <Card key={item.user.id} data-testid={`card-user-${item.user.id}`}>
                <CardHeader className="cursor-pointer hover-elevate active-elevate-2" onClick={() => toggleUserExpanded(item.user.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={item.user.profileImageUrl || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{userName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{item.user.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.user.role}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {item.clientReferrals.length + item.ownerReferrals.length} referidos
                        </div>
                        <div className="text-xs text-secondary-foreground">
                          {item.clientReferrals.length} clientes · {item.ownerReferrals.length} propietarios
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <UserCustomConfigDialog user={item.user} globalConfig={config} />
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-toggle-${item.user.id}`}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <Tabs defaultValue="clients" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="clients" className="flex-1" data-testid={`tab-clients-${item.user.id}`}>
                          Referidos de Clientes
                          <Badge variant="secondary" className="ml-2">
                            {item.clientReferrals.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="owners" className="flex-1" data-testid={`tab-owners-${item.user.id}`}>
                          Referidos de Propietarios
                          <Badge variant="secondary" className="ml-2">
                            {item.ownerReferrals.length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="clients" className="space-y-3 mt-4">
                        {item.clientReferrals.length === 0 ? (
                          <p className="text-center text-secondary-foreground py-8">
                            No hay referidos de clientes
                          </p>
                        ) : (
                          item.clientReferrals.map((referral) => (
                            <div
                              key={referral.id}
                              className="border rounded-md p-4 hover-elevate"
                              data-testid={`client-referral-${referral.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {referral.firstName} {referral.lastName}
                                    </h4>
                                    <Badge variant={getStatusBadgeVariant(referral.status)}>
                                      {getStatusLabel(referral.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-secondary-foreground space-y-1">
                                    <p>Email: {referral.email}</p>
                                    {referral.phone && <p>Teléfono: {referral.phone}</p>}
                                    {referral.notes && <p className="mt-2">Notas: {referral.notes}</p>}
                                    {referral.commissionAmount && (
                                      <p className="font-medium text-green-600 dark:text-green-400 mt-2">
                                        Comisión: ${parseFloat(referral.commissionAmount).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="owners" className="space-y-3 mt-4">
                        {item.ownerReferrals.length === 0 ? (
                          <p className="text-center text-secondary-foreground py-8">
                            No hay referidos de propietarios
                          </p>
                        ) : (
                          item.ownerReferrals.map((referral) => (
                            <div
                              key={referral.id}
                              className="border rounded-md p-4 hover-elevate"
                              data-testid={`owner-referral-${referral.id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {referral.firstName} {referral.lastName}
                                    </h4>
                                    <Badge variant={getStatusBadgeVariant(referral.status)}>
                                      {getStatusLabel(referral.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-secondary-foreground space-y-1">
                                    <p>Email: {referral.email}</p>
                                    {referral.phone && <p>Teléfono: {referral.phone}</p>}
                                    {referral.propertyAddress && (
                                      <p>Dirección de propiedad: {referral.propertyAddress}</p>
                                    )}
                                    {referral.notes && <p className="mt-2">Notas: {referral.notes}</p>}
                                    {referral.commissionAmount && (
                                      <p className="font-medium text-green-600 dark:text-green-400 mt-2">
                                        Comisión: ${parseFloat(referral.commissionAmount).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
