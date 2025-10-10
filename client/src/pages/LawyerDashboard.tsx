import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Download,
  FileSignature,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  status: string;
  monthlyRent: string;
  leaseDurationMonths: number;
  depositAmount: string;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  property?: { title: string; address: string };
  tenant?: { fullName: string; email: string };
  owner?: { fullName: string; email: string };
}

interface LegalDocument {
  id: string;
  rentalContractId: string;
  documentUrl: string;
  documentName: string;
  uploadedById: string;
  uploadedAt: string;
  version: number;
  status: "draft" | "pending_review" | "approved" | "rejected";
  notes: string | null;
}

export default function LawyerDashboard() {
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentNotes, setDocumentNotes] = useState("");

  // Fetch contracts ready for legal elaboration (status: firmado)
  const { data: contracts, isLoading } = useQuery<RentalContract[]>({
    queryKey: ["/api/admin/rental-contracts?status=firmado"],
  });

  // Fetch legal documents for selected contract
  const { data: legalDocuments } = useQuery<LegalDocument[]>({
    queryKey: ["/api/contracts", selectedContract?.id, "legal-documents"],
    enabled: !!selectedContract,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("/api/contracts/" + selectedContract?.id + "/legal-documents", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", selectedContract?.id, "legal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rental-contracts"] });
      toast({
        title: "Documento subido",
        description: "El PDF legal ha sido subido exitosamente",
      });
      setIsUploadDialogOpen(false);
      setDocumentFile(null);
      setDocumentNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleUpload = () => {
    if (!documentFile || !selectedContract) return;

    const formData = new FormData();
    formData.append("document", documentFile);
    formData.append("notes", documentNotes);

    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { icon: Clock, label: "Borrador", className: "bg-gray-100 dark:bg-gray-800" },
      pending_review: { icon: Clock, label: "En revisión", className: "bg-yellow-100 dark:bg-yellow-950" },
      approved: { icon: CheckCircle2, label: "Aprobado", className: "bg-green-100 dark:bg-green-950" },
      rejected: { icon: AlertCircle, label: "Rechazado", className: "bg-red-100 dark:bg-red-950" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-lawyer-dashboard-title">
            Elaboración Legal de Contratos
          </h1>
          <p className="text-muted-foreground" data-testid="text-lawyer-dashboard-subtitle">
            Contratos listos para elaboración legal
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-pending-count">
          <FileSignature className="w-5 h-5 mr-2" />
          {contracts?.length || 0} Pendientes
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-contracts-ready-title">Contratos Listos</CardTitle>
          <CardDescription data-testid="text-contracts-ready-description">
            Contratos firmados esperando elaboración legal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts && contracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="table-head-property">Propiedad</TableHead>
                  <TableHead data-testid="table-head-tenant">Inquilino</TableHead>
                  <TableHead data-testid="table-head-rent">Renta Mensual</TableHead>
                  <TableHead data-testid="table-head-duration">Duración</TableHead>
                  <TableHead data-testid="table-head-documents">Documentos</TableHead>
                  <TableHead data-testid="table-head-actions">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                    <TableCell data-testid={`cell-property-${contract.id}`}>
                      <div className="font-medium">{contract.property?.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.property?.address}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`cell-tenant-${contract.id}`}>
                      <div className="font-medium">{contract.tenant?.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.tenant?.email}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`cell-rent-${contract.id}`}>
                      {formatCurrency(parseFloat(contract.monthlyRent))}
                    </TableCell>
                    <TableCell data-testid={`cell-duration-${contract.id}`}>
                      {contract.leaseDurationMonths} meses
                    </TableCell>
                    <TableCell data-testid={`cell-documents-${contract.id}`}>
                      <Badge variant="secondary" data-testid={`badge-doc-count-${contract.id}`}>
                        <FileText className="w-3 h-3 mr-1" />
                        {legalDocuments?.filter(d => d.rentalContractId === contract.id).length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`cell-actions-${contract.id}`}>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedContract(contract)}
                          data-testid={`button-view-${contract.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedContract(contract);
                            setIsUploadDialogOpen(true);
                          }}
                          data-testid={`button-upload-${contract.id}`}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Subir PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12" data-testid="empty-state-no-contracts">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay contratos pendientes de elaboración legal</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={!!selectedContract && !isUploadDialogOpen} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <DialogContent className="max-w-4xl" data-testid="dialog-contract-details">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-contract-details">
              Detalles del Contrato
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-contract-details">
              {selectedContract?.property?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contract Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Inquilino</p>
                <p className="font-medium" data-testid="text-tenant-name">
                  {selectedContract?.tenant?.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Propietario</p>
                <p className="font-medium" data-testid="text-owner-name">
                  {selectedContract?.owner?.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renta Mensual</p>
                <p className="font-medium" data-testid="text-monthly-rent">
                  {selectedContract && formatCurrency(parseFloat(selectedContract.monthlyRent))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depósito</p>
                <p className="font-medium" data-testid="text-deposit">
                  {selectedContract && formatCurrency(parseFloat(selectedContract.depositAmount))}
                </p>
              </div>
            </div>

            {/* Legal Documents */}
            <div>
              <h3 className="font-semibold mb-3" data-testid="text-legal-docs-title">
                Documentos Legales
              </h3>
              {legalDocuments && legalDocuments.length > 0 ? (
                <div className="space-y-2">
                  {legalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`legal-doc-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium" data-testid={`doc-name-${doc.id}`}>
                            {doc.documentName}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`doc-version-${doc.id}`}>
                            Versión {doc.version} • {format(new Date(doc.uploadedAt), "PPP", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.documentUrl, "_blank")}
                          data-testid={`button-download-${doc.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg" data-testid="empty-state-no-legal-docs">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay documentos legales para este contrato
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload PDF Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent data-testid="dialog-upload-pdf">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-upload-pdf">
              Subir Contrato Legal
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-upload-pdf">
              Sube el PDF del contrato legal elaborado para {selectedContract?.property?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Archivo PDF *
              </label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                data-testid="input-pdf-file"
              />
              {documentFile && (
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-selected-file">
                  Archivo seleccionado: {documentFile.name}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notas (opcional)
              </label>
              <Textarea
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                placeholder="Agrega cualquier nota sobre este documento..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setDocumentFile(null);
                  setDocumentNotes("");
                }}
                data-testid="button-cancel-upload"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!documentFile || uploadMutation.isPending}
                data-testid="button-confirm-upload"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
