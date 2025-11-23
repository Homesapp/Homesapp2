import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChangeReviewStepProps {
  originalData: Record<string, any>;
  newData: Record<string, any>;
  fieldLabels: Record<string, string>;
  language?: "es" | "en";
}

export default function ChangeReviewStep({
  originalData,
  newData,
  fieldLabels,
  language = "es",
}: ChangeReviewStepProps) {
  const modifiedFields = Object.keys(newData).filter((key) => {
    const originalValue = originalData[key];
    const newValue = newData[key];
    
    // Normalize for comparison
    if (originalValue === newValue) return false;
    if (originalValue == null && newValue === "") return false;
    if (newValue == null && originalValue === "") return false;
    if (originalValue == null && newValue == null) return false;
    
    return JSON.stringify(originalValue) !== JSON.stringify(newValue);
  });

  const renderValue = (value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">{language === "es" ? "No especificado" : "Not specified"}</span>;
    }

    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? (language === "es" ? "Sí" : "Yes") : "No"}</Badge>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">{language === "es" ? "Sin elementos" : "No items"}</span>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <Badge key={idx} variant="outline">
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted p-2 rounded max-w-full overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span>{String(value)}</span>;
  };

  if (modifiedFields.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{language === "es" ? "Sin Cambios" : "No Changes"}</AlertTitle>
        <AlertDescription>
          {language === "es" 
            ? "No has realizado ningún cambio. Puedes volver atrás para hacer modificaciones."
            : "You haven't made any changes. You can go back to make modifications."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4" data-testid="change-review-step">
      <div className="space-y-4">
        {modifiedFields.map((field) => {
          const originalValue = originalData[field];
          const newValue = newData[field];
          const label = fieldLabels[field] || field;

          return (
            <Card key={field} data-testid={`change-${field}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "es" ? "Valor Actual" : "Current Value"}
                    </p>
                    <div className="text-sm">{renderValue(originalValue)}</div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "es" ? "Nuevo Valor" : "New Value"}
                    </p>
                    <div className="text-sm font-medium">{renderValue(newValue)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-4" />
      
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {language === "es" 
            ? `Se actualizarán ${modifiedFields.length} campo(s). Haz clic en "Guardar Cambios" para confirmar.`
            : `${modifiedFields.length} field(s) will be updated. Click "Save Changes" to confirm.`}
        </p>
      </div>
    </div>
  );
}
