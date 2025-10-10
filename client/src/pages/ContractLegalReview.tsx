import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle2,
  XCircle,
  MessageSquare,
  Download,
  Eye,
  AlertCircle,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

interface ContractApproval {
  id: string;
  rentalContractId: string;
  legalDocumentId: string;
  approverId: string;
  approverRole: string;
  status: "approved" | "rejected" | "changes_requested";
  comments: string | null;
  createdAt: string;
}

interface TermDiscussion {
  id: string;
  legalDocumentId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: { fullName: string; role: string };
}

export default function ContractLegalReview() {
  const { contractId } = useParams();
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isDiscussionDialogOpen, setIsDiscussionDialogOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"approved" | "rejected" | "changes_requested" | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [discussionMessage, setDiscussionMessage] = useState("");

  // Fetch legal documents
  const { data: legalDocuments, isLoading: isLoadingDocs } = useQuery<LegalDocument[]>({
    queryKey: ["/api/contracts", contractId, "legal-documents"],
  });

  // Fetch approvals
  const { data: approvals } = useQuery<ContractApproval[]>({
    queryKey: ["/api/contracts", contractId, "approvals"],
  });

  // Fetch discussions for selected document
  const { data: discussions } = useQuery<TermDiscussion[]>({
    queryKey: ["/api/legal-documents", selectedDocument?.id, "discussions"],
    enabled: !!selectedDocument,
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async (data: { legalDocumentId: string; status: string; comments?: string }) => {
      return await apiRequest(`/api/contracts/${contractId}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId, "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId, "legal-documents"] });
      toast({
        title: "Respuesta registrada",
        description: "Tu decisión ha sido registrada exitosamente",
      });
      setIsApprovalDialogOpen(false);
      setApprovalStatus(null);
      setApprovalComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar tu decisión",
        variant: "destructive",
      });
    },
  });

  // Discussion mutation
  const discussionMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return await apiRequest(`/api/legal-documents/${selectedDocument?.id}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-documents", selectedDocument?.id, "discussions"] });
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado",
      });
      setDiscussionMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const handleApprovalSubmit = () => {
    if (!selectedDocument || !approvalStatus) return;

    approvalMutation.mutate({
      legalDocumentId: selectedDocument.id,
      status: approvalStatus,
      comments: approvalComments || undefined,
    });
  };

  const handleDiscussionSubmit = () => {
    if (!discussionMessage.trim()) return;
    discussionMutation.mutate({ message: discussionMessage });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { icon: FileText, label: "Borrador", className: "bg-gray-100 dark:bg-gray-800" },
      pending_review: { icon: AlertCircle, label: "En revisión", className: "bg-yellow-100 dark:bg-yellow-950" },
      approved: { icon: CheckCircle2, label: "Aprobado", className: "bg-green-100 dark:bg-green-950" },
      rejected: { icon: XCircle, label: "Rechazado", className: "bg-red-100 dark:bg-red-950" },
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

  const getApprovalBadge = (status: string) => {
    const statusConfig = {
      approved: { icon: CheckCircle2, label: "Aprobado", className: "bg-green-100 dark:bg-green-950" },
      rejected: { icon: XCircle, label: "Rechazado", className: "bg-red-100 dark:bg-red-950" },
      changes_requested: { icon: MessageSquare, label: "Cambios solicitados", className: "bg-orange-100 dark:bg-orange-950" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoadingDocs) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-legal-review-title">
          Revisión de Contrato Legal
        </h1>
        <p className="text-muted-foreground" data-testid="text-legal-review-subtitle">
          Revisa y aprueba los documentos legales del contrato
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Legal Documents */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-legal-docs-title">Documentos Legales</CardTitle>
            <CardDescription data-testid="text-legal-docs-description">
              PDFs del contrato elaborados por el abogado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {legalDocuments && legalDocuments.length > 0 ? (
              <div className="space-y-3">
                {legalDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`legal-doc-${doc.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`doc-name-${doc.id}`}>
                          {doc.documentName}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`doc-version-${doc.id}`}>
                          Versión {doc.version} • {format(new Date(doc.uploadedAt), "PPP", { locale: es })}
                        </p>
                        {doc.notes && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`doc-notes-${doc.id}`}>
                            {doc.notes}
                          </p>
                        )}
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
                      <Button
                        size="sm"
                        onClick={() => setSelectedDocument(doc)}
                        data-testid={`button-review-${doc.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Revisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="empty-state-no-docs">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay documentos legales disponibles
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  El abogado aún no ha subido el contrato
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approvals History */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-approvals-title">Historial de Aprobaciones</CardTitle>
            <CardDescription data-testid="text-approvals-description">
              Decisiones de las partes involucradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvals && approvals.length > 0 ? (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-4 border rounded-lg"
                    data-testid={`approval-${approval.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium capitalize" data-testid={`approval-role-${approval.id}`}>
                          {approval.approverRole === "client" ? "Inquilino" : "Propietario"}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`approval-date-${approval.id}`}>
                          {format(new Date(approval.createdAt), "PPP", { locale: es })}
                        </p>
                      </div>
                      {getApprovalBadge(approval.status)}
                    </div>
                    {approval.comments && (
                      <p className="text-sm text-muted-foreground mt-2" data-testid={`approval-comments-${approval.id}`}>
                        {approval.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="empty-state-no-approvals">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay aprobaciones registradas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Review Dialog */}
      <Dialog open={!!selectedDocument && !isApprovalDialogOpen && !isDiscussionDialogOpen} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl" data-testid="dialog-document-review">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-document-review">
              {selectedDocument?.documentName}
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-document-review">
              Versión {selectedDocument?.version}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* PDF Viewer */}
            <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
              <iframe
                src={selectedDocument?.documentUrl}
                className="w-full h-full"
                title="Contract PDF"
                data-testid="iframe-pdf-viewer"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDiscussionDialogOpen(true);
                  }}
                  data-testid="button-open-discussion"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discutir Términos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedDocument?.documentUrl, "_blank")}
                  data-testid="button-download-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setApprovalStatus("rejected");
                    setIsApprovalDialogOpen(true);
                  }}
                  data-testid="button-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => {
                    setApprovalStatus("approved");
                    setIsApprovalDialogOpen(true);
                  }}
                  data-testid="button-approve"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent data-testid="dialog-approval">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-approval">
              {approvalStatus === "approved" ? "Aprobar Contrato" : "Rechazar Contrato"}
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-approval">
              {approvalStatus === "approved" 
                ? "¿Estás seguro de aprobar este contrato?"
                : "Indica el motivo del rechazo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentarios {approvalStatus === "rejected" && "*"}
              </label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={approvalStatus === "approved" 
                  ? "Comentarios opcionales..."
                  : "Explica qué cambios necesitas..."}
                rows={4}
                data-testid="textarea-approval-comments"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsApprovalDialogOpen(false);
                  setApprovalStatus(null);
                  setApprovalComments("");
                }}
                data-testid="button-cancel-approval"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApprovalSubmit}
                disabled={
                  approvalMutation.isPending ||
                  (approvalStatus === "rejected" && !approvalComments.trim())
                }
                data-testid="button-submit-approval"
              >
                {approvalMutation.isPending ? "Enviando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discussion Dialog */}
      <Dialog open={isDiscussionDialogOpen} onOpenChange={setIsDiscussionDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-discussion">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-discussion">
              Discusión de Términos
            </DialogTitle>
            <DialogDescription data-testid="dialog-description-discussion">
              Chat tripartito: Abogado, Inquilino y Propietario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Messages */}
            <div className="border rounded-lg p-4 h-80 overflow-y-auto space-y-3" data-testid="discussion-messages">
              {discussions && discussions.length > 0 ? (
                discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="p-3 bg-muted rounded-lg"
                    data-testid={`discussion-${discussion.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm" data-testid={`discussion-sender-${discussion.id}`}>
                        {discussion.sender?.fullName} ({discussion.sender?.role})
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`discussion-date-${discussion.id}`}>
                        {format(new Date(discussion.createdAt), "PPp", { locale: es })}
                      </p>
                    </div>
                    <p className="text-sm" data-testid={`discussion-message-${discussion.id}`}>
                      {discussion.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12" data-testid="empty-state-no-discussions">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay mensajes aún</p>
                </div>
              )}
            </div>

            {/* New Message */}
            <div className="flex gap-2">
              <Textarea
                value={discussionMessage}
                onChange={(e) => setDiscussionMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={2}
                data-testid="textarea-discussion-message"
              />
              <Button
                onClick={handleDiscussionSubmit}
                disabled={!discussionMessage.trim() || discussionMutation.isPending}
                data-testid="button-send-discussion"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
