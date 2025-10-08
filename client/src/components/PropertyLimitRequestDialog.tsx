import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPropertyLimitRequestSchema } from "@shared/schema";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PropertyLimitRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit: number;
  currentCount: number;
}

export function PropertyLimitRequestDialog({
  open,
  onOpenChange,
  currentLimit,
  currentCount,
}: PropertyLimitRequestDialogProps) {
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPropertyLimitRequestSchema>) => {
      return await apiRequest("/api/property-limit-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-limit-requests"] });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de aumento de límite ha sido enviada exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
      });
    },
  });

  const form = useForm<z.infer<typeof createPropertyLimitRequestSchema>>({
    resolver: zodResolver(createPropertyLimitRequestSchema),
    defaultValues: {
      requestedLimit: currentLimit + 1,
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        requestedLimit: currentLimit + 1,
        reason: "",
      });
    }
  }, [open, currentLimit, form]);

  const onSubmit = async (data: z.infer<typeof createPropertyLimitRequestSchema>) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-property-limit-request">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Solicitar Aumento de Límite</DialogTitle>
          <DialogDescription>
            Actualmente tienes {currentCount} de {currentLimit} propiedades permitidas. Solicita un aumento para agregar más propiedades.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requestedLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Límite Solicitado</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={currentLimit + 1}
                      data-testid="input-requested-limit"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    El nuevo límite debe ser mayor que tu límite actual ({currentLimit})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la Solicitud</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Por favor explica por qué necesitas más propiedades..."
                      rows={4}
                      data-testid="input-reason"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Proporciona una razón detallada (mínimo 20 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitud
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
