import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type Service = {
  id: string;
  name: string;
  price: number;
  description: string;
};

type HireServiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  services: Service[];
  propertyId?: string;
};

export function HireServiceDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  services,
  propertyId,
}: HireServiceDialogProps) {
  const { toast } = useToast();
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [message, setMessage] = useState("");

  const selectedService = services.find(s => s.id === selectedServiceId);

  const hireMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/service-bookings", {
        serviceId: selectedServiceId,
        providerId,
        propertyId: propertyId || undefined,
        scheduledDate: date?.toISOString(),
        clientMessage: message,
        totalCost: selectedService?.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-bookings"] });
      toast({
        title: "Servicio contratado",
        description: `Has solicitado el servicio de ${providerName}. Te contactará pronto.`,
      });
      onOpenChange(false);
      setSelectedServiceId("");
      setDate(undefined);
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo contratar el servicio",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-hire-service">
        <DialogHeader>
          <DialogTitle>Contratar Servicio</DialogTitle>
          <DialogDescription>
            Solicita un servicio de {providerName}. El proveedor recibirá tu solicitud y se pondrá en contacto contigo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service">Servicio *</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger id="service" data-testid="select-service">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} data-testid={`option-service-${service.id}`}>
                    {service.name} - ${service.price.toLocaleString()} MXN
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <p className="text-sm text-muted-foreground">
                {selectedService.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha preferida (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje para el proveedor (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Describe tu necesidad o cualquier detalle importante..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              data-testid="textarea-message"
            />
          </div>

          {selectedService && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="font-medium">Total estimado:</span>
              <span className="text-lg font-bold text-primary">
                ${selectedService.price.toLocaleString()} MXN
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-hire"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => hireMutation.mutate()}
            disabled={!selectedServiceId || hireMutation.isPending}
            data-testid="button-confirm-hire"
          >
            {hireMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
