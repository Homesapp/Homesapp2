import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, FileText, CheckCircle, XCircle, Plus, Edit, Trash2, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const termsFormSchema = z.object({
  version: z.string().min(1, "Version is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["tenant", "owner"]),
});

type TermsFormData = z.infer<typeof termsFormSchema>;

export default function ExternalConfiguration() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"tenant" | "owner" | "designs">("tenant");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<any>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  const form = useForm<TermsFormData>({
    resolver: zodResolver(termsFormSchema),
    defaultValues: {
      version: "",
      title: "",
      content: "",
      type: "tenant",
    },
  });

  // Fetch all terms
  const { data: allTerms, isLoading } = useQuery({
    queryKey: ['/api/external/configuration/terms'],
  });

  // Fetch agency data for PDF template selection
  const { data: agencies, isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['/api/external-agencies'],
  });
  
  // Derive agency using useMemo for proper reactivity
  const agency = useMemo(() => {
    if (!agencies || agencies.length === 0) return undefined;
    
    // Auto-select if only one agency
    if (agencies.length === 1) return agencies[0];
    
    // For multiple agencies, use selected ID or default to first
    if (selectedAgencyId) {
      return agencies.find((a: any) => a.id === selectedAgencyId) || agencies[0];
    }
    
    // Auto-select first agency for multi-agency contexts
    return agencies[0];
  }, [agencies, selectedAgencyId]);
  
  const hasNoAgency = !isLoadingAgencies && (!agencies || agencies.length === 0);
  const hasMultipleAgencies = !isLoadingAgencies && agencies && agencies.length > 1;
  
  // Auto-select first agency when agencies load and we don't have a selection
  useEffect(() => {
    if (hasMultipleAgencies && !selectedAgencyId && agencies && agencies.length > 0) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, hasMultipleAgencies, selectedAgencyId]);

  // Filter terms by type
  const tenantTerms = allTerms?.filter((term: any) => term.type === "tenant") || [];
  const ownerTerms = allTerms?.filter((term: any) => term.type === "owner") || [];

  // Create/Update mutation
  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: TermsFormData) => {
      if (editingTerms) {
        return apiRequest('PATCH', `/api/external/configuration/terms/${editingTerms.id}`, data);
      } else {
        return apiRequest('POST', '/api/external/configuration/terms', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.saved"),
        description: t("configuration.savedDesc"),
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingTerms(null);
    },
    onError: (error: any) => {
      toast({
        title: t("configuration.saveError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/external/configuration/terms/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.published"),
        description: t("configuration.publishedDesc"),
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

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/external/configuration/terms/${id}/unpublish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: t("configuration.unpublished"),
        description: t("configuration.unpublishedDesc"),
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/external/configuration/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/configuration/terms'] });
      toast({
        title: "Eliminado",
        description: "Los términos y condiciones han sido eliminados",
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

  // Update PDF template style mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateStyle: string) => {
      if (!agency) throw new Error("No agency found");
      return apiRequest('PATCH', `/api/external-agencies/${agency.id}`, {
        pdfTemplateStyle: templateStyle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      toast({
        title: language === "es" ? "Diseño actualizado" : "Design updated",
        description: language === "es" 
          ? "El diseño de PDF ha sido actualizado exitosamente"
          : "PDF design has been updated successfully",
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

  const handleOpenDialog = (terms?: any) => {
    if (terms) {
      setEditingTerms(terms);
      form.reset({
        version: terms.version,
        title: terms.title,
        content: terms.content,
        type: terms.type,
      });
    } else {
      setEditingTerms(null);
      form.reset({
        version: "",
        title: "",
        content: "",
        type: activeTab,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: TermsFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  const renderTermsList = (terms: any[], type: "tenant" | "owner") => {
    if (terms.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">{t("configuration.noTerms")}</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t("configuration.noTermsDesc")}
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              data-testid={`button-create-terms-${type}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("configuration.createTerms")}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {terms.map((term: any) => (
          <Card key={term.id} data-testid={`card-terms-${term.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{term.title}</CardTitle>
                    {term.isActive && (
                      <Badge variant="default" className="ml-2" data-testid={`badge-active-${term.id}`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("configuration.isActive")}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {t("configuration.version")}: {term.version}
                    {term.publishedAt && (
                      <span className="ml-4">
                        {t("configuration.publishedAt")}: {new Date(term.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(term)}
                    data-testid={`button-edit-${term.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {term.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unpublishMutation.mutate(term.id)}
                      data-testid={`button-unpublish-${term.id}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => publishMutation.mutate(term.id)}
                      data-testid={`button-publish-${term.id}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(term.id)}
                    disabled={term.isActive}
                    data-testid={`button-delete-${term.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {term.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="page-external-configuration">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {t("configuration.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("configuration.subtitle")}</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          data-testid="button-create-terms"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("configuration.createTerms")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="tenant" data-testid="tab-tenant-terms">
            {t("configuration.tenantTerms")}
          </TabsTrigger>
          <TabsTrigger value="owner" data-testid="tab-owner-terms">
            {t("configuration.ownerTerms")}
          </TabsTrigger>
          <TabsTrigger value="designs" data-testid="tab-pdf-designs">
            {language === "es" ? "Diseños de PDF" : "PDF Designs"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenant" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Cargando...</div>
              </CardContent>
            </Card>
          ) : (
            renderTermsList(tenantTerms, "tenant")
          )}
        </TabsContent>

        <TabsContent value="owner" className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Cargando...</div>
              </CardContent>
            </Card>
          ) : (
            renderTermsList(ownerTerms, "owner")
          )}
        </TabsContent>

        <TabsContent value="designs" className="mt-6">
          {isLoadingAgencies ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {language === "es" 
                    ? "Cargando información de la agencia..."
                    : "Loading agency information..."}
                </div>
              </CardContent>
            </Card>
          ) : hasNoAgency ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {language === "es" 
                      ? "No hay agencia configurada"
                      : "No agency configured"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "es" 
                      ? "Contacta al administrador para configurar tu agencia primero."
                      : "Contact the administrator to configure your agency first."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {language === "es" ? "Diseño de PDFs" : "PDF Design"}
                    </CardTitle>
                    <CardDescription>
                      {language === "es" 
                        ? "Selecciona el diseño que se aplicará a los PDFs de formularios de renta y ofertas"
                        : "Select the design that will be applied to rental forms and offer PDFs"}
                    </CardDescription>
                  </div>
                  {hasMultipleAgencies && agencies && agencies.length > 0 && (
                    <div className="flex items-center gap-2 min-w-[250px]">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Select value={selectedAgencyId || agencies[0]?.id} onValueChange={setSelectedAgencyId}>
                        <SelectTrigger data-testid="select-agency">
                          <SelectValue placeholder={language === "es" ? "Seleccionar agencia" : "Select agency"} />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((ag: any) => (
                            <SelectItem key={ag.id} value={ag.id} data-testid={`select-item-agency-${ag.id}`}>
                              {ag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Professional Template */}
                  <Card 
                  className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'professional' || !agency?.pdfTemplateStyle
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('professional')}
                    data-testid="card-template-professional"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Profesional" : "Professional"}
                        {(agency?.pdfTemplateStyle === 'professional' || !agency?.pdfTemplateStyle) && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño clásico y elegante" : "Classic and elegant design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2F2A1F' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Café oscuro" : "Dark brown"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C19A6B' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Dorado/Tan" : "Gold/Tan"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F7F4EF' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Beige claro" : "Light beige"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* Modern Template */}
                  <Card 
                    className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'modern'
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('modern')}
                    data-testid="card-template-modern"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Moderno" : "Modern"}
                        {agency?.pdfTemplateStyle === 'modern' && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño limpio y minimalista" : "Clean and minimalist design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1a2332' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Gris oscuro" : "Dark slate"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7C9CBF' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Azul suave" : "Soft blue"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5F7FA' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Gris claro" : "Light gray"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* Elegant Template */}
                  <Card 
                    className={cn(
                      "cursor-pointer hover-elevate border-2",
                      agency?.pdfTemplateStyle === 'elegant'
                        ? "border-primary" 
                        : "border-border"
                    )}
                    onClick={() => updateTemplateMutation.mutate('elegant')}
                    data-testid="card-template-elegant"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {language === "es" ? "Elegante" : "Elegant"}
                        {agency?.pdfTemplateStyle === 'elegant' && (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {language === "es" ? "Activo" : "Active"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {language === "es" ? "Diseño sofisticado y refinado" : "Sophisticated and refined design"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2C1810' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Café espresso" : "Deep espresso"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A0826D' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Oro rosado" : "Muted rose gold"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FAF8F5' }} />
                          <span className="text-sm text-muted-foreground">{language === "es" ? "Blanco cálido" : "Warm off-white"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {language === "es" 
                    ? "El diseño seleccionado se aplicará automáticamente a todos los PDFs de formularios de renta (inquilino y propietario) y ofertas de renta."
                    : "The selected design will be automatically applied to all rental form PDFs (tenant and owner) and rental offer PDFs."}
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTerms ? t("configuration.editTerms") : t("configuration.createTerms")}
            </DialogTitle>
            <DialogDescription>
              {editingTerms
                ? "Edita los términos y condiciones existentes"
                : "Crea nuevos términos y condiciones que se mostrarán a los usuarios"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.termsAndConditions")}</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={field.value === "tenant" ? "default" : "outline"}
                          onClick={() => field.onChange("tenant")}
                          className="w-full"
                          data-testid="button-type-tenant"
                        >
                          {t("configuration.tenantTerms")}
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "owner" ? "default" : "outline"}
                          onClick={() => field.onChange("owner")}
                          className="w-full"
                          data-testid="button-type-owner"
                        >
                          {t("configuration.ownerTerms")}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.version")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("configuration.versionPlaceholder")}
                        {...field}
                        data-testid="input-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.title.field")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("configuration.titlePlaceholder")}
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("configuration.content")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("configuration.contentPlaceholder")}
                        className="min-h-[300px]"
                        {...field}
                        data-testid="textarea-content"
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setEditingTerms(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createOrUpdateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createOrUpdateMutation.isPending ? "Guardando..." : t("configuration.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
