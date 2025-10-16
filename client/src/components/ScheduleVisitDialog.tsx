import { useMutation } from "@tanstack/react-query";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Video, MapPin } from "lucide-react";
import { datetimeLocalToCancunDate } from "@/lib/timezoneHelpers";

const scheduleVisitSchema = z.object({
  date: z.string().min(1, "Fecha y hora son requeridas"),
  type: z.enum(["in-person", "video"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof scheduleVisitSchema>;

interface ScheduleVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sorId: string;
  propertyTitle: string;
}

export function ScheduleVisitDialog({
  open,
  onOpenChange,
  sorId,
  propertyTitle,
}: ScheduleVisitDialogProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(scheduleVisitSchema),
    defaultValues: {
      type: "in-person",
      notes: "",
    },
  });

  const scheduleVisitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Convert datetime-local string to proper UTC date for Cancún timezone
      const appointmentDate = datetimeLocalToCancunDate(data.date);
      
      return await apiRequest("POST", `/api/rental-opportunity-requests/${sorId}/schedule-visit`, {
        ...data,
        date: appointmentDate.toISOString(),
      });
    },
    onSuccess: (data: any) => {
      // Invalidar todas las queries relacionadas con oportunidades de renta (exact: false invalida con prefijo)
      queryClient.invalidateQueries({ queryKey: ["/api/my-rental-opportunities"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"], exact: false });
      
      const successMessage = data.meetLink 
        ? `¡Visita programada! Link de Google Meet: ${data.meetLink}`
        : "¡Visita programada exitosamente!";
      
      toast({
        title: "Visita programada",
        description: successMessage,
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error al programar visita",
        description: error.message || "Ocurrió un error al programar la visita",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    scheduleVisitMutation.mutate(data);
  };

  const visitType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Visita</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y Hora de la Visita</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      data-testid="input-visit-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Visita</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-visit-type">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in-person">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Presencial</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <span>Virtual (Google Meet)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {visitType === "video" && (
              <div className="bg-muted p-3 rounded-md flex items-start gap-2">
                <Video className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Se creará automáticamente un enlace de Google Meet para la visita virtual.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agrega información adicional sobre la visita..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="textarea-visit-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-visit"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={scheduleVisitMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-visit"
              >
                {scheduleVisitMutation.isPending ? "Programando..." : "Programar Visita"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
