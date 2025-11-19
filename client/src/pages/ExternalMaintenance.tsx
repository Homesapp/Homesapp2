import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExternalMaintenance() {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? "Mantenimiento" : "Maintenance"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Gestiona el mantenimiento y servicios de tus propiedades"
            : "Manage maintenance and services for your properties"}
        </p>
      </div>

      <Card data-testid="card-placeholder">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-card-title">
            <Wrench className="h-5 w-5" />
            {language === "es" ? "Calendario de Mantenimiento" : "Maintenance Calendar"}
          </CardTitle>
          <CardDescription data-testid="text-card-description">
            {language === "es" 
              ? "Próximamente: Calendario de servicios y tickets de mantenimiento"
              : "Coming soon: Service calendar and maintenance tickets"}
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
