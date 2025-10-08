import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClipboardCheck, Calendar, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const completeInspectionSchema = z.object({
  structuralCondition: z.enum(["1", "2", "3", "4", "5"], { required_error: "Requerido" }),
  cleanliness: z.enum(["1", "2", "3", "4", "5"], { required_error: "Requerido" }),
  utilities: z.enum(["1", "2", "3", "4", "5"], { required_error: "Requerido" }),
  security: z.enum(["1", "2", "3", "4", "5"], { required_error: "Requerido" }),
  amenitiesCondition: z.enum(["1", "2", "3", "4", "5"], { required_error: "Requerido" }),
  documentationReview: z.string().min(10, "Mínimo 10 caracteres"),
  recommendations: z.string().min(10, "Mínimo 10 caracteres"),
  overallCondition: z.string().min(10, "Mínimo 10 caracteres"),
  approved: z.enum(["true", "false"], { required_error: "Requerido" }),
  approvalNotes: z.string().optional(),
  photos: z.string().optional(),
});

export default function ConciergeInspections() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  // Fetch inspections assigned to this concierge
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["/api/inspection-reports/concierge", user?.id],
    enabled: !!user?.id && user?.role === "concierge",
  });

  const form = useForm<z.infer<typeof completeInspectionSchema>>({
    resolver: zodResolver(completeInspectionSchema),
    defaultValues: {
      structuralCondition: "",
      cleanliness: "",
      utilities: "",
      security: "",
      amenitiesCondition: "",
      documentationReview: "",
      recommendations: "",
      overallCondition: "",
      approved: "",
      approvalNotes: "",
      photos: "",
    },
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof completeInspectionSchema>) => {
      if (!selectedInspection) return;
      
      const photosArray = data.photos ? data.photos.split(",").map(p => p.trim()).filter(Boolean) : [];
      
      return apiRequest(`/api/properties/${selectedInspection.propertyId}/complete-inspection`, {
        method: "POST",
        body: JSON.stringify({
          structuralCondition: parseInt(data.structuralCondition),
          cleanliness: parseInt(data.cleanliness),
          utilities: parseInt(data.utilities),
          security: parseInt(data.security),
          amenitiesCondition: parseInt(data.amenitiesCondition),
          documentationReview: data.documentationReview,
          recommendations: data.recommendations,
          overallCondition: data.overallCondition,
          approved: data.approved === "true",
          approvalNotes: data.approvalNotes || null,
          photos: photosArray,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Inspección completada",
        description: "El informe de inspección ha sido guardado exitosamente.",
      });
      setSelectedInspection(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports/concierge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/management"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar la inspección.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof completeInspectionSchema>) => {
    completeInspectionMutation.mutate(data);
  };

  const pendingInspections = inspections.filter((i: any) => i.status === "scheduled");
  const completedInspections = inspections.filter((i: any) => i.status === "completed");

  const RatingField = ({ 
    name, 
    label, 
    control 
  }: { 
    name: "structuralCondition" | "cleanliness" | "utilities" | "security" | "amenitiesCondition";
    label: string;
    control: any;
  }) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex gap-4"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`${name}-${rating}`} data-testid={`radio-${name}-${rating}`} />
                  <Label htmlFor={`${name}-${rating}`} className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {rating}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Cargando inspecciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("Mis Inspecciones")}</h1>
        <p className="text-muted-foreground">{t("Gestiona y completa tus inspecciones asignadas")}</p>
      </div>

      {/* Pending Inspections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Inspecciones Pendientes
          </CardTitle>
          <CardDescription>
            Inspecciones programadas que requieren tu atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInspections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tienes inspecciones pendientes.</p>
          ) : (
            <div className="space-y-4">
              {pendingInspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`inspection-${inspection.id}`}
                >
                  <div className="space-y-2">
                    <div className="font-medium">{inspection.property?.title || "Propiedad"}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(inspection.inspectionDate), "PPP 'a las' p", { locale: es })}
                      </div>
                      {inspection.property?.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {inspection.property.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedInspection(inspection)}
                    data-testid={`button-complete-${inspection.id}`}
                  >
                    Completar Inspección
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Inspecciones Completadas</CardTitle>
          <CardDescription>
            Historial de inspecciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedInspections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No has completado inspecciones aún.</p>
          ) : (
            <div className="space-y-4">
              {completedInspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="font-medium">{inspection.property?.title || "Propiedad"}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(inspection.inspectionDate), "PPP", { locale: es })}
                      </div>
                      <Badge variant={inspection.approved ? "default" : "destructive"}>
                        {inspection.approved ? "Aprobada" : "No Aprobada"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Inspection Dialog */}
      <Dialog open={!!selectedInspection} onOpenChange={(open) => !open && setSelectedInspection(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completar Inspección</DialogTitle>
            <DialogDescription>
              {selectedInspection?.property?.title}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Rating Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Calificaciones (1-5 estrellas)</h3>
                
                <RatingField
                  name="structuralCondition"
                  label="Condición Estructural"
                  control={form.control}
                />

                <RatingField
                  name="cleanliness"
                  label="Limpieza"
                  control={form.control}
                />

                <RatingField
                  name="utilities"
                  label="Servicios (agua, luz, gas)"
                  control={form.control}
                />

                <RatingField
                  name="security"
                  label="Seguridad"
                  control={form.control}
                />

                <RatingField
                  name="amenitiesCondition"
                  label="Estado de Amenidades"
                  control={form.control}
                />
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Detalles de la Inspección</h3>

                <FormField
                  control={form.control}
                  name="documentationReview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revisión de Documentación</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe el estado de la documentación de la propiedad..."
                          data-testid="textarea-documentation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recomendaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Recomendaciones para el propietario o mejoras necesarias..."
                          data-testid="textarea-recommendations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overallCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condición General</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Resumen general de la condición de la propiedad..."
                          data-testid="textarea-overall"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Approval Decision */}
              <FormField
                control={form.control}
                name="approved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Aprobar la propiedad para publicación?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="approved-yes" data-testid="radio-approved-yes" />
                          <Label htmlFor="approved-yes">Sí, aprobar</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="approved-no" data-testid="radio-approved-no" />
                          <Label htmlFor="approved-no">No, rechazar</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approvalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas de Aprobación/Rechazo (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notas adicionales sobre tu decisión..."
                        data-testid="textarea-approval-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URLs de Fotos (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="URL1, URL2, URL3 (separadas por comas)"
                        data-testid="input-photos"
                      />
                    </FormControl>
                    <FormDescription>
                      Ingresa las URLs de las fotos de la inspección, separadas por comas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInspection(null)}
                  data-testid="button-cancel-inspection"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={completeInspectionMutation.isPending}
                  data-testid="button-submit-inspection"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Completar Inspección
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
