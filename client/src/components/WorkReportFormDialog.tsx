import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkReportSchema, type InsertWorkReport } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateWorkReport } from "@/hooks/useWorkReports";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface WorkReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

export function WorkReportFormDialog({
  open,
  onOpenChange,
  taskId,
}: WorkReportFormDialogProps) {
  const { user } = useAuth();
  const createMutation = useCreateWorkReport();

  const form = useForm<InsertWorkReport>({
    resolver: zodResolver(insertWorkReportSchema),
    defaultValues: {
      taskId: taskId,
      staffId: user?.id || "",
      reportType: "before",
      description: "",
      images: [],
      observations: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        taskId: taskId,
        staffId: user?.id || "",
        reportType: "before",
        description: "",
        images: [],
        observations: "",
      });
    }
  }, [open, taskId, user, form]);

  const onSubmit = async (data: InsertWorkReport) => {
    try {
      await createMutation.mutateAsync(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-work-report-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            Nuevo Reporte de Trabajo
          </DialogTitle>
          <DialogDescription>
            Documenta el estado del trabajo antes o después de realizarlo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Reporte *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                      data-testid="radio-report-type"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="before" data-testid="radio-before" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Antes del trabajo
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="after" data-testid="radio-after" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Después del trabajo
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el estado del trabajo..."
                      className="min-h-[120px]"
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales u observaciones..."
                      data-testid="input-observations"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Reporte
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
