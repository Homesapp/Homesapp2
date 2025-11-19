import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExternalAccounting() {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Contabilidad" : "Accounting"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Gestiona los pagos y finanzas de tus propiedades"
            : "Manage payments and finances for your properties"}
        </p>
      </div>

      <Card data-testid="card-placeholder">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-card-title">
            <DollarSign className="h-5 w-5" />
            {language === "es" ? "Calendario de Pagos" : "Payment Calendar"}
          </CardTitle>
          <CardDescription data-testid="text-card-description">
            {language === "es" 
              ? "Próximamente: Calendario de pagos con diferentes tipos (renta, servicios, HOA, etc.)"
              : "Coming soon: Payment calendar with different types (rent, utilities, HOA, etc.)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" data-testid="text-placeholder-message">
            {language === "es" 
              ? "Esta función está en desarrollo"
              : "This feature is under development"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
