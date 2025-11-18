import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertExternalAgencySchema } from "@shared/schema";
import type { ExternalAgency } from "@shared/schema";
import { z } from "zod";

const formSchema = insertExternalAgencySchema.extend({});

export default function ExternalAgencyConfig() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const { data: agency, isLoading } = useQuery<ExternalAgency>({
    queryKey: ['/api/external-agencies'],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: agency?.name || "",
      email: agency?.email || "",
      phone: agency?.phone || "",
      address: agency?.address || "",
      contactPerson: agency?.contactPerson || "",
    },
  });

  // Update form when agency data loads
  if (agency && !form.formState.isDirty) {
    form.reset({
      name: agency.name,
      email: agency.email || "",
      phone: agency.phone || "",
      address: agency.address || "",
      contactPerson: agency.contactPerson || "",
    });
  }

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!agency) {
        return await apiRequest("POST", "/api/external-agencies", data);
      }
      return await apiRequest("PATCH", `/api/external-agencies/${agency.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-agencies'] });
      toast({
        title: language === "es" ? "Agencia actualizada" : "Agency updated",
        description: language === "es" 
          ? "La información de la agencia ha sido actualizada exitosamente"
          : "Agency information has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo actualizar la información de la agencia"
          : "Could not update agency information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === "es" ? "Configuración de Agencia" : "Agency Configuration"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "es" 
            ? "Administra la información de tu agencia externa"
            : "Manage your external agency information"}
        </p>
      </div>

      <Card data-testid="card-agency-info">
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Información de la Agencia" : "Agency Information"}
          </CardTitle>
          <CardDescription>
            {language === "es" 
              ? "Actualiza los datos de contacto y detalles de tu agencia"
              : "Update your agency contact details and information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Nombre de la Agencia" : "Agency Name"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-agency-name"
                          placeholder={language === "es" ? "Ej: Mi Agencia Inmobiliaria" : "E.g.: My Real Estate Agency"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Email" : "Email"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          data-testid="input-agency-email"
                          placeholder={language === "es" ? "contacto@miagencia.com" : "contact@myagency.com"}
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
                      <FormLabel>{language === "es" ? "Teléfono" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-agency-phone"
                          placeholder="+52 984 123 4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Persona de Contacto" : "Contact Person"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-contact-person"
                          placeholder={language === "es" ? "Juan Pérez" : "John Doe"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === "es" ? "Dirección" : "Address"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          data-testid="input-agency-address"
                          placeholder={language === "es" 
                            ? "Av. Tulum #123, Centro, Tulum, Q.Roo" 
                            : "123 Tulum Ave, Downtown, Tulum, Q.Roo"}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    data-testid="button-save-agency"
                  >
                    {updateMutation.isPending 
                      ? (language === "es" ? "Guardando..." : "Saving...")
                      : (language === "es" ? "Guardar Cambios" : "Save Changes")}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
