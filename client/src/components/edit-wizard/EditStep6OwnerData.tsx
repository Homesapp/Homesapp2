import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const ownerDataSchema = z.object({
  ownerFirstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  ownerLastName: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  ownerPhone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  ownerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  
  hasReferral: z.boolean().default(false),
  referredByName: z.string().optional(),
  referredByLastName: z.string().optional(),
  referredByPhone: z.string().optional(),
  referredByEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  referralPercent: z.union([
    z.coerce.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
    z.literal(""),
    z.undefined(),
  ]).optional().transform(val => val === "" || val === undefined ? undefined : val),
}).superRefine((data, ctx) => {
  if (data.hasReferral) {
    if (!data.referredByName || data.referredByName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre del referido es requerido",
        path: ["referredByName"],
      });
    }
    if (!data.referredByLastName || data.referredByLastName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los apellidos del referido son requeridos",
        path: ["referredByLastName"],
      });
    }
    if (!data.referredByPhone || data.referredByPhone.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El teléfono del referido es requerido",
        path: ["referredByPhone"],
      });
    }
  }
});

type OwnerDataForm = z.infer<typeof ownerDataSchema>;

interface EditStep6Props {
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

export default function EditStep6OwnerData({ property, data, onUpdate, onNext, onPrevious }: EditStep6Props) {
  const hasCurrentReferral = !!(property.referredByName || property.referredByLastName);
  
  const form = useForm<OwnerDataForm>({
    resolver: zodResolver(ownerDataSchema),
    defaultValues: {
      ownerFirstName: data.ownerFirstName || property.ownerFirstName || "",
      ownerLastName: data.ownerLastName || property.ownerLastName || "",
      ownerPhone: data.ownerPhone || property.ownerPhone || "",
      ownerEmail: data.ownerEmail || property.ownerEmail || "",
      
      hasReferral: data.referredByName === null ? false : hasCurrentReferral,
      referredByName: data.referredByName === null ? "" : (data.referredByName || property.referredByName || ""),
      referredByLastName: data.referredByLastName === null ? "" : (data.referredByLastName || property.referredByLastName || ""),
      referredByPhone: data.referredByPhone === null ? "" : (data.referredByPhone || property.referredByPhone || ""),
      referredByEmail: data.referredByEmail === null ? "" : (data.referredByEmail || property.referredByEmail || ""),
      referralPercent: data.referralPercent === null ? undefined : (data.referralPercent ? parseFloat(data.referralPercent) : (property.referralPercent ? parseFloat(property.referralPercent.toString()) : undefined)),
    },
  });

  const hasReferral = form.watch("hasReferral");

  const onSubmit = (formData: OwnerDataForm) => {
    const modified: string[] = [];
    
    if (formData.ownerFirstName !== property.ownerFirstName) modified.push("ownerFirstName");
    if (formData.ownerLastName !== property.ownerLastName) modified.push("ownerLastName");
    if (formData.ownerPhone !== property.ownerPhone) modified.push("ownerPhone");
    if (normalizeOptionalString(formData.ownerEmail) !== normalizeOptionalString(property.ownerEmail)) modified.push("ownerEmail");
    
    // Detect if user is toggling referral off
    const wasReferral = !!(property.referredByName || property.referredByLastName || property.referredByPhone || property.referredByEmail || property.referralPercent);
    const isRemovingReferral = wasReferral && !formData.hasReferral;
    
    if (formData.hasReferral) {
      if (normalizeOptionalString(formData.referredByName) !== normalizeOptionalString(property.referredByName)) modified.push("referredByName");
      if (normalizeOptionalString(formData.referredByLastName) !== normalizeOptionalString(property.referredByLastName)) modified.push("referredByLastName");
      if (normalizeOptionalString(formData.referredByPhone) !== normalizeOptionalString(property.referredByPhone)) modified.push("referredByPhone");
      if (normalizeOptionalString(formData.referredByEmail) !== normalizeOptionalString(property.referredByEmail)) modified.push("referredByEmail");
      if (normalizeOptional(formData.referralPercent) !== normalizeOptional(property.referralPercent)) modified.push("referralPercent");
    } else if (isRemovingReferral) {
      // User is removing referral - mark all referral fields as modified for clearing
      modified.push("referredByName", "referredByLastName", "referredByPhone", "referredByEmail", "referralPercent");
    }

    const updateData: any = {
      ownerFirstName: formData.ownerFirstName,
      ownerLastName: formData.ownerLastName,
      ownerPhone: formData.ownerPhone,
      ownerEmail: formData.ownerEmail || undefined,
    };

    if (formData.hasReferral) {
      updateData.referredByName = formData.referredByName;
      updateData.referredByLastName = formData.referredByLastName;
      updateData.referredByPhone = formData.referredByPhone;
      updateData.referredByEmail = formData.referredByEmail || undefined;
      updateData.referralPercent = formData.referralPercent ? formData.referralPercent.toString() : undefined;
    } else if (isRemovingReferral) {
      // Send null values to clear referral data
      updateData.referredByName = null;
      updateData.referredByLastName = null;
      updateData.referredByPhone = null;
      updateData.referredByEmail = null;
      updateData.referralPercent = null;
    }

    onUpdate(updateData, modified);
    onNext();
  };

  const hasChanges = () => {
    const values = form.getValues();
    const formReferralPercent = values.referralPercent !== undefined ? values.referralPercent.toString() : undefined;
    const propReferralPercent = (property.referralPercent !== undefined && property.referralPercent !== null) ? property.referralPercent.toString() : undefined;
    
    return (
      values.ownerFirstName !== property.ownerFirstName ||
      values.ownerLastName !== property.ownerLastName ||
      values.ownerPhone !== property.ownerPhone ||
      values.ownerEmail !== (property.ownerEmail || "") ||
      (values.hasReferral && (
        values.referredByName !== (property.referredByName || "") ||
        values.referredByLastName !== (property.referredByLastName || "") ||
        values.referredByPhone !== (property.referredByPhone || "") ||
        values.referredByEmail !== (property.referredByEmail || "") ||
        formReferralPercent !== propReferralPercent
      ))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Datos del Propietario</h3>
        <p className="text-sm text-muted-foreground">
          Información del propietario y datos de referidos (solo visible para admin)
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
          {/* Owner Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Información del Propietario</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    {property.ownerFirstName && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Actual:</span>
                        <Badge variant="outline" className="text-xs">{property.ownerFirstName}</Badge>
                      </div>
                    )}
                    <FormControl>
                      <Input {...field} placeholder="Nombre" data-testid="input-ownerFirstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    {property.ownerLastName && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Actual:</span>
                        <Badge variant="outline" className="text-xs">{property.ownerLastName}</Badge>
                      </div>
                    )}
                    <FormControl>
                      <Input {...field} placeholder="Apellidos" data-testid="input-ownerLastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono WhatsApp</FormLabel>
                  {property.ownerPhone && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Actual:</span>
                      <Badge variant="outline" className="text-xs">{property.ownerPhone}</Badge>
                    </div>
                  )}
                  <FormControl>
                    <Input {...field} placeholder="+52 999 123 4567" data-testid="input-ownerPhone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  {property.ownerEmail && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Actual:</span>
                      <Badge variant="outline" className="text-xs">{property.ownerEmail}</Badge>
                    </div>
                  )}
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@ejemplo.com" data-testid="input-ownerEmail" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Referral Information */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="hasReferral"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Esta propiedad fue referida por alguien</FormLabel>
                    <FormDescription>
                      Si un vendedor refirió esta propiedad, activa esta opción
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-hasReferral"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {hasReferral && (
              <>
                <h4 className="font-medium">Datos del Referido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referredByName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre" data-testid="input-referredByName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referredByLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Apellidos" data-testid="input-referredByLastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="referredByPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+52 999 123 4567" data-testid="input-referredByPhone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredByEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@ejemplo.com" data-testid="input-referredByEmail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de Comisión</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" max="100" step="0.01" placeholder="20.00" data-testid="input-referralPercent" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
