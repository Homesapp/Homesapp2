import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const accessInfoSchema = z.object({
  accessType: z.enum(["unattended", "attended"]),
  method: z.enum(["lockbox", "smart_lock"]).optional(),
  lockboxCode: z.string().optional(),
  lockboxLocation: z.string().optional(),
  smartLockInstructions: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactNotes: z.string().optional(),
});

type AccessInfoForm = z.infer<typeof accessInfoSchema>;

interface EditStep5Props {
  property: Property;
  data: EditWizardData;
  onUpdate: (data: Partial<EditWizardData>, modifiedFields?: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function EditStep5AccessInfo({ property, data, onUpdate, onNext, onPrevious }: EditStep5Props) {
  const currentAccessInfo = (property.accessInfo as any) || {};
  const currentDataAccessInfo = (data.accessInfo as any) || {};
  
  const form = useForm<AccessInfoForm>({
    resolver: zodResolver(accessInfoSchema),
    defaultValues: {
      accessType: currentDataAccessInfo.accessType || currentAccessInfo.accessType || "unattended",
      method: currentDataAccessInfo.method || currentAccessInfo.method || "lockbox",
      lockboxCode: currentDataAccessInfo.lockboxCode || currentAccessInfo.lockboxCode || "",
      lockboxLocation: currentDataAccessInfo.lockboxLocation || currentAccessInfo.lockboxLocation || "",
      smartLockInstructions: currentDataAccessInfo.smartLockInstructions || currentAccessInfo.smartLockInstructions || "",
      contactPerson: currentDataAccessInfo.contactPerson || currentAccessInfo.contactPerson || "",
      contactPhone: currentDataAccessInfo.contactPhone || currentAccessInfo.contactPhone || "",
      contactNotes: currentDataAccessInfo.contactNotes || currentAccessInfo.contactNotes || "",
    },
  });

  const accessType = form.watch("accessType");
  const method = form.watch("method");

  const onSubmit = (formData: AccessInfoForm) => {
    const modified: string[] = [];
    
    if (JSON.stringify(formData) !== JSON.stringify(currentAccessInfo)) {
      modified.push("accessInfo");
    }

    onUpdate({
      accessInfo: formData,
    }, modified);
    
    onNext();
  };

  const hasChanges = () => {
    const values = form.getValues();
    return JSON.stringify(values) !== JSON.stringify(currentAccessInfo);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Información de Acceso</h3>
        <p className="text-sm text-muted-foreground">
          Configura cómo el personal puede acceder a la propiedad
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
          {/* Access Type */}
          <FormField
            control={form.control}
            name="accessType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Acceso</FormLabel>
                {currentAccessInfo.accessType && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Actual:</span>
                    <Badge variant="outline">
                      {currentAccessInfo.accessType === "unattended" ? "Desatendido" : "Atendido"}
                    </Badge>
                  </div>
                )}
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="unattended" data-testid="radio-access-unattended" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Acceso Desatendido (Lockbox o Smart Lock)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="attended" data-testid="radio-access-attended" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Acceso Atendido (Persona de Contacto)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unattended Access */}
          {accessType === "unattended" && (
            <>
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Método de Acceso</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="lockbox" data-testid="radio-method-lockbox" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Lockbox (Caja de seguridad con código)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="smart_lock" data-testid="radio-method-smartlock" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Smart Lock (Cerradura inteligente)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {method === "lockbox" && (
                <>
                  <FormField
                    control={form.control}
                    name="lockboxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código del Lockbox</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: 1234" data-testid="input-lockboxCode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lockboxLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación del Lockbox</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: En la puerta principal, gancho derecho" data-testid="input-lockboxLocation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {method === "smart_lock" && (
                <FormField
                  control={form.control}
                  name="smartLockInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones del Smart Lock</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Explica cómo usar el smart lock..." rows={3} data-testid="input-smartLockInstructions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {/* Attended Access */}
          {accessType === "attended" && (
            <>
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo" data-testid="input-contactPerson" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+52 999 123 4567" data-testid="input-contactPhone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Instrucciones especiales..." rows={3} data-testid="input-contactNotes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

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
