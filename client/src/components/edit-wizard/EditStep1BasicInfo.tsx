import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const step1Schema = z.object({
  status: z.string(),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").optional(),
  propertyType: z.string(),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  salePrice: z.union([
    z.coerce.number().min(0, "El precio de venta debe ser mayor o igual a 0"),
    z.literal(""),
    z.undefined(),
  ]).optional().transform(val => val === "" || val === undefined ? undefined : val),
  currency: z.string(),
});

type Step1Form = z.infer<typeof step1Schema>;

interface EditStep1Props {
  property: Property;
  data: EditWizardData;
  onUpdate: (data: Partial<EditWizardData>, modifiedFields?: string[]) => void;
  onNext: () => void;
}

const PROPERTY_TYPES = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "studio", label: "Estudio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
];

const PROPERTY_STATUS = [
  { value: "available", label: "Disponible" },
  { value: "rented", label: "Rentada" },
  { value: "sold", label: "Vendida" },
  { value: "maintenance", label: "En Mantenimiento" },
];

const CURRENCIES = [
  { value: "MXN", label: "Pesos Mexicanos (MXN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
];

// Helper to normalize optional values for comparison (treat null and undefined as equivalent)
const normalizeOptional = (val: any) => (val === undefined || val === null) ? null : val;
// Helper for string fields: treat null, undefined, and empty string as equivalent
const normalizeOptionalString = (val: any) => (val === undefined || val === null || val === "") ? null : val;

export default function EditStep1BasicInfo({ property, data, onUpdate, onNext }: EditStep1Props) {
  const form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      status: data.status || property.status || "available",
      description: data.description || property.description || "",
      propertyType: data.propertyType || property.propertyType || "house",
      price: parseFloat(data.price || property.price?.toString() || "0"),
      salePrice: data.salePrice === null ? undefined : (data.salePrice ? parseFloat(data.salePrice) : (property.salePrice ? parseFloat(property.salePrice.toString()) : undefined)),
      currency: data.currency || property.currency || "MXN",
    },
  });

  const onSubmit = (formData: Step1Form) => {
    // Track which fields were modified
    const modified: string[] = [];
    
    if (formData.status !== property.status) modified.push("status");
    if (normalizeOptionalString(formData.description) !== normalizeOptionalString(property.description)) modified.push("description");
    if (formData.propertyType !== property.propertyType) modified.push("propertyType");
    if (formData.price !== property.price) modified.push("price");
    if (normalizeOptional(formData.salePrice) !== normalizeOptional(property.salePrice)) modified.push("salePrice");
    if (formData.currency !== property.currency) modified.push("currency");

    // Detect if salePrice was cleared (had value, now undefined)
    const wasSalePrice = property.salePrice !== undefined && property.salePrice !== null;
    const isCleared = wasSalePrice && formData.salePrice === undefined;
    
    onUpdate({
      status: formData.status,
      description: formData.description,
      propertyType: formData.propertyType,
      price: formData.price.toString(),
      salePrice: isCleared ? null : (formData.salePrice ? formData.salePrice.toString() : undefined),
      currency: formData.currency,
    }, modified);
    
    onNext();
  };

  // Check if any field has been modified
  const hasChanges = () => {
    const values = form.getValues();
    const formSalePrice = values.salePrice !== undefined ? values.salePrice.toString() : undefined;
    const propSalePrice = (property.salePrice !== undefined && property.salePrice !== null) ? property.salePrice.toString() : undefined;
    
    return (
      values.status !== property.status ||
      values.description !== property.description ||
      values.propertyType !== property.propertyType ||
      values.price.toString() !== (property.price?.toString() || "0") ||
      formSalePrice !== propSalePrice ||
      values.currency !== property.currency
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Información Básica</h3>
        <p className="text-sm text-muted-foreground">
          Modifica los detalles principales de la propiedad
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
          {/* Property Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de la Propiedad</FormLabel>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <Badge variant="outline">
                    {PROPERTY_STATUS.find(s => s.value === property.status)?.label || property.status}
                  </Badge>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTY_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormDescription className="text-xs">
                  Describe la propiedad en detalle
                </FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descripción de la propiedad..."
                    rows={4}
                    data-testid="input-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Property Type */}
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Propiedad</FormLabel>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <Badge variant="outline">
                    {PROPERTY_TYPES.find(t => t.value === property.propertyType)?.label || property.propertyType}
                  </Badge>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-propertyType">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <Badge variant="outline">{property.currency}</Badge>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rental Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Renta Mensual</FormLabel>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <Badge variant="outline">
                    {property.currency} ${property.price}
                  </Badge>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sale Price (Optional) */}
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta (Opcional)</FormLabel>
                {property.salePrice && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">
                      {property.currency} ${property.salePrice}
                    </Badge>
                  </div>
                )}
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00 (dejar vacío si no aplica)"
                    data-testid="input-salePrice"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              data-testid="button-next"
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
