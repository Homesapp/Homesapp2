import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PropertyOwnerTerms } from "@shared/schema";

export default function AdminPropertyOwnerTerms() {
  const { toast } = useToast();
  const [contentEs, setContentEs] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [termId, setTermId] = useState<string | null>(null);

  const { data: terms = [], isLoading } = useQuery<PropertyOwnerTerms[]>({
    queryKey: ["/api/property-owner-terms"],
  });

  // Load the first active term when data loads
  useEffect(() => {
    if (terms.length > 0) {
      const activeTerm = terms.find(t => t.isActive) || terms[0];
      setContentEs(activeTerm.content || "");
      setContentEn(activeTerm.contentEn || "");
      setTermId(activeTerm.id);
    }
  }, [terms]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title: "Términos y Condiciones del Propietario",
        titleEn: "Property Owner Terms and Conditions",
        content: contentEs,
        contentEn: contentEn,
        orderIndex: 0,
        isActive: true,
      };

      if (termId) {
        // Update existing term
        return await apiRequest("PATCH", `/api/property-owner-terms/${termId}`, data);
      } else {
        // Create new term
        return await apiRequest("POST", "/api/property-owner-terms", data);
      }
    },
    onSuccess: (response) => {
      toast({
        title: "Términos guardados",
        description: "Los términos y condiciones han sido guardados exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-owner-terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/property-owner-terms/active"] });
      
      // Update termId if it was a new creation
      if (!termId && response?.id) {
        setTermId(response.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los términos",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate that at least one language has content
    const hasSpanishContent = contentEs.trim().length > 0;
    const hasEnglishContent = contentEn.trim().length > 0;
    
    if (!hasSpanishContent && !hasEnglishContent) {
      toast({
        title: "Validación requerida",
        description: "Debes proporcionar términos y condiciones en al menos un idioma (español o inglés).",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
        </div>
        <p className="text-muted-foreground">
          Edita los términos y condiciones que verán los propietarios al enviar sus propiedades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor de Términos</CardTitle>
          <CardDescription>
            Escribe el contenido de los términos y condiciones en español e inglés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="es" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="es" data-testid="tab-spanish">
                Español
              </TabsTrigger>
              <TabsTrigger value="en" data-testid="tab-english">
                English
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="es" className="space-y-4">
              <div>
                <Textarea
                  placeholder="Escribe los términos y condiciones en español..."
                  value={contentEs}
                  onChange={(e) => setContentEs(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  data-testid="textarea-terms-es"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="en" className="space-y-4">
              <div>
                <Textarea
                  placeholder="Write the terms and conditions in English..."
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  data-testid="textarea-terms-en"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || (!contentEs && !contentEn)}
              size="lg"
              data-testid="button-save-terms"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Guardando..." : "Guardar Términos"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
