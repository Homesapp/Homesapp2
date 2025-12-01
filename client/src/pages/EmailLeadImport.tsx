import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  History,
  BarChart3,
  Loader2,
  Play
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

const emailSourceSchema = z.object({
  provider: z.enum(["tokko", "easybroker", "inmuebles24", "mercadolibre", "other"]),
  providerName: z.string().min(1, "Nombre requerido"),
  senderEmails: z.string().min(1, "Al menos un email es requerido"),
  subjectPatterns: z.string().optional(),
  defaultSource: z.string().optional(),
  defaultRegistrationType: z.enum(["seller", "broker"]).default("seller"),
  isActive: z.boolean().default(true),
});

type EmailSourceFormData = z.infer<typeof emailSourceSchema>;

interface EmailSource {
  id: string;
  agencyId: string;
  provider: string;
  providerName: string;
  senderEmails: string[];
  subjectPatterns: string[] | null;
  defaultSellerId: string | null;
  defaultSource: string | null;
  defaultRegistrationType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncMessageId: string | null;
  totalImported: number;
  totalDuplicates: number;
  totalErrors: number;
  createdAt: string;
  updatedAt: string;
}

interface ImportLog {
  id: string;
  agencyId: string;
  sourceId: string;
  gmailMessageId: string;
  gmailThreadId: string | null;
  emailSubject: string | null;
  emailFrom: string | null;
  emailDate: string | null;
  status: "success" | "duplicate" | "parse_error" | "skipped";
  leadId: string | null;
  parsedData: any;
  errorMessage: string | null;
  duplicateOfLeadId: string | null;
  duplicateReason: string | null;
  createdAt: string;
}

const PROVIDER_OPTIONS = [
  { value: "tokko", label: "Tokko Broker" },
  { value: "easybroker", label: "EasyBroker" },
  { value: "inmuebles24", label: "Inmuebles24" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "other", label: "Otro" },
];

export default function EmailLeadImport() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const locale = language === "es" ? es : enUS;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EmailSource | null>(null);
  const [selectedTab, setSelectedTab] = useState("sources");

  const { data: sources, isLoading: sourcesLoading } = useQuery<EmailSource[]>({
    queryKey: ["/api/external/email-sources"],
  });

  const { data: stats } = useQuery<{ sources: any[]; totals: { totalImported: number; totalDuplicates: number; totalErrors: number } }>({
    queryKey: ["/api/external/email-import-stats"],
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<{ data: ImportLog[]; total: number }>({
    queryKey: ["/api/external/email-import-logs"],
    enabled: selectedTab === "logs",
  });

  const form = useForm<EmailSourceFormData>({
    resolver: zodResolver(emailSourceSchema),
    defaultValues: {
      provider: "tokko",
      providerName: "",
      senderEmails: "",
      subjectPatterns: "",
      defaultSource: "email_import",
      defaultRegistrationType: "seller",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailSourceFormData) => {
      const payload = {
        ...data,
        senderEmails: data.senderEmails.split(",").map(e => e.trim()).filter(Boolean),
        subjectPatterns: data.subjectPatterns ? data.subjectPatterns.split(",").map(p => p.trim()).filter(Boolean) : null,
      };
      return apiRequest("/api/external/email-sources", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-import-stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: language === "es" ? "Fuente creada" : "Source created",
        description: language === "es" ? "La fuente de email se ha creado correctamente" : "Email source has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmailSourceFormData> }) => {
      const payload: any = { ...data };
      if (data.senderEmails) {
        payload.senderEmails = data.senderEmails.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (data.subjectPatterns) {
        payload.subjectPatterns = data.subjectPatterns.split(",").map((p: string) => p.trim()).filter(Boolean);
      }
      return apiRequest(`/api/external/email-sources/${id}`, "PATCH", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-import-stats"] });
      setEditingSource(null);
      toast({
        title: language === "es" ? "Fuente actualizada" : "Source updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/external/email-sources/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-import-stats"] });
      toast({
        title: language === "es" ? "Fuente eliminada" : "Source deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/external/email-sources/${id}/sync`, "POST");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-import-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external/email-import-logs"] });
      toast({
        title: language === "es" ? "Sincronización completada" : "Sync completed",
        description: language === "es" 
          ? `Importados: ${data.imported}, Duplicados: ${data.duplicates}, Errores: ${data.errors}`
          : `Imported: ${data.imported}, Duplicates: ${data.duplicates}, Errors: ${data.errors}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testGmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/external/email-sources/test-gmail", "POST");
    },
    onSuccess: (data: any) => {
      if (data.connected) {
        toast({
          title: language === "es" ? "Gmail conectado" : "Gmail connected",
          description: language === "es" ? "La conexión con Gmail está activa" : "Gmail connection is active",
        });
      } else {
        toast({
          title: language === "es" ? "Gmail no conectado" : "Gmail not connected",
          description: language === "es" ? "Verifica la conexión de Gmail en la configuración" : "Check Gmail connection in settings",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSourceFormData) => {
    if (editingSource) {
      updateMutation.mutate({ id: editingSource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (source: EmailSource) => {
    setEditingSource(source);
    form.reset({
      provider: source.provider as any,
      providerName: source.providerName,
      senderEmails: source.senderEmails.join(", "),
      subjectPatterns: source.subjectPatterns?.join(", ") || "",
      defaultSource: source.defaultSource || "email_import",
      defaultRegistrationType: source.defaultRegistrationType as any,
      isActive: source.isActive,
    });
  };

  const handleToggleActive = (source: EmailSource) => {
    updateMutation.mutate({
      id: source.id,
      data: { isActive: !source.isActive } as any,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Importado</Badge>;
      case "duplicate":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" /> Duplicado</Badge>;
      case "parse_error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case "skipped":
        return <Badge variant="outline">Omitido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Importación de Leads por Email" : "Email Lead Import"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "es" 
              ? "Importa leads automáticamente desde Tokko, EasyBroker y otras plataformas" 
              : "Automatically import leads from Tokko, EasyBroker and other platforms"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => testGmailMutation.mutate()}
            disabled={testGmailMutation.isPending}
            data-testid="button-test-gmail"
          >
            {testGmailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            {language === "es" ? "Probar Gmail" : "Test Gmail"}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-source">
                <Plus className="w-4 h-4 mr-2" />
                {language === "es" ? "Agregar Fuente" : "Add Source"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {language === "es" ? "Nueva Fuente de Email" : "New Email Source"}
                </DialogTitle>
                <DialogDescription>
                  {language === "es" 
                    ? "Configura una nueva fuente para importar leads automáticamente" 
                    : "Configure a new source to automatically import leads"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Proveedor" : "Provider"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-provider">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROVIDER_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="providerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Nombre" : "Name"}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Tokko Principal" data-testid="input-provider-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Emails del Remitente" : "Sender Emails"}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="noreply@tokkobroker.com, leads@tokko.com" data-testid="input-sender-emails" />
                        </FormControl>
                        <FormDescription>
                          {language === "es" ? "Separa múltiples emails con comas" : "Separate multiple emails with commas"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultRegistrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "es" ? "Tipo de Registro" : "Registration Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-registration-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="seller">Seller</SelectItem>
                            <SelectItem value="broker">Broker</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      {language === "es" ? "Cancelar" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-source">
                      {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {language === "es" ? "Guardar" : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "es" ? "Total Importados" : "Total Imported"}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-imported">{stats.totals.totalImported}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "es" ? "Duplicados" : "Duplicates"}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-duplicates">{stats.totals.totalDuplicates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "es" ? "Errores" : "Errors"}</p>
                  <p className="text-2xl font-bold" data-testid="text-total-errors">{stats.totals.totalErrors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{language === "es" ? "Fuentes Activas" : "Active Sources"}</p>
                  <p className="text-2xl font-bold" data-testid="text-active-sources">{sources?.filter(s => s.isActive).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="sources" data-testid="tab-sources">
            <Settings className="w-4 h-4 mr-2" />
            {language === "es" ? "Fuentes" : "Sources"}
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <History className="w-4 h-4 mr-2" />
            {language === "es" ? "Historial" : "History"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4">
          {sourcesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !sources || sources.length === 0 ? (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>{language === "es" ? "Sin fuentes configuradas" : "No sources configured"}</AlertTitle>
              <AlertDescription>
                {language === "es" 
                  ? "Agrega una fuente de email para comenzar a importar leads automáticamente." 
                  : "Add an email source to start automatically importing leads."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {sources.map((source) => (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{source.providerName}</CardTitle>
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? (language === "es" ? "Activo" : "Active") : (language === "es" ? "Inactivo" : "Inactive")}
                        </Badge>
                        <Badge variant="outline">
                          {PROVIDER_OPTIONS.find(p => p.value === source.provider)?.label || source.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={source.isActive}
                          onCheckedChange={() => handleToggleActive(source)}
                          data-testid={`switch-source-active-${source.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => syncMutation.mutate(source.id)}
                          disabled={syncMutation.isPending}
                          data-testid={`button-sync-${source.id}`}
                        >
                          {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(source)}
                          data-testid={`button-edit-${source.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(source.id)}
                          data-testid={`button-delete-${source.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Emails" : "Emails"}</p>
                        <p className="font-medium">{source.senderEmails.join(", ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Última Sync" : "Last Sync"}</p>
                        <p className="font-medium">
                          {source.lastSyncAt 
                            ? formatDistanceToNow(new Date(source.lastSyncAt), { addSuffix: true, locale }) 
                            : (language === "es" ? "Nunca" : "Never")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Importados" : "Imported"}</p>
                        <p className="font-medium text-green-600">{source.totalImported}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === "es" ? "Duplicados / Errores" : "Duplicates / Errors"}</p>
                        <p className="font-medium">
                          <span className="text-yellow-600">{source.totalDuplicates}</span>
                          {" / "}
                          <span className="text-red-600">{source.totalErrors}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !logsData || logsData.data.length === 0 ? (
            <Alert>
              <History className="h-4 w-4" />
              <AlertTitle>{language === "es" ? "Sin historial" : "No history"}</AlertTitle>
              <AlertDescription>
                {language === "es" 
                  ? "No hay registros de importación aún." 
                  : "No import records yet."}
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Fecha" : "Date"}</TableHead>
                    <TableHead>{language === "es" ? "Asunto" : "Subject"}</TableHead>
                    <TableHead>{language === "es" ? "De" : "From"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead>{language === "es" ? "Detalles" : "Details"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsData.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.emailSubject || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.emailFrom || "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.status === "duplicate" && log.duplicateReason && (
                          <span>{log.duplicateReason}</span>
                        )}
                        {log.status === "parse_error" && log.errorMessage && (
                          <span className="text-destructive">{log.errorMessage}</span>
                        )}
                        {log.status === "success" && log.parsedData && (
                          <span>
                            {log.parsedData.firstName} {log.parsedData.lastName}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingSource} onOpenChange={(open) => !open && setEditingSource(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Editar Fuente" : "Edit Source"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Proveedor" : "Provider"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="providerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Nombre" : "Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Emails del Remitente" : "Sender Emails"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {language === "es" ? "Separa múltiples emails con comas" : "Separate multiple emails with commas"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultRegistrationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === "es" ? "Tipo de Registro" : "Registration Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSource(null)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === "es" ? "Guardar" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
