import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Home, CheckCircle2, AlertCircle } from "lucide-react";

const offerFormSchema = z.object({
  fullName: z.string().min(2, "Nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono es requerido"),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  occupation: z.string().min(2, "Ocupación es requerida"),
  monthlyRent: z.string().min(1, "Renta mensual es requerida"),
  currency: z.string().min(1, "Moneda es requerida"),
  contractDuration: z.string().min(1, "Duración del contrato es requerida"),
  moveInDate: z.string().min(1, "Fecha de ingreso es requerida"),
  numberOfOccupants: z.string().min(1, "Número de ocupantes es requerido"),
  pets: z.string().min(1, "Información sobre mascotas es requerida"),
  petDetails: z.string().optional(),
  services: z.array(z.string()).optional(),
  additionalComments: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

export default function PublicOfferForm() {
  const { token } = useParams();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: validationData, isLoading: isValidating } = useQuery({
    queryKey: ["/api/offer-tokens", token, "validate"],
    queryFn: async () => {
      const res = await fetch(`/api/offer-tokens/${token}/validate`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Token inválido");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      occupation: "",
      monthlyRent: "",
      currency: "USD",
      contractDuration: "12 meses",
      moveInDate: "",
      numberOfOccupants: "1",
      pets: "no",
      petDetails: "",
      services: [],
      additionalComments: "",
    },
  });

  const submitOfferMutation = useMutation({
    mutationFn: async (data: OfferFormValues) => {
      return apiRequest("POST", `/api/offer-tokens/${token}/submit`, data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "¡Oferta enviada exitosamente!",
        description: "Nuestro equipo revisará tu oferta y te contactará pronto.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar oferta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    submitOfferMutation.mutate(data);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="icon-loading" />
              <p className="text-muted-foreground">Validando enlace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validationData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Enlace no válido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este enlace ha expirado o ya fue utilizado. Por favor, contacta a tu agente para obtener un nuevo enlace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" data-testid="icon-success" />
              <CardTitle>¡Oferta enviada!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Tu oferta ha sido recibida exitosamente. Nuestro equipo la revisará y te contactará en las próximas 24-48 horas.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Próximos pasos:</strong>
                <br />
                1. Verificaremos tu información
                <br />
                2. Contactaremos al propietario
                <br />
                3. Te notificaremos la decisión
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const property = validationData?.property;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">HomesApp</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Tulum Rental Homes ™</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <CardTitle>Oferta de Renta</CardTitle>
            </div>
            <CardDescription>{property?.title || "Propiedad"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Dirección:</strong> {property?.address || "No disponible"}
              </p>
              {property?.monthlyRentPrice && (
                <p className="text-sm text-blue-900 dark:text-blue-100 mt-2">
                  <strong>Renta publicada:</strong> ${property.monthlyRentPrice} {property.currency || "USD"}/mes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completa tu oferta</CardTitle>
            <CardDescription>
              Por favor proporciona la siguiente información para formalizar tu interés en la propiedad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información Personal</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan Pérez" data-testid="input-fullName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="juan@ejemplo.com" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+52 123 456 7890" data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidad *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Mexicana" data-testid="input-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ocupación *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ingeniero de Software" data-testid="input-occupation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detalles de la Oferta</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renta Mensual Ofertada *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="15000" data-testid="input-monthlyRent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moneda *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Selecciona moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="MXN">MXN</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración del Contrato *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contractDuration">
                                <SelectValue placeholder="Selecciona duración" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">6 meses</SelectItem>
                              <SelectItem value="12 meses">12 meses</SelectItem>
                              <SelectItem value="18 meses">18 meses</SelectItem>
                              <SelectItem value="24 meses">24 meses</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="moveInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Ingreso Deseada *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-moveInDate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="numberOfOccupants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Ocupantes *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-numberOfOccupants">
                              <SelectValue placeholder="Selecciona número" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 persona</SelectItem>
                            <SelectItem value="2">2 personas</SelectItem>
                            <SelectItem value="3">3 personas</SelectItem>
                            <SelectItem value="4">4 personas</SelectItem>
                            <SelectItem value="5+">5+ personas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información Adicional</h3>

                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>¿Tiene mascotas? *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pets">
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("pets") === "yes" && (
                    <FormField
                      control={form.control}
                      name="petDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalles de Mascotas</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tipo, raza, tamaño, etc."
                              data-testid="input-petDetails"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>Servicios Deseados (Opcional)</FormLabel>
                        <div className="space-y-2">
                          {[
                            { id: "internet", label: "Internet de alta velocidad" },
                            { id: "limpieza", label: "Servicio de limpieza" },
                            { id: "jardineria", label: "Jardinería" },
                            { id: "mantenimiento", label: "Mantenimiento" },
                          ].map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="services"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.label)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), service.label])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== service.label)
                                              );
                                        }}
                                        data-testid={`checkbox-service-${service.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{service.label}</FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios Adicionales (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Cualquier información adicional que desees compartir..."
                            data-testid="input-additionalComments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitOfferMutation.isPending}
                  data-testid="button-submit-offer"
                >
                  {submitOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Oferta
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          <p>HomesApp - Tulum Rental Homes ™</p>
          <p className="mt-1">Tu información será tratada de forma confidencial</p>
        </div>
      </div>
    </div>
  );
}
