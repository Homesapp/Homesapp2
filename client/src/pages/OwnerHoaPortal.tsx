import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Home, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCondominiumIssueSchema } from "@shared/schema";
import { z } from "zod";

type CondominiumUnit = {
  id: string;
  condominiumId: string;
  unitNumber: string;
  ownerId: string | null;
  floor: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
};

type CondominiumFee = {
  id: string;
  condominiumId: string;
  unitId: string;
  amount: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  description: string | null;
};

type CondominiumIssue = {
  id: string;
  condominiumId: string;
  reportedById: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  location: string | null;
  reportedAt: string;
};

// Issue form schema
const issueFormSchema = insertCondominiumIssueSchema.pick({
  condominiumId: true,
  title: true,
  description: true,
  category: true,
  priority: true,
}).extend({
  location: z.string().optional(),
});

type IssueFormData = z.infer<typeof issueFormSchema>;

export default function OwnerHoaPortal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);

  // Fetch owner's units first
  const { data: units = [], isLoading: loadingUnits } = useQuery<CondominiumUnit[]>({
    queryKey: ["/api/hoa/my-units"],
  });

  // React Hook Form with Zod validation
  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      condominiumId: "",
      title: "",
      description: "",
      category: "mantenimiento",
      priority: "media",
      location: "",
    },
  });

  // Auto-populate condominium when units load
  useEffect(() => {
    if (units.length > 0 && !form.getValues("condominiumId")) {
      form.setValue("condominiumId", units[0].condominiumId);
    }
  }, [units, form]);

  // Fetch fees for owner's units
  const { data: fees = [], isLoading: loadingFees } = useQuery<CondominiumFee[]>({
    queryKey: ["/api/hoa/my-fees"],
  });

  // Fetch owner's reported issues
  const { data: issues = [], isLoading: loadingIssues } = useQuery<CondominiumIssue[]>({
    queryKey: ["/api/hoa/my-issues"],
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (data: IssueFormData) => {
      return await apiRequest("POST", "/api/hoa/issues", {
        ...data,
        reportedById: user?.id,
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/hoa/my-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hoa/condominiums"] });
      
      toast({
        title: "Incidencia reportada",
        description: "Tu reporte ha sido enviado exitosamente",
      });
      
      // Preserve the selected condominium for user context
      const currentCondominiumId = form.getValues("condominiumId");
      form.reset({
        condominiumId: currentCondominiumId,
        title: "",
        description: "",
        category: "mantenimiento",
        priority: "media",
        location: "",
      });
      
      setIsReportIssueOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo reportar la incidencia",
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const totalUnits = units.length;
  const pendingFees = fees.filter(f => f.status === "pending").length;
  const paidFees = fees.filter(f => f.status === "paid").length;
  const overdueFees = fees.filter(f => f.status === "overdue").length;
  const openIssues = issues.filter(i => i.status === "open").length;

  const totalPendingAmount = fees
    .filter(f => f.status === "pending" || f.status === "overdue")
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const isLoading = loadingUnits || loadingFees || loadingIssues;

  const handleReportIssue = (data: IssueFormData) => {
    createIssueMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando información HOA...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-owner-hoa">Portal HOA</h1>
        <p className="text-muted-foreground">
          Gestiona tus unidades, cuotas e incidencias de condominio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-owner-units">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Unidades</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              Unidades registradas
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-fees">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuotas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFees + overdueFees}</div>
            <p className="text-xs text-muted-foreground">
              ${totalPendingAmount.toLocaleString()} por pagar
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-paid-fees">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuotas Pagadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidFees}</div>
            <p className="text-xs text-muted-foreground">
              Al día
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-owner-issues">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground">
              {openIssues} abiertas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fees" className="w-full" data-testid="tabs-owner-hoa">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list-owner-hoa">
          <TabsTrigger value="fees" data-testid="tab-owner-fees">Mis Cuotas</TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-owner-units">Mis Unidades</TabsTrigger>
          <TabsTrigger value="issues" data-testid="tab-owner-issues">Incidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cuotas</CardTitle>
              <CardDescription>Tus cuotas de condominio</CardDescription>
            </CardHeader>
            <CardContent>
              {fees.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tienes cuotas registradas
                </div>
              ) : (
                <div className="space-y-2">
                  {fees.map(fee => (
                    <div
                      key={fee.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`owner-fee-${fee.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">${parseFloat(fee.amount).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            Vence: {new Date(fee.dueDate).toLocaleDateString()}
                            {fee.description && ` · ${fee.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            fee.status === "paid"
                              ? "default"
                              : fee.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {fee.status === "paid"
                            ? "Pagada"
                            : fee.status === "overdue"
                            ? "Vencida"
                            : "Pendiente"}
                        </Badge>
                        {fee.status === "pending" || fee.status === "overdue" ? (
                          <Button size="sm" data-testid={`button-pay-${fee.id}`}>
                            Pagar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Unidades</CardTitle>
              <CardDescription>
                {totalUnits} unidad{totalUnits !== 1 ? "es" : ""} registrada{totalUnits !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tienes unidades registradas
                </div>
              ) : (
                <div className="space-y-2">
                  {units.map(unit => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`owner-unit-${unit.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Unidad {unit.unitNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {unit.floor && `Piso ${unit.floor}`}
                            {unit.bedrooms && ` · ${unit.bedrooms} rec.`}
                            {unit.bathrooms && ` · ${unit.bathrooms} baños`}
                            {unit.area && ` · ${unit.area}m²`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Mis Incidencias</CardTitle>
                <CardDescription>
                  {issues.length} incidencia{issues.length !== 1 ? "s" : ""} reportada{issues.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Dialog open={isReportIssueOpen} onOpenChange={setIsReportIssueOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-report-issue">
                    <Plus className="h-4 w-4 mr-2" />
                    Reportar Incidencia
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-report-issue">
                  <DialogHeader>
                    <DialogTitle>Reportar Incidencia</DialogTitle>
                    <DialogDescription>
                      Reporta un problema en las áreas comunes del condominio
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleReportIssue)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="condominiumId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condominio *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-issue-condominium">
                                  <SelectValue placeholder="Selecciona el condominio" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from(new Set(units.map(u => u.condominiumId))).map(condoId => (
                                  <SelectItem 
                                    key={condoId} 
                                    value={condoId}
                                    data-testid={`select-option-condominium-${condoId}`}
                                  >
                                    Condominio {condoId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                data-testid="input-issue-title"
                                placeholder="Ej: Fuga de agua en área común"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción *</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                data-testid="textarea-issue-description"
                                placeholder="Describe el problema en detalle..."
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-issue-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mantenimiento" data-testid="select-option-category-mantenimiento">Mantenimiento</SelectItem>
                                  <SelectItem value="seguridad" data-testid="select-option-category-seguridad">Seguridad</SelectItem>
                                  <SelectItem value="limpieza" data-testid="select-option-category-limpieza">Limpieza</SelectItem>
                                  <SelectItem value="ruido" data-testid="select-option-category-ruido">Ruido</SelectItem>
                                  <SelectItem value="otro" data-testid="select-option-category-otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridad</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-issue-priority">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="baja" data-testid="select-option-priority-baja">Baja</SelectItem>
                                  <SelectItem value="media" data-testid="select-option-priority-media">Media</SelectItem>
                                  <SelectItem value="alta" data-testid="select-option-priority-alta">Alta</SelectItem>
                                  <SelectItem value="urgente" data-testid="select-option-priority-urgente">Urgente</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                data-testid="input-issue-location"
                                placeholder="Ej: Alberca, Elevador 2, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsReportIssueOpen(false)}
                          data-testid="button-cancel-issue"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createIssueMutation.isPending}
                          data-testid="button-submit-issue"
                        >
                          {createIssueMutation.isPending ? "Reportando..." : "Reportar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No has reportado incidencias
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.map(issue => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`owner-issue-${issue.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.category} · {issue.priority} prioridad
                            {issue.location && ` · ${issue.location}`}
                            {" · "}
                            {new Date(issue.reportedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          issue.status === "resolved"
                            ? "default"
                            : issue.status === "open"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {issue.status === "open"
                          ? "Abierta"
                          : issue.status === "in_progress"
                          ? "En progreso"
                          : issue.status === "resolved"
                          ? "Resuelta"
                          : "Cerrada"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
