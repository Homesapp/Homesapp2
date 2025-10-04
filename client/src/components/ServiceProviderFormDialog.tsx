import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceProviderSchema, type InsertServiceProvider, type ServiceProvider } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCreateServiceProvider, useUpdateServiceProvider } from "@/hooks/useServiceProviders";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ServiceProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ServiceProvider;
  mode: "create" | "edit";
}

export function ServiceProviderFormDialog({
  open,
  onOpenChange,
  provider,
  mode,
}: ServiceProviderFormDialogProps) {
  const { user } = useAuth();
  const createMutation = useCreateServiceProvider();
  const updateMutation = useUpdateServiceProvider();

  const form = useForm<InsertServiceProvider>({
    resolver: zodResolver(insertServiceProviderSchema),
    defaultValues: {
      userId: user?.id || "",
      specialty: "",
      rating: "0",
      reviewCount: 0,
      available: true,
    },
  });

  useEffect(() => {
    if (provider && mode === "edit") {
      form.reset({
        userId: provider.userId,
        specialty: provider.specialty,
        rating: provider.rating || "0",
        reviewCount: provider.reviewCount || 0,
        available: provider.available ?? true,
      });
    } else if (mode === "create") {
      form.reset({
        userId: user?.id || "",
        specialty: "",
        rating: "0",
        reviewCount: 0,
        available: true,
      });
    }
  }, [provider, mode, form, user]);

  const onSubmit = async (data: InsertServiceProvider) => {
    try {
      const submitData = {
        ...data,
        userId: user?.id || data.userId,
      };

      if (mode === "edit" && provider) {
        await updateMutation.mutateAsync({ id: provider.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-service-provider-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Registrarse como Proveedor" : "Editar Perfil de Proveedor"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Regístrate como proveedor de servicios para propiedades"
              : "Actualiza tu información como proveedor"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Plomería, Electricidad, Limpieza..."
                      data-testid="input-specialty"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Disponible</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      ¿Estás disponible para aceptar nuevos trabajos?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-available"
                    />
                  </FormControl>
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
                {mode === "create" ? "Registrarse" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
