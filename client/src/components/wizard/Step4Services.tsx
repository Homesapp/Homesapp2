import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Droplets, Zap, Wifi, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const servicesSchema = z.object({
  wizardMode: z.enum(["simple", "extended"]).default("simple"),
  // Servicios incluidos
  waterIncluded: z.boolean().default(false),
  waterType: z.enum(["capa", "well"]).optional(),
  waterProvider: z.string().optional(),
  waterAccountNumber: z.string().optional(),
  waterEstimatedCost: z.string().optional(),
  
  electricityIncluded: z.boolean().default(false),
  electricityType: z.enum(["cfe", "solar"]).optional(),
  electricityPaymentFrequency: z.enum(["monthly", "bimonthly"]).optional(),
  electricityProvider: z.string().optional(),
  electricityAccountNumber: z.string().optional(),
  electricityEstimatedCost: z.string().optional(),
  
  internetIncluded: z.boolean().default(false),
  internetProvider: z.string().optional(),
  internetAccountNumber: z.string().optional(),
  internetEstimatedCost: z.string().optional(),
  
  // Duraciones de contrato aceptadas
  acceptedLeaseDurations: z.array(z.string()).min(1, "Selecciona al menos una duración de contrato"),
});

type ServicesForm = z.infer<typeof servicesSchema>;

type Step4Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step4Services({ data, onUpdate, onNext, onPrevious }: Step4Props) {
  const [wizardMode, setWizardMode] = useState<"simple" | "extended">(
    data.servicesInfo?.wizardMode || "simple"
  );

  const form = useForm<ServicesForm>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      wizardMode: data.servicesInfo?.wizardMode || "simple",
      waterIncluded: data.servicesInfo?.waterIncluded || false,
      waterType: data.servicesInfo?.waterType,
      waterProvider: data.servicesInfo?.waterProvider || "",
      waterAccountNumber: data.servicesInfo?.waterAccountNumber || "",
      waterEstimatedCost: data.servicesInfo?.waterEstimatedCost || "",
      electricityIncluded: data.servicesInfo?.electricityIncluded || false,
      electricityType: data.servicesInfo?.electricityType,
      electricityPaymentFrequency: data.servicesInfo?.electricityPaymentFrequency,
      electricityProvider: data.servicesInfo?.electricityProvider || "",
      electricityAccountNumber: data.servicesInfo?.electricityAccountNumber || "",
      electricityEstimatedCost: data.servicesInfo?.electricityEstimatedCost || "",
      internetIncluded: data.servicesInfo?.internetIncluded || false,
      internetProvider: data.servicesInfo?.internetProvider || "",
      internetAccountNumber: data.servicesInfo?.internetAccountNumber || "",
      internetEstimatedCost: data.servicesInfo?.internetEstimatedCost || "",
      acceptedLeaseDurations: data.servicesInfo?.acceptedLeaseDurations || [],
    },
  });

  const waterIncluded = form.watch("waterIncluded");
  const electricityIncluded = form.watch("electricityIncluded");
  const internetIncluded = form.watch("internetIncluded");

  // Actualizar wizard data cuando cambia el modo
  useEffect(() => {
    const subscription = form.watch((values) => {
      onUpdate({ servicesInfo: values });
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);

  const onSubmit = (formData: ServicesForm) => {
    onNext({ servicesInfo: formData });
  };

  const leaseDurations = [
    { value: "6months", label: "6 meses" },
    { value: "1year", label: "1 año" },
    { value: "2years", label: "2 años" },
    { value: "3years", label: "3 años o más" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step4-title">
          Servicios y Términos
        </h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          Configura los servicios incluidos y duración de contrato
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Selector de Modo */}
          <Card>
            <CardHeader>
              <CardTitle>Modo de Configuración</CardTitle>
              <CardDescription>
                Elige cómo quieres configurar la información de servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="wizardMode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) {
                            field.onChange(value);
                            setWizardMode(value as "simple" | "extended");
                          }
                        }}
                        className="justify-start gap-4"
                        data-testid="toggle-wizard-mode"
                      >
                        <ToggleGroupItem value="simple" className="flex-1" data-testid="toggle-simple">
                          <div className="text-left">
                            <div className="font-medium">Modo Simple</div>
                            <div className="text-xs text-muted-foreground">
                              Solo información básica
                            </div>
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="extended" className="flex-1" data-testid="toggle-extended">
                          <div className="text-left">
                            <div className="font-medium">Modo Extendido</div>
                            <div className="text-xs text-muted-foreground">
                              Incluye proveedores y números de servicio
                            </div>
                          </div>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Servicios Incluidos */}
          {data.isForRent && (
            <Card>
              <CardHeader>
                <CardTitle>Servicios Incluidos en la Renta</CardTitle>
                <CardDescription>
                  Indica qué servicios están incluidos y sus costos estimados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agua */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="waterIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            Agua
                          </FormLabel>
                          <FormDescription>
                            Servicio de agua incluido en la renta
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-water"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {waterIncluded && (
                    <div className="space-y-4 pl-4 border-l-2 border-blue-500">
                      <FormField
                        control={form.control}
                        name="waterType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Servicio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-water-type">
                                  <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="capa">CAPA</SelectItem>
                                <SelectItem value="well">Agua de Pozo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {wizardMode === "extended" && (
                        <>
                          <FormField
                            control={form.control}
                            name="waterProvider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Empresa Proveedora</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: CAPA" {...field} data-testid="input-water-provider" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="waterAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Número de Servicio
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          Este número estará oculto en los listings y solo se mostrará
                                          cuando haya un inquilino activo
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Número de cuenta" {...field} data-testid="input-water-account" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="waterEstimatedCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo Estimado Mensual</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: $500 MXN"
                                {...field}
                                data-testid="input-water-cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Electricidad */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="electricityIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Electricidad
                          </FormLabel>
                          <FormDescription>
                            Servicio de electricidad incluido en la renta
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-electricity"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {electricityIncluded && (
                    <div className="space-y-4 pl-4 border-l-2 border-yellow-500">
                      <FormField
                        control={form.control}
                        name="electricityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Servicio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-electricity-type">
                                  <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cfe">CFE</SelectItem>
                                <SelectItem value="solar">Autosuficiente (Paneles Solares)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="electricityPaymentFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frecuencia de Pago</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-electricity-frequency">
                                  <SelectValue placeholder="Selecciona la frecuencia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="bimonthly">Bimensual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {wizardMode === "extended" && (
                        <>
                          <FormField
                            control={form.control}
                            name="electricityProvider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Empresa Proveedora</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: CFE" {...field} data-testid="input-electricity-provider" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="electricityAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  Número de Servicio
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          Este número estará oculto en los listings y solo se mostrará
                                          cuando haya un inquilino activo
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Número de cuenta" {...field} data-testid="input-electricity-account" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="electricityEstimatedCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo Estimado Mensual</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: $1,200 MXN"
                                {...field}
                                data-testid="input-electricity-cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Internet */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="internetIncluded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Wifi className="w-5 h-5 text-purple-500" />
                            Internet
                          </FormLabel>
                          <FormDescription>
                            Servicio de internet incluido en la renta
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-internet"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {internetIncluded && (
                    <div className="space-y-4 pl-4 border-l-2 border-purple-500">
                      <FormField
                        control={form.control}
                        name="internetProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proveedor de Internet</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Telmex, Abix, Totalplay..."
                                {...field}
                                data-testid="input-internet-provider"
                              />
                            </FormControl>
                            <FormDescription>
                              Nombre de la compañía proveedora
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {wizardMode === "extended" && (
                        <FormField
                          control={form.control}
                          name="internetAccountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Número de Servicio
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        Este número estará oculto en los listings y solo se mostrará
                                        cuando haya un inquilino activo
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Número de cuenta" {...field} data-testid="input-internet-account" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="internetEstimatedCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Costo Estimado Mensual</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: $800 MXN"
                                {...field}
                                data-testid="input-internet-cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duración de Contrato */}
          {data.isForRent && (
            <Card>
              <CardHeader>
                <CardTitle>Duraciones de Contrato Aceptadas</CardTitle>
                <CardDescription>
                  Selecciona qué duraciones de contrato estás dispuesto a aceptar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="acceptedLeaseDurations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ToggleGroup
                          type="multiple"
                          value={field.value}
                          onValueChange={field.onChange}
                          className="justify-start flex-wrap gap-4"
                          data-testid="toggle-lease-durations"
                        >
                          {leaseDurations.map((duration) => (
                            <ToggleGroupItem
                              key={duration.value}
                              value={duration.value}
                              className="flex-1 min-w-[120px]"
                              data-testid={`toggle-duration-${duration.value}`}
                            >
                              {duration.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormDescription>
                        Puedes seleccionar múltiples opciones
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              data-testid="button-next-step4"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
