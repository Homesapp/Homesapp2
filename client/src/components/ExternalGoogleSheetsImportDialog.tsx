import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileSpreadsheet, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Building2,
  Home,
  MapPin,
  Bed,
  Bath,
  DollarSign,
  Loader2,
  FileWarning
} from "lucide-react";

interface ParsedUnit {
  sheetRowId: string;
  zone: string;
  condominiumName: string;
  unitNumber: string;
  floor: string | null;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  commissionType: 'completa' | 'referido';
  petFriendly: boolean;
  allowsSublease: boolean;
  virtualTourUrl: string | null;
  googleMapsUrl: string | null;
  photosDriveLink: string | null;
  includedServices: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
  };
}

interface PreviewResponse {
  success: boolean;
  totalRows: number;
  sheetName: string;
  preview: ParsedUnit[];
  condominiums: string[];
}

interface ImportResponse {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
  totalErrors: number;
  totalProcessed: number;
}

interface ExternalGoogleSheetsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRH_SPREADSHEET_ID = "1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4";

export default function ExternalGoogleSheetsImportDialog({ 
  open, 
  onOpenChange 
}: ExternalGoogleSheetsImportDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [spreadsheetId, setSpreadsheetId] = useState(TRH_SPREADSHEET_ID);
  const [sheetName, setSheetName] = useState("Renta/Long Term");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'done'>('input');
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/external-units/sheet-preview?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error loading preview");
      }
      return response.json() as Promise<PreviewResponse>;
    },
    onSuccess: (data) => {
      setPreview(data);
      setStep('preview');
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (params: { startRow: number; limit: number }) => {
      const response = await apiRequest('POST', '/api/external-units/import-from-sheet', {
        spreadsheetId,
        sheetName,
        startRow: params.startRow,
        limit: params.limit,
        dryRun: false,
      });
      return response as ImportResponse;
    },
    onSuccess: (data) => {
      setImportResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error de importación" : "Import Error",
        description: error.message,
        variant: "destructive",
      });
      setStep('preview');
    },
  });

  const handlePreview = () => {
    previewMutation.mutate();
  };

  const handleImport = async () => {
    if (!preview) return;
    
    setStep('importing');
    setImportProgress(0);
    
    const batchSize = 100;
    const totalRows = preview.totalRows;
    let currentRow = 2;
    let totalImported = 0;
    let totalUpdated = 0;
    let allErrors: string[] = [];
    
    while (currentRow <= totalRows + 1) {
      try {
        const result = await apiRequest('POST', '/api/external-units/import-from-sheet', {
          spreadsheetId,
          sheetName,
          startRow: currentRow,
          limit: batchSize,
          dryRun: false,
        }) as ImportResponse;
        
        totalImported += result.imported;
        totalUpdated += result.updated;
        allErrors = [...allErrors, ...result.errors];
        
        currentRow += batchSize;
        setImportProgress(Math.min((currentRow / totalRows) * 100, 100));
      } catch (err: any) {
        allErrors.push(`Batch error at row ${currentRow}: ${err.message}`);
        currentRow += batchSize;
      }
    }
    
    setImportResult({
      success: true,
      imported: totalImported,
      updated: totalUpdated,
      errors: allErrors.slice(0, 10),
      totalErrors: allErrors.length,
      totalProcessed: totalRows,
    });
    setStep('done');
    
    queryClient.invalidateQueries({ queryKey: ['/api/external-units'] });
    queryClient.invalidateQueries({ queryKey: ['/api/external-condominiums'] });
  };

  const handleClose = () => {
    setStep('input');
    setPreview(null);
    setImportResult(null);
    setImportProgress(0);
    onOpenChange(false);
  };

  const floorLabel = (floor: string | null) => {
    if (!floor) return "-";
    const labels: Record<string, string> = {
      planta_baja: language === "es" ? "PB" : "Ground",
      primer_piso: "1°",
      segundo_piso: "2°",
      tercer_piso: "3°",
      penthouse: "PH",
    };
    return labels[floor] || floor;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {language === "es" ? "Importar desde Google Sheets" : "Import from Google Sheets"}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && (language === "es" 
              ? "Importa propiedades desde tu hoja de cálculo de Google Sheets"
              : "Import properties from your Google Sheets spreadsheet")}
            {step === 'preview' && (language === "es"
              ? "Revisa los datos antes de importar"
              : "Review data before importing")}
            {step === 'importing' && (language === "es"
              ? "Importando datos..."
              : "Importing data...")}
            {step === 'done' && (language === "es"
              ? "Importación completada"
              : "Import completed")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'input' && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>{language === "es" ? "ID del Spreadsheet" : "Spreadsheet ID"}</Label>
                <Input
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4"
                  data-testid="input-spreadsheet-id"
                />
                <p className="text-xs text-muted-foreground">
                  {language === "es" 
                    ? "El ID se encuentra en la URL de Google Sheets"
                    : "The ID is found in the Google Sheets URL"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{language === "es" ? "Nombre de la Hoja" : "Sheet Name"}</Label>
                <Input
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Renta/Long Term"
                  data-testid="input-sheet-name"
                />
              </div>

              <Alert>
                <FileWarning className="h-4 w-4" />
                <AlertDescription>
                  {language === "es"
                    ? "La importación actualizará unidades existentes (por ID) y creará nuevos condominios automáticamente."
                    : "The import will update existing units (by ID) and create new condominiums automatically."}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.totalRows.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Total Filas" : "Total Rows"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.condominiums.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Condominios" : "Condominiums"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.preview.filter(u => u.price).length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Con Precio" : "With Price"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {preview.preview.filter(u => u.commissionType === 'referido').length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Con Referido" : "With Referral"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">
                  {language === "es" ? "Vista previa (primeras 10 filas)" : "Preview (first 10 rows)"}
                </h4>
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-2 space-y-2">
                    {preview.preview.map((unit, idx) => (
                      <div 
                        key={idx} 
                        className="bg-card border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="outline" className="shrink-0">
                              #{unit.sheetRowId}
                            </Badge>
                            <span className="font-medium truncate">
                              {unit.condominiumName} - {unit.unitNumber}
                            </span>
                          </div>
                          <Badge variant={unit.commissionType === 'referido' ? 'secondary' : 'default'}>
                            {unit.commissionType === 'referido' 
                              ? (language === "es" ? "Referido 20%" : "Referral 20%")
                              : (language === "es" ? "Completa" : "Full")}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {unit.zone && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {unit.zone}
                            </span>
                          )}
                          {unit.bedrooms !== null && (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {unit.bedrooms}
                            </span>
                          )}
                          {unit.bathrooms !== null && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {unit.bathrooms}
                            </span>
                          )}
                          {unit.price && (
                            <span className="flex items-center gap-1 text-foreground font-medium">
                              <DollarSign className="h-3 w-3" />
                              ${unit.price.toLocaleString()} MXN
                            </span>
                          )}
                          {unit.floor && (
                            <Badge variant="outline" className="text-xs">
                              {floorLabel(unit.floor)}
                            </Badge>
                          )}
                          {unit.petFriendly && (
                            <Badge variant="outline" className="text-xs">
                              Pet Friendly
                            </Badge>
                          )}
                        </div>
                        
                        {(unit.virtualTourUrl || unit.photosDriveLink || unit.googleMapsUrl) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {unit.virtualTourUrl && (
                              <Badge variant="secondary" className="text-xs">Tour 360°</Badge>
                            )}
                            {unit.photosDriveLink && (
                              <Badge variant="secondary" className="text-xs">Drive</Badge>
                            )}
                            {unit.googleMapsUrl && (
                              <Badge variant="secondary" className="text-xs">Maps</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {language === "es"
                    ? `Se importarán ${preview.totalRows.toLocaleString()} filas. Las unidades existentes (por ID) serán actualizadas.`
                    : `${preview.totalRows.toLocaleString()} rows will be imported. Existing units (by ID) will be updated.`}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <div className="space-y-2">
                <p className="font-medium">
                  {language === "es" ? "Importando datos..." : "Importing data..."}
                </p>
                <Progress value={importProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(importProgress)}%
                </p>
              </div>
            </div>
          )}

          {step === 'done' && importResult && (
            <div className="space-y-4 p-4">
              <div className="flex flex-col items-center text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-semibold text-lg">
                  {language === "es" ? "Importación Completada" : "Import Completed"}
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Nuevas" : "New"}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Actualizadas" : "Updated"}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.totalErrors}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Errores" : "Errors"}
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    {language === "es" ? "Errores encontrados:" : "Errors found:"}
                  </p>
                  <ScrollArea className="h-24 border border-destructive/20 rounded-md p-2">
                    <ul className="text-xs text-destructive space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
                {language === "es" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={!spreadsheetId || previewMutation.isPending}
                data-testid="button-preview-import"
              >
                {previewMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {language === "es" ? "Vista Previa" : "Preview"}
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')} data-testid="button-back-import">
                {language === "es" ? "Atrás" : "Back"}
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
                data-testid="button-start-import"
              >
                <Download className="mr-2 h-4 w-4" />
                {language === "es" 
                  ? `Importar ${preview?.totalRows.toLocaleString()} Filas` 
                  : `Import ${preview?.totalRows.toLocaleString()} Rows`}
              </Button>
            </>
          )}
          
          {step === 'done' && (
            <Button onClick={handleClose} data-testid="button-close-import">
              {language === "es" ? "Cerrar" : "Close"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
