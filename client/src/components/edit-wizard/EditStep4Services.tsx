import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const servicesSchema = z.object({
  waterIncluded: z.boolean(),
  electricityIncluded: z.boolean(),
  internetIncluded: z.boolean(),
  acceptedLeaseDurations: z.array(z.string()).min(1, "Selecciona al menos una duración"),
});

type ServicesForm = z.infer<typeof servicesSchema>;

interface EditStep4Props {
  property: Property;
  data: EditWizardData;
  onUpdate: (data: Partial<EditWizardData>, modifiedFields?: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const LEASE_DURATIONS = [
  { id: "1-month", label: "1 mes" },
  { id: "3-months", label: "3 meses" },
  { id: "6-months", label: "6 meses" },
  { id: "12-months", label: "12 meses (1 año)" },
  { id: "24-months", label: "24 meses (2 años)" },
  { id: "36-months", label: "36 meses (3 años)" },
];

export default function EditStep4Services({ property, data, onUpdate, onNext, onPrevious }: EditStep4Props) {
  const currentServices = property.includedServices as any || {};
  const currentLeaseDurations = data.acceptedLeaseDurations || property.acceptedLeaseDurations || [];
  
  const form = useForm<ServicesForm>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      waterIncluded: data.includedServices?.water ?? currentServices.water ?? false,
      electricityIncluded: data.includedServices?.electricity ?? currentServices.electricity ?? false,
      internetIncluded: data.includedServices?.internet ?? currentServices.internet ?? false,
      acceptedLeaseDurations: currentLeaseDurations,
    },
  });

  const onSubmit = (formData: ServicesForm) => {
    const modified: string[] = [];
    
    const newServices = {
      water: formData.waterIncluded,
      electricity: formData.electricityIncluded,
      internet: formData.internetIncluded,
    };
    
    if (JSON.stringify(newServices) !== JSON.stringify(currentServices)) {
      modified.push("includedServices");
    }
    
    const originalDurations = property.acceptedLeaseDurations || [];
    if (JSON.stringify(formData.acceptedLeaseDurations) !== JSON.stringify(originalDurations)) {
      modified.push("acceptedLeaseDurations");
    }

    onUpdate({
      includedServices: newServices,
      acceptedLeaseDurations: formData.acceptedLeaseDurations,
    }, modified);
    
    onNext();
  };

  const hasChanges = () => {
    const values = form.getValues();
    const newServices = {
      water: values.waterIncluded,
      electricity: values.electricityIncluded,
      internet: values.internetIncluded,
    };
    
    const originalDurations = property.acceptedLeaseDurations || [];
    
    return (
      JSON.stringify(newServices) !== JSON.stringify(currentServices) ||
      JSON.stringify(values.acceptedLeaseDurations) !== JSON.stringify(originalDurations)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Servicios y Duraciones de Contrato</h3>
        <p className="text-sm text-muted-foreground">
          Configura los servicios incluidos y duraciones de contrato aceptadas
        </p>
      </div>

      {hasChanges() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has realizado cambios en esta sección
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Included Services */}
          <div className="space-y-4">
            <h4 className="font-medium">Servicios Incluidos en la Renta</h4>
            
            <FormField
              control={form.control}
              name="waterIncluded"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Agua</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actual:</span>
                      <Badge variant={currentServices.water ? "default" : "secondary"}>
                        {currentServices.water ? "Incluido" : "No incluido"}
                      </Badge>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-waterIncluded"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="electricityIncluded"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Electricidad</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actual:</span>
                      <Badge variant={currentServices.electricity ? "default" : "secondary"}>
                        {currentServices.electricity ? "Incluido" : "No incluido"}
                      </Badge>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-electricityIncluded"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internetIncluded"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Internet</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actual:</span>
                      <Badge variant={currentServices.internet ? "default" : "secondary"}>
                        {currentServices.internet ? "Incluido" : "No incluido"}
                      </Badge>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-internetIncluded"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Accepted Lease Durations */}
          <FormField
            control={form.control}
            name="acceptedLeaseDurations"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Duraciones de Contrato Aceptadas</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    {(property.acceptedLeaseDurations || []).map((duration) => (
                      <Badge key={duration} variant="outline">
                        {LEASE_DURATIONS.find(d => d.id === duration)?.label || duration}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {LEASE_DURATIONS.map((duration) => (
                    <FormField
                      key={duration.id}
                      control={form.control}
                      name="acceptedLeaseDurations"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={duration.id}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(duration.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, duration.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== duration.id
                                        )
                                      );
                                }}
                                data-testid={`checkbox-duration-${duration.id}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {duration.label}
                            </FormLabel>
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

          <div className="flex justify-between gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onPrevious} data-testid="button-previous">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
