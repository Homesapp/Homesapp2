import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type PropertyAgreement = {
  id: string;
  userId: string;
  propertyId: string;
  templateId: string;
  templateType: string;
  status: "pending" | "signed" | "cancelled";
  renderedContent: string;
  signerName: string | null;
  signedAt: string | null;
  signerIp: string | null;
  createdAt: string;
};

export default function Contracts() {
  const [selectedContract, setSelectedContract] = useState<PropertyAgreement | null>(null);
  const { toast } = useToast();

  const { data: contracts = [], isLoading } = useQuery<PropertyAgreement[]>({
    queryKey: ["/api/property-agreements"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return (
          <Badge variant="default" className="gap-1" data-testid={`badge-status-signed`}>
            <CheckCircle className="h-3 w-3" />
            Firmado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1" data-testid={`badge-status-pending`}>
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1" data-testid={`badge-status-cancelled`}>
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const downloadContract = (contract: PropertyAgreement) => {
    const blob = new Blob([contract.renderedContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${contract.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Contrato descargado",
      description: "El contrato se ha descargado correctamente",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-contracts">Contratos</h1>
            <p className="text-muted-foreground">Cargando contratos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-contracts">Contratos</h1>
          <p className="text-muted-foreground">
            Gestiona tus contratos y acuerdos de propiedad
          </p>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes contratos</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Cuando tengas contratos asociados a propiedades, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id} data-testid={`card-contract-${contract.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contrato - {contract.templateType}
                      </CardTitle>
                      <CardDescription>
                        Creado el {new Date(contract.createdAt).toLocaleDateString('es-MX')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedContract(contract)}
                      data-testid={`button-view-${contract.id}`}
                    >
                      Ver Contrato
                    </Button>
                    {contract.status === "signed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadContract(contract)}
                        data-testid={`button-download-${contract.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    )}
                  </div>
                  {contract.signedAt && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Firmado por {contract.signerName} el {new Date(contract.signedAt).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato - {selectedContract?.templateType}</DialogTitle>
            <DialogDescription>
              {selectedContract?.status === "signed" 
                ? `Firmado el ${selectedContract.signedAt ? new Date(selectedContract.signedAt).toLocaleDateString('es-MX') : ''}`
                : 'Pendiente de firma'}
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedContract?.renderedContent || '' }}
            data-testid="contract-content"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
