import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Condominium = {
  id: string;
  name: string;
  approvalStatus: string;
};

const hoaManagerRequestSchema = z.object({
  condominiumId: z.string().min(1, "Debes seleccionar un condominio"),
  notes: z.string().optional(),
});

type HoaManagerRequestData = z.infer<typeof hoaManagerRequestSchema>;

interface RequestHoaManagerDialogProps {
  trigger?: React.ReactNode;
}

export function RequestHoaManagerDialog({ trigger }: RequestHoaManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch approved condominiums
  const { data: condominiums = [], isLoading: loadingCondominiums } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums"],
    queryFn: async () => {
      const response = await fetch("/api/condominiums?approvalStatus=approved");
      if (!response.ok) throw new Error("Failed to fetch condominiums");
      return response.json();
    },
  });

  const form = useForm<HoaManagerRequestData>({
    resolver: zodResolver(hoaManagerRequestSchema),
    defaultValues: {
      condominiumId: "",
      notes: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: HoaManagerRequestData) => {
      return await apiRequest("POST", "/api/hoa-manager/assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hoa-manager/my-assignments"] });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud para ser HOA Manager ha sido enviada exitosamente. Un administrador la revisará pronto.",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HoaManagerRequestData) => {
    requestMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-request-hoa-manager">
            <Building2 className="h-4 w-4 mr-2" />
            Solicitar ser HOA Manager
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar ser HOA Manager</DialogTitle>
          <DialogDescription>
            Selecciona el condominio que deseas administrar. Un administrador revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="condominiumId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condominio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingCondominiums}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-condominium-request">
                        <SelectValue placeholder="Selecciona un condominio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {condominiums.map((condominium) => (
                        <SelectItem
                          key={condominium.id}
                          value={condominium.id}
                          data-testid={`select-option-condominium-${condominium.id}`}
                        >
                          {condominium.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Solo podrás administrar este condominio y sus propiedades
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agrega información adicional sobre tu solicitud..."
                      className="resize-none"
                      rows={4}
                      data-testid="textarea-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explica por qué deseas administrar este condominio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-request"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={requestMutation.isPending}
                data-testid="button-submit-request"
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
