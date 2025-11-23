import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface ExternalEditOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerToken: any;
}

const offerEditSchema = z.object({
  nombreCompleto: z.string().min(2, "Nombre completo es requerido"),
  nacionalidad: z.string().min(2, "Nacionalidad es requerida"),
  edad: z.coerce.number().min(18, "Edad mínima 18 años").optional().nullable(),
  tiempoResidenciaTulum: z.string().optional(),
  trabajoPosicion: z.string().min(2, "Posición es requerida"),
  companiaTrabaja: z.string().min(2, "Compañía es requerida"),
  tieneMascotas: z.string().min(1, "Campo requerido"),
  ingresoMensualPromedio: z.string().min(1, "Ingreso es requerido"),
  numeroInquilinos: z.coerce.number().min(1, "Número de inquilinos requerido").optional().nullable(),
  tieneGarante: z.string().optional(),
  usoInmueble: z.enum(["vivienda", "subarrendamiento"]),
  rentaOfertada: z.coerce.number().min(0, "Renta ofertada requerida").optional().nullable(),
  rentasAdelantadas: z.coerce.number().min(0).optional().nullable(),
  fechaIngreso: z.string().optional(),
  fechaSalida: z.string().optional(),
  duracionContrato: z.string().optional(),
  contractCost: z.coerce.number().optional().nullable(),
  clientEmail: z.string().email("Email inválido").optional(),
  clientPhone: z.string().optional(),
});

type OfferEditValues = z.infer<typeof offerEditSchema>;

export default function ExternalEditOfferDialog({ open, onOpenChange, offerToken }: ExternalEditOfferDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();

  const form = useForm<OfferEditValues>({
    resolver: zodResolver(offerEditSchema),
    defaultValues: {
      nombreCompleto: "",
      nacionalidad: "",
      edad: null,
      tiempoResidenciaTulum: "",
      trabajoPosicion: "",
      companiaTrabaja: "",
      tieneMascotas: "No",
      ingresoMensualPromedio: "",
      numeroInquilinos: null,
      tieneGarante: "No",
      usoInmueble: "vivienda",
      rentaOfertada: null,
      rentasAdelantadas: null,
      fechaIngreso: "",
      fechaSalida: "",
      duracionContrato: "",
      contractCost: null,
      clientEmail: "",
      clientPhone: "",
    },
  });

  // Pre-fill form when offerToken changes
  useEffect(() => {
    if (offerToken?.offerData) {
      const data = offerToken.offerData;
      form.reset({
        nombreCompleto: data.nombreCompleto || "",
        nacionalidad: data.nacionalidad || "",
        edad: data.edad || null,
        tiempoResidenciaTulum: data.tiempoResidenciaTulum || "",
        trabajoPosicion: data.trabajoPosicion || "",
        companiaTrabaja: data.companiaTrabaja || "",
        tieneMascotas: data.tieneMascotas || "No",
        ingresoMensualPromedio: data.ingresoMensualPromedio || "",
        numeroInquilinos: data.numeroInquilinos || null,
        tieneGarante: data.tieneGarante || "No",
        usoInmueble: data.usoInmueble || "vivienda",
        rentaOfertada: data.rentaOfertada || null,
        rentasAdelantadas: data.rentasAdelantadas || null,
        fechaIngreso: data.fechaIngreso || "",
        fechaSalida: data.fechaSalida || "",
        duracionContrato: data.duracionContrato || "",
        contractCost: data.contractCost || null,
        clientEmail: data.clientEmail || "",
        clientPhone: data.clientPhone || "",
      });
    }
  }, [offerToken, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: OfferEditValues) => {
      const response = await apiRequest("PATCH", `/api/external/offers/${offerToken.id}`, {
        offerData: values,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external/offer-tokens"] });
      toast({
        title: language === "es" ? "Oferta actualizada" : "Offer updated",
        description: language === "es" ? "Los cambios se han guardado exitosamente" : "Changes have been saved successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message || (language === "es" ? "No se pudo actualizar la oferta" : "Could not update offer"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: OfferEditValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Editar Oferta" : "Edit Offer"}
          </DialogTitle>
          <DialogDescription>
            {language === "es" 
              ? "Actualiza la información de la oferta según sea necesario"
              : "Update the offer information as needed"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {language === "es" ? "Información Personal" : "Personal Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombreCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre Completo" : "Full Name"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nombre-completo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nacionalidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nacionalidad" : "Nationality"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-nacionalidad" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="edad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Edad" : "Age"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-edad"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiempoResidenciaTulum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Tiempo en Tulum" : "Time in Tulum"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-tiempo-tulum" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {language === "es" ? "Información Laboral" : "Employment Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trabajoPosicion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Posición" : "Position"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-posicion" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companiaTrabaja"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Compañía" : "Company"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-compania" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ingresoMensualPromedio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Ingreso Mensual" : "Monthly Income"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-ingreso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Offer Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {language === "es" ? "Detalles de la Oferta" : "Offer Details"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usoInmueble"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Uso del Inmueble" : "Property Usage"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-uso-inmueble">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vivienda">{language === "es" ? "Vivienda" : "Living"}</SelectItem>
                          <SelectItem value="subarrendamiento">{language === "es" ? "Subarrendamiento" : "Sublet"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentaOfertada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Renta Ofertada (MXN)" : "Offered Rent (MXN)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          data-testid="input-renta-ofertada"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentasAdelantadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Rentas Adelantadas" : "Advance Rents"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-rentas-adelantadas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duracionContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Duración del Contrato" : "Contract Duration"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-duracion-contrato" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaIngreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de Ingreso" : "Move-in Date"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fecha-ingreso" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaSalida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Fecha de Salida (Opcional)" : "Move-out Date (Optional)"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fecha-salida" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroInquilinos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Número de Inquilinos" : "Number of Tenants"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          data-testid="input-numero-inquilinos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tieneMascotas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene Mascotas?" : "Has Pets?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tiene-mascotas">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tieneGarante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "¿Tiene Garante?" : "Has Guarantor?"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tiene-garante">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">{language === "es" ? "Sí" : "Yes"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
                data-testid="button-cancel"
              >
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {language === "es" ? "Guardar Cambios" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
