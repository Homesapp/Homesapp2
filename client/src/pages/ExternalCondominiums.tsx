import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, AlertCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExternalCondominium } from "@shared/schema";

export default function ExternalCondominiums() {
  const { language } = useLanguage();

  const { data: condominiums, isLoading, isError, error } = useQuery<ExternalCondominium[]>({
    queryKey: ['/api/external-condominiums'],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === "es" ? "Condominios y Unidades" : "Condominiums & Units"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "es" 
              ? "Gestiona tus condominios y unidades"
              : "Manage your condominiums and units"}
          </p>
        </div>
        <Button data-testid="button-add-condominium">
          <Plus className="mr-2 h-4 w-4" />
          {language === "es" ? "Agregar Condominio" : "Add Condominium"}
        </Button>
      </div>

      {isError ? (
        <Card data-testid="card-error-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium" data-testid="text-error-title">
              {language === "es" ? "Error al cargar condominios" : "Error loading condominiums"}
            </p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-error-message">
              {error instanceof Error ? error.message : language === "es" ? "Ocurrió un error inesperado" : "An unexpected error occurred"}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : condominiums && condominiums.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {condominiums.map((condo) => (
            <Card key={condo.id} data-testid={`card-condominium-${condo.id}`} className="hover-elevate active-elevate-2 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {condo.name}
                </CardTitle>
                <CardDescription>
                  {condo.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {language === "es" ? "Total de unidades:" : "Total units:"} <span className="font-semibold">{condo.totalUnits}</span>
                </div>
                {condo.description && (
                  <p className="text-sm mt-2 line-clamp-2">{condo.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium" data-testid="text-empty-title">
              {language === "es" ? "No hay condominios registrados" : "No condominiums registered"}
            </p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-description">
              {language === "es" 
                ? "Agrega tu primer condominio para comenzar"
                : "Add your first condominium to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
