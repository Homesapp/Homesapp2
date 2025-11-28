import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Copy,
  Send,
  Loader2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExternalLead, ExternalUnit, ExternalCondominium } from "@shared/schema";

interface LeadRentalFormsTabProps {
  lead: ExternalLead;
}

interface RentalFormToken {
  id: string;
  token: string;
  recipientType: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  createdByName: string;
  propertyTitle: string;
  unitNumber?: string;
  condoName?: string;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  condoName?: string;
}

export default function LeadRentalFormsTab({ lead }: LeadRentalFormsTabProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const locale = language === "es" ? es : enUS;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [recipientType, setRecipientType] = useState<string>("tenant");

  const { data: rentalForms, isLoading } = useQuery<RentalFormToken[]>({
    queryKey: ["/api/external-leads", lead.id, "rental-forms"],
    queryFn: async () => {
      const response = await fetch(`/api/external-leads/${lead.id}/rental-forms`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: unitsResponse } = useQuery<{ data: any[], total: number }>({
    queryKey: ["/api/external-units", "for-rental-forms-tab"],
    queryFn: async () => {
      const response = await fetch("/api/external-units?limit=1000", { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });
  const units = unitsResponse?.data || [];

  const createFormMutation = useMutation({
    mutationFn: async (data: { externalUnitId: string; recipientType: string }) => {
      const res = await apiRequest("POST", `/api/external-leads/${lead.id}/rental-forms`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-leads", lead.id, "rental-forms"] });
      setIsDialogOpen(false);
      setSelectedUnitId("");
      
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: language === "es" ? "Formulario generado" : "Form generated",
          description: language === "es" 
            ? "El enlace se copió al portapapeles" 
            : "Link copied to clipboard",
        });
      } else {
        toast({
          title: language === "es" ? "Formulario generado" : "Form generated",
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo generar el formulario" 
          : "Failed to generate form",
      });
    },
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/rental-form/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: language === "es" ? "Enlace copiado" : "Link copied",
    });
  };

  const shareViaWhatsApp = (token: string, propertyTitle: string) => {
    const url = `${window.location.origin}/rental-form/${token}`;
    const phone = lead.phone?.replace(/\D/g, '');
    const message = language === "es"
      ? `Hola ${lead.firstName}, por favor complete el formulario de renta para ${propertyTitle}: ${url}`
      : `Hi ${lead.firstName}, please complete the rental form for ${propertyTitle}: ${url}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = () => {
    if (!selectedUnitId) {
      toast({
        variant: "destructive",
        title: language === "es" ? "Selecciona una unidad" : "Select a unit",
      });
      return;
    }
    createFormMutation.mutate({ externalUnitId: selectedUnitId, recipientType });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const getStatusBadge = (form: RentalFormToken) => {
    if (form.isUsed) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {language === "es" ? "Completado" : "Completed"}
        </Badge>
      );
    }
    if (isExpired(form.expiresAt)) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {language === "es" ? "Expirado" : "Expired"}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        {language === "es" ? "Pendiente" : "Pending"}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h4 className="font-medium text-sm">
          {language === "es" ? "Formatos de Renta" : "Rental Forms"}
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {rentalForms?.length || 0} {language === "es" ? "enviados" : "sent"}
          </Badge>
          <Button 
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
            className="min-h-[44px]"
            data-testid="button-send-rental-form"
          >
            <Plus className="h-4 w-4 mr-1" />
            {language === "es" ? "Enviar Formato" : "Send Form"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : rentalForms && rentalForms.length > 0 ? (
        <div className="space-y-3">
          {rentalForms.map((form) => (
            <Card key={form.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-full shrink-0 ${
                      form.isUsed 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-primary/10 text-primary"
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{form.propertyTitle}</p>
                        <Badge variant="outline" className="text-xs">
                          {form.recipientType === 'tenant' 
                            ? (language === "es" ? "Inquilino" : "Tenant")
                            : (language === "es" ? "Propietario" : "Owner")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>{format(new Date(form.createdAt), "PPp", { locale })}</span>
                        <span>•</span>
                        <span>{form.createdByName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(form)}
                    {!form.isUsed && !isExpired(form.expiresAt) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={() => copyToClipboard(form.token)}
                          data-testid={`button-copy-form-${form.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px] text-green-600"
                            onClick={() => shareViaWhatsApp(form.token, form.propertyTitle)}
                            data-testid={`button-whatsapp-form-${form.id}`}
                          >
                            <SiWhatsapp className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-sm">
              {language === "es" 
                ? "No hay formatos de renta enviados" 
                : "No rental forms sent yet"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 min-h-[44px]"
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-send-first-form"
            >
              <Plus className="h-4 w-4 mr-1" />
              {language === "es" ? "Enviar primer formato" : "Send first form"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              {language === "es" ? "Enviar Formato de Renta" : "Send Rental Form"}
            </DialogTitle>
            <DialogDescription>
              {language === "es" 
                ? `Selecciona una propiedad para enviar el formulario a ${lead.firstName}`
                : `Select a property to send the form to ${lead.firstName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "es" ? "Propiedad" : "Property"}</Label>
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger className="min-h-[44px]" data-testid="select-unit-for-form">
                  <SelectValue placeholder={language === "es" ? "Seleccionar unidad..." : "Select unit..."} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id} className="min-h-[44px]">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {unit.condominium?.name 
                            ? `${unit.condominium.name} - ${unit.unitNumber}`
                            : unit.unitNumber}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "es" ? "Tipo de destinatario" : "Recipient type"}</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger className="min-h-[44px]" data-testid="select-recipient-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant" className="min-h-[44px]">
                    {language === "es" ? "Inquilino" : "Tenant"}
                  </SelectItem>
                  <SelectItem value="owner" className="min-h-[44px]">
                    {language === "es" ? "Propietario" : "Owner"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="min-h-[44px]"
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createFormMutation.isPending || !selectedUnitId}
              className="min-h-[44px]"
              data-testid="button-confirm-send-form"
            >
              {createFormMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {createFormMutation.isPending 
                ? (language === "es" ? "Enviando..." : "Sending...")
                : (language === "es" ? "Enviar Formato" : "Send Form")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
