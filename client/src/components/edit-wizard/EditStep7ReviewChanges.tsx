import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Save, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

interface EditStep7Props {
  property: Property;
  data: EditWizardData;
  modifiedFields: Set<string>;
  onPrevious: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  status: "Estado",
  description: "Descripción",
  propertyType: "Tipo de Propiedad",
  price: "Precio de Renta",
  salePrice: "Precio de Venta",
  currency: "Moneda",
  location: "Ubicación",
  bedrooms: "Habitaciones",
  bathrooms: "Baños",
  area: "Área",
  petFriendly: "Acepta Mascotas",
  allowsSubleasing: "Permite Subarriendo",
  googleMapsUrl: "URL de Google Maps",
  unitNumber: "Número de Unidad",
  primaryImages: "Imágenes Principales",
  coverImageIndex: "Imagen de Portada",
  secondaryImages: "Imágenes Secundarias",
  virtualTourUrl: "Tour Virtual",
  includedServices: "Servicios Incluidos",
  acceptedLeaseDurations: "Duraciones de Contrato",
  accessInfo: "Información de Acceso",
  ownerFirstName: "Nombre del Propietario",
  ownerLastName: "Apellidos del Propietario",
  ownerPhone: "Teléfono del Propietario",
  ownerEmail: "Email del Propietario",
  referredByName: "Nombre del Referido",
  referredByLastName: "Apellidos del Referido",
  referredByPhone: "Teléfono del Referido",
  referredByEmail: "Email del Referido",
  referralPercent: "Porcentaje de Comisión",
};

export default function EditStep7ReviewChanges({
  property,
  data,
  modifiedFields,
  onPrevious,
  onSave,
  isSaving,
}: EditStep7Props) {
  const changesArray = Array.from(modifiedFields);

  const renderValue = (field: string, value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">No especificado</span>;
    }

    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? "Sí" : "No"}</Badge>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">Sin elementos</span>;
      }
      if (field.includes("Images")) {
        return <Badge variant="outline">{value.length} imagen(es)</Badge>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <Badge key={idx} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted p-2 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span>{value}</span>;
  };

  const getOriginalValue = (field: string) => {
    return (property as any)[field];
  };

  const getNewValue = (field: string) => {
    return (data as any)[field];
  };

  if (changesArray.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Resumen de Cambios</h3>
          <p className="text-sm text-muted-foreground">
            Revisa los cambios antes de guardar
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin Cambios</AlertTitle>
          <AlertDescription>
            No has realizado ningún cambio en la propiedad. Puedes volver atrás para hacer modificaciones o cerrar el wizard.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onPrevious} data-testid="button-previous">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Resumen de Cambios</h3>
        <p className="text-sm text-muted-foreground">
          Revisa los cambios antes de guardar. Se han detectado {changesArray.length} cambio(s).
        </p>
      </div>

      <Alert>
        <Check className="h-4 w-4" />
        <AlertTitle>Cambios Detectados</AlertTitle>
        <AlertDescription>
          Los siguientes campos serán actualizados al guardar los cambios.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {changesArray.map((field) => (
          <Card key={field}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">{FIELD_LABELS[field] || field}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Valor Actual</div>
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    {renderValue(field, getOriginalValue(field))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Nuevo Valor</div>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    {renderValue(field, getNewValue(field))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Confirmación</h4>
        <p className="text-sm text-muted-foreground">
          Al hacer clic en "Guardar Cambios", se actualizarán los {changesArray.length} campo(s) modificados.
          Esta acción no se puede deshacer.
        </p>
      </div>

      <div className="flex justify-between gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSaving}
          data-testid="button-previous"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          data-testid="button-save"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
