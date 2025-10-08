import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  Trash2,
  Download,
  Shield
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, PropertyDocument } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const documentTypeLabels: Record<string, string> = {
  ife_ine_frente: "IFE/INE (Frente)",
  ife_ine_reverso: "IFE/INE (Reverso)",
  pasaporte: "Pasaporte",
  legal_estancia: "Legal Estancia en México",
  escrituras: "Escrituras de la Propiedad",
  contrato_compraventa: "Contrato de Compraventa",
  fideicomiso: "Fideicomiso",
  acta_constitutiva: "Acta Constitutiva",
  recibo_agua: "Recibo de Agua",
  recibo_luz: "Recibo de Luz",
  recibo_internet: "Recibo de Internet/Cable",
  comprobante_no_adeudo: "Comprobante de No Adeudo",
  reglas_internas: "Reglas Internas",
  reglamento_condominio: "Reglamento del Condominio",
};

const requiredDocsPersonaFisica = [
  'ife_ine_frente',
  'ife_ine_reverso',
  'escrituras',
  'recibo_agua',
  'recibo_luz',
  'comprobante_no_adeudo'
];

const requiredDocsPersonaMoral = [
  'acta_constitutiva',
  'ife_ine_frente',
  'ife_ine_reverso',
  'escrituras',
  'recibo_agua',
  'recibo_luz',
  'comprobante_no_adeudo'
];

const optionalDocs = [
  'reglas_internas',
  'reglamento_condominio'
];

export default function PropertyDocuments() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: [`/api/owner/properties/${id}`],
    enabled: !!id,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<PropertyDocument[]>({
    queryKey: [`/api/properties/${id}/documents`],
    enabled: !!id,
  });

  const { data: checkStatus } = useQuery<{
    complete: boolean;
    missing: string[];
    validated: boolean;
    unvalidated: string[];
    category?: 'persona_fisica' | 'persona_moral';
  }>({
    queryKey: [`/api/properties/${id}/documents/check`],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      return await apiRequest(`/api/property-documents/${docId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}/documents/check`] });
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado exitosamente",
      });
      setDeleteDocId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el documento",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ documentType, category, fileUrl, fileName, fileSize, mimeType }: { 
      documentType: string; 
      category: string; 
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }) => {
      return await apiRequest(`/api/properties/${id}/documents`, {
        method: "POST",
        body: JSON.stringify({
          documentType,
          category,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          isRequired: true,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}/documents/check`] });
      toast({
        title: "Documento subido",
        description: "El documento ha sido subido exitosamente y está pendiente de validación",
      });
      setUploadingType(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo subir el documento",
      });
      setUploadingType(null);
    },
  });

  const handleFileChange = (documentType: string, category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadingType(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten imágenes o archivos PDF",
      });
      setUploadingType(null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo no debe superar los 5MB",
      });
      setUploadingType(null);
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      uploadMutation.mutate({
        documentType,
        category,
        fileUrl: base64String,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo leer el archivo",
      });
      setUploadingType(null);
    };
    reader.readAsDataURL(file);
  };

  const renderDocumentCard = (docType: string, category: 'persona_fisica' | 'persona_moral' | 'optional') => {
    const doc = documents.find(d => d.documentType === docType && d.category === category);
    const isUploading = uploadingType === docType;

    return (
      <Card key={docType} className="p-4" data-testid={`card-document-${docType}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-muted rounded-md">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium mb-1">{documentTypeLabels[docType]}</h4>
              {doc ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {doc.isValidated ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Validado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Pendiente validación
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{doc.fileName}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No subido</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(doc.fileUrl, '_blank')}
                  data-testid={`button-download-${docType}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteDocId(doc.id)}
                  data-testid={`button-delete-${docType}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div>
                <input
                  type="file"
                  id={`upload-${docType}`}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(docType, category, e)}
                  disabled={isUploading || uploadMutation.isPending}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadingType(docType);
                    document.getElementById(`upload-${docType}`)?.click();
                  }}
                  disabled={isUploading || uploadMutation.isPending}
                  data-testid={`button-upload-${docType}`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (propertyLoading || documentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Propiedad no encontrada</h2>
          <Button onClick={() => setLocation("/owner/properties")}>
            Volver a Mis Propiedades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/owner/property/${id}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Documentación de Propiedad</h1>
          <p className="text-muted-foreground mt-1">{property.title}</p>
        </div>
      </div>

      {checkStatus && (
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Estado de Documentación</CardTitle>
                  <CardDescription>
                    {checkStatus.category === 'persona_moral' ? 'Persona Moral' : 'Persona Física'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {checkStatus.complete ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completo
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Incompleto
                  </Badge>
                )}
                {checkStatus.complete && !checkStatus.validated && (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Pendiente validación
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          {(!checkStatus.complete || !checkStatus.validated) && (
            <CardContent>
              {!checkStatus.complete && checkStatus.missing.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Documentos faltantes:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {checkStatus.missing.map(type => (
                      <li key={type}>{documentTypeLabels[type] || type}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!checkStatus.validated && checkStatus.unvalidated.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Documentos pendientes de validación:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {checkStatus.unvalidated.map(type => (
                      <li key={type}>{documentTypeLabels[type] || type}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Tabs defaultValue="persona_fisica" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="persona_fisica" data-testid="tab-persona-fisica">
            Persona Física
          </TabsTrigger>
          <TabsTrigger value="persona_moral" data-testid="tab-persona-moral">
            Persona Moral
          </TabsTrigger>
          <TabsTrigger value="optional" data-testid="tab-optional">
            Opcionales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona_fisica" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Documentos Requeridos - Persona Física</h3>
            <p className="text-sm text-muted-foreground">
              Todos estos documentos son obligatorios para aprobar la propiedad
            </p>
          </div>
          <div className="space-y-3">
            {requiredDocsPersonaFisica.map(docType => 
              renderDocumentCard(docType, 'persona_fisica')
            )}
          </div>
        </TabsContent>

        <TabsContent value="persona_moral" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Documentos Requeridos - Persona Moral</h3>
            <p className="text-sm text-muted-foreground">
              Todos estos documentos son obligatorios para aprobar la propiedad
            </p>
          </div>
          <div className="space-y-3">
            {requiredDocsPersonaMoral.map(docType => 
              renderDocumentCard(docType, 'persona_moral')
            )}
          </div>
        </TabsContent>

        <TabsContent value="optional" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Documentos Opcionales</h3>
            <p className="text-sm text-muted-foreground">
              Estos documentos son opcionales pero recomendados
            </p>
          </div>
          <div className="space-y-3">
            {optionalDocs.map(docType => 
              renderDocumentCard(docType, 'optional')
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId && deleteMutation.mutate(deleteDocId)}
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
