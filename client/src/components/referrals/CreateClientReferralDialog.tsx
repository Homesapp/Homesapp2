import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import { insertClientReferralSchema } from "@shared/schema";

const formSchema = insertClientReferralSchema.omit({
  id: true,
  referrerId: true,
  status: true,
  commissionPercent: true,
  commissionEarned: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
});

type FormData = z.infer<typeof formSchema>;

interface CreateClientReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientReferralDialog({
  open,
  onOpenChange,
}: CreateClientReferralDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/referrals/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/clients"] });
      toast({
        title: t("referrals.clientReferralCreated", "Referido de cliente creado"),
        description: t("referrals.clientReferralCreatedDesc", "El referido ha sido creado exitosamente"),
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("referrals.createError", "No se pudo crear el referido"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("referrals.addClientReferral", "Agregar Referido de Cliente")}
          </DialogTitle>
          <DialogDescription>
            {t("referrals.addClientReferralDesc", "Recomienda una persona que busca rentar una propiedad")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.firstName", "Nombre")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("common.firstName", "Nombre")}
                        data-testid="input-first-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.lastName", "Apellido")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("common.lastName", "Apellido")}
                        data-testid="input-last-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.email", "Correo electrónico")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("common.email", "Correo electrónico")}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.phone", "Teléfono")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t("common.phone", "Teléfono")}
                      data-testid="input-phone"
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
                data-testid="button-cancel"
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending
                  ? t("common.creating", "Creando...")
                  : t("common.create", "Crear")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
