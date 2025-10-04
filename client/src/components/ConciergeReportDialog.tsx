import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const reportSchema = z.object({
  conciergeReport: z.string().min(10, "El reporte debe tener al menos 10 caracteres"),
  accessIssues: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ConciergeReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSubmit: (data: ReportFormData) => Promise<void>;
}

export function ConciergeReportDialog({
  open,
  onOpenChange,
  appointmentId,
  onSubmit,
}: ConciergeReportDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      conciergeReport: "",
      accessIssues: "",
    },
  });

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Reporte enviado",
        description: "El reporte ha sido guardado exitosamente",
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el reporte. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="concierge-report-dialog">
        <DialogHeader>
          <DialogTitle>Reportar Resultado de la Cita</DialogTitle>
          <DialogDescription>
            Proporciona un reporte detallado del resultado de la cita y cualquier problema de acceso encontrado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="conciergeReport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reporte de la Cita *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el resultado de la cita, el estado de la propiedad, la actitud del cliente, etc."
                      className="min-h-32"
                      data-testid="input-concierge-report"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Proporciona un reporte completo y detallado del resultado de la cita
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problemas de Acceso (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe cualquier problema de acceso encontrado (código de lockbox incorrecto, contacto no disponible, etc.)"
                      className="min-h-24"
                      data-testid="input-access-issues"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Reporta solo si hubo problemas para acceder a la propiedad
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="button-cancel-report"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-report"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Reporte
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
