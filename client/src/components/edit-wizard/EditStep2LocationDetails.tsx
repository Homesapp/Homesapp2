import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const step2Schema = z.object({
  location: z.string().min(5, "La ubicación debe tener al menos 5 caracteres"),
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.coerce.number().min(0, "Los baños deben ser un número positivo"),
  area: z.union([
    z.coerce.number().min(0, "El área debe ser mayor o igual a 0"),
    z.literal(""),
    z.undefined(),
  ]).optional().transform(val => val === "" || val === undefined ? undefined : val),
  petFriendly: z.boolean(),
  allowsSubleasing: z.boolean(),
  googleMapsUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  unitNumber: z.string().optional(),
});

type Step2Form = z.infer<typeof step2Schema>;

interface EditStep2Props {
  property: Property;
  data: EditWizardData;
  onUpdate: (data: Partial<EditWizardData>, modifiedFields?: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Helper to normalize optional values for comparison (treat null and undefined as equivalent)
const normalizeOptional = (val: any) => (val === undefined || val === null) ? null : val;
// Helper for string fields: treat null, undefined, and empty string as equivalent
const normalizeOptionalString = (val: any) => (val === undefined || val === null || val === "") ? null : val;

export default function EditStep2LocationDetails({ property, data, onUpdate, onNext, onPrevious }: EditStep2Props) {
  const form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      location: data.location || property.location || "",
      bedrooms: data.bedrooms ? parseFloat(data.bedrooms) : (property.bedrooms ?? 0),
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : (property.bathrooms ?? 0),
      area: data.area === null ? undefined : (data.area ? parseFloat(data.area) : (property.area ? parseFloat(property.area.toString()) : undefined)),
      petFriendly: data.petFriendly ?? property.petFriendly ?? false,
      allowsSubleasing: data.allowsSubleasing ?? property.allowsSubleasing ?? false,
      googleMapsUrl: data.googleMapsUrl || property.googleMapsUrl || "",
      unitNumber: data.unitNumber || property.unitNumber || "",
    },
  });

  const onSubmit = (formData: Step2Form) => {
    const modified: string[] = [];
    
    if (formData.location !== property.location) modified.push("location");
    if (formData.bedrooms !== property.bedrooms) modified.push("bedrooms");
    if (formData.bathrooms !== property.bathrooms) modified.push("bathrooms");
    if (normalizeOptional(formData.area) !== normalizeOptional(property.area)) modified.push("area");
    if (formData.petFriendly !== property.petFriendly) modified.push("petFriendly");
    if (formData.allowsSubleasing !== property.allowsSubleasing) modified.push("allowsSubleasing");
    if (normalizeOptionalString(formData.googleMapsUrl) !== normalizeOptionalString(property.googleMapsUrl)) modified.push("googleMapsUrl");
    if (normalizeOptionalString(formData.unitNumber) !== normalizeOptionalString(property.unitNumber)) modified.push("unitNumber");

    // Detect if area was cleared (had value, now undefined)
    const wasArea = property.area !== undefined && property.area !== null;
    const isAreaCleared = wasArea && formData.area === undefined;
    
    onUpdate({
      location: formData.location,
      bedrooms: formData.bedrooms.toString(),
      bathrooms: formData.bathrooms.toString(),
      area: isAreaCleared ? null : (formData.area ? formData.area.toString() : undefined),
      petFriendly: formData.petFriendly,
      allowsSubleasing: formData.allowsSubleasing,
      googleMapsUrl: formData.googleMapsUrl || undefined,
      unitNumber: formData.unitNumber || undefined,
    }, modified);
    
    onNext();
  };

  const hasChanges = () => {
    const values = form.getValues();
    const formArea = values.area !== undefined ? values.area.toString() : undefined;
    const propArea = (property.area !== undefined && property.area !== null) ? property.area.toString() : undefined;
    
    return (
      values.location !== property.location ||
      values.bedrooms.toString() !== (property.bedrooms?.toString() || "0") ||
      values.bathrooms.toString() !== (property.bathrooms?.toString() || "0") ||
      formArea !== propArea ||
      values.petFriendly !== (property.petFriendly ?? false) ||
      values.allowsSubleasing !== (property.allowsSubleasing ?? false) ||
      values.googleMapsUrl !== (property.googleMapsUrl || "") ||
      values.unitNumber !== property.unitNumber
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Ubicación y Detalles</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza la ubicación y características de la propiedad
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
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <Badge variant="outline">{property.location}</Badge>
                </div>
                <FormControl>
                  <Input {...field} placeholder="Dirección completa" data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Unidad</FormLabel>
                {property.unitNumber && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">{property.unitNumber}</Badge>
                  </div>
                )}
                <FormControl>
                  <Input {...field} placeholder="Ej: 101, A-3, etc." data-testid="input-unitNumber" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habitaciones</FormLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">{property.bedrooms}</Badge>
                  </div>
                  <FormControl>
                    <Input {...field} type="number" min="0" data-testid="input-bedrooms" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baños</FormLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">{property.bathrooms}</Badge>
                  </div>
                  <FormControl>
                    <Input {...field} type="number" min="0" step="0.5" data-testid="input-bathrooms" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área (m²)</FormLabel>
                {property.area && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">{property.area} m²</Badge>
                  </div>
                )}
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" placeholder="Metros cuadrados" data-testid="input-area" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="googleMapsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Google Maps (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://maps.google.com/..." data-testid="input-googleMapsUrl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="petFriendly"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Acepta Mascotas</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actual:</span>
                      <Badge variant={property.petFriendly ? "default" : "secondary"}>
                        {property.petFriendly ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-petFriendly"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowsSubleasing"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permite Subarriendo</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actual:</span>
                      <Badge variant={property.allowsSubleasing ? "default" : "secondary"}>
                        {property.allowsSubleasing ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-allowsSubleasing"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

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
