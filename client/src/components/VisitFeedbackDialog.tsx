import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitAppointmentFeedback } from "@/hooks/useAppointments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type VisitFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  visitType: string;
};

// Opciones predefinidas para clientes
const CLIENT_FEEDBACK_OPTIONS = [
  {
    value: "liked_continue",
    label: "Me gustó la propiedad, continuaré el proceso",
    liked: true,
  },
  {
    value: "liked_negotiable",
    label: "Me interesa, ¿los términos son negociables?",
    liked: true,
  },
  {
    value: "not_liked",
    label: "No me gustó, seguiré buscando",
    liked: false,
  },
  {
    value: "good_but_searching",
    label: "Es buena opción pero quiero ver más",
    liked: true,
  },
  {
    value: "price_concern",
    label: "Me gusta pero el precio es alto",
    liked: true,
  },
];

const clientFeedbackSchema = z.object({
  option: z.string().min(1, "Por favor selecciona una opción"),
});

const staffFeedbackSchema = z.object({
  feedback: z.string().min(10, "El reporte debe tener al menos 10 caracteres"),
});

export function VisitFeedbackDialog({
  open,
  onOpenChange,
  appointmentId,
  visitType,
}: VisitFeedbackDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitFeedback = useSubmitAppointmentFeedback();

  const isClientVisit = visitType === "visita_cliente";
  const isClient = user?.role === "cliente";
  const isStaff = ["concierge", "provider", "admin", "admin_jr", "master"].includes(user?.role || "");

  const clientForm = useForm<z.infer<typeof clientFeedbackSchema>>({
    resolver: zodResolver(clientFeedbackSchema),
    defaultValues: {
      option: "",
    },
  });

  const staffForm = useForm<z.infer<typeof staffFeedbackSchema>>({
    resolver: zodResolver(staffFeedbackSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const handleClientSubmit = async (values: z.infer<typeof clientFeedbackSchema>) => {
    setIsSubmitting(true);
    try {
      const selectedOption = CLIENT_FEEDBACK_OPTIONS.find(opt => opt.value === values.option);
      if (!selectedOption) {
        throw new Error("Opción no válida");
      }

      await submitFeedback.mutateAsync({
        id: appointmentId,
        feedbackType: "client",
        feedback: {
          option: values.option,
          message: selectedOption.label,
          liked: selectedOption.liked,
        },
      });

      toast({
        title: "Feedback enviado",
        description: "Gracias por compartir tu opinión sobre la propiedad",
      });

      onOpenChange(false);
      clientForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffSubmit = async (values: z.infer<typeof staffFeedbackSchema>) => {
    setIsSubmitting(true);
    try {
      await submitFeedback.mutateAsync({
        id: appointmentId,
        feedbackType: "staff",
        feedback: values.feedback,
      });

      toast({
        title: "Reporte enviado",
        description: "El reporte de la visita ha sido registrado exitosamente",
      });

      onOpenChange(false);
      staffForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el reporte",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar si mostrar formulario de cliente o staff
  const showClientForm = isClientVisit && isClient;
  const showStaffForm = !isClientVisit && isStaff;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-visit-feedback">
        <DialogHeader>
          <DialogTitle>
            {showClientForm && "¿Qué te pareció la propiedad?"}
            {showStaffForm && "Reporte de la Visita"}
          </DialogTitle>
          <DialogDescription>
            {showClientForm && "Selecciona la opción que mejor describe tu experiencia"}
            {showStaffForm && "Describe cómo fue la visita y cualquier observación importante"}
          </DialogDescription>
        </DialogHeader>

        {showClientForm && (
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleClientSubmit)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="option"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        {CLIENT_FEEDBACK_OPTIONS.map((option) => (
                          <FormItem
                            key={option.value}
                            className="flex items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem 
                                value={option.value} 
                                data-testid={`radio-${option.value}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  data-testid="button-submit-client-feedback"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Feedback"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {showStaffForm && (
          <Form {...staffForm}>
            <form onSubmit={staffForm.handleSubmit(handleStaffSubmit)} className="space-y-4">
              <FormField
                control={staffForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporte</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe cómo fue la visita, si hubo algún problema de acceso, el estado de la propiedad, etc."
                        className="min-h-[120px]"
                        data-testid="textarea-staff-feedback"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  data-testid="button-submit-staff-feedback"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Reporte"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {!showClientForm && !showStaffForm && (
          <div className="py-4 text-center text-muted-foreground">
            <p>No tienes permisos para dejar feedback en esta visita</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
