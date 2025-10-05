import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import type { Property } from "@shared/schema";

const editPropertySchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").optional(),
  propertyType: z.string().min(1, "Selecciona un tipo de propiedad"),
  price: z.string().min(1, "El precio es requerido"),
  location: z.string().min(5, "La ubicación debe tener al menos 5 caracteres"),
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.string().min(1, "Los baños son requeridos"),
  area: z.string().min(1, "El área es requerida"),
  amenities: z.string().optional(),
});

type EditPropertyForm = z.infer<typeof editPropertySchema>;

export default function EditOwnerProperty() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/owner/properties", id, "detail"],
    queryFn: async () => {
      const response = await fetch(`/api/owner/properties/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const form = useForm<EditPropertyForm>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      propertyType: "house",
      price: "",
      location: "",
      bedrooms: 0,
      bathrooms: "",
      area: "",
      amenities: "",
    },
  });

  // Update form when property data loads
  useEffect(() => {
    if (property && !form.formState.isDirty) {
      form.reset({
        title: property.title,
        description: property.description || "",
        propertyType: property.propertyType,
        price: property.price.toString(),
        location: property.location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms.toString(),
        area: property.area.toString(),
        amenities: property.amenities?.join(", ") || "",
      });
    }
  }, [property, form]);

  const submitChangeRequest = useMutation({
    mutationFn: async (data: EditPropertyForm) => {
      const changedFields: Record<string, any> = {};

      if (data.title !== property?.title) changedFields.title = data.title;
      if (data.description !== property?.description) changedFields.description = data.description;
      if (data.propertyType !== property?.propertyType) changedFields.propertyType = data.propertyType;
      if (data.price !== property?.price.toString()) changedFields.price = data.price;
      if (data.location !== property?.location) changedFields.location = data.location;
      if (data.bedrooms !== property?.bedrooms) changedFields.bedrooms = data.bedrooms;
      if (data.bathrooms !== property?.bathrooms.toString()) changedFields.bathrooms = data.bathrooms;
      if (data.area !== property?.area.toString()) changedFields.area = data.area;
      
      const newAmenities = data.amenities
        ? data.amenities.split(",").map((a) => a.trim()).filter((a) => a)
        : [];
      const oldAmenities = property?.amenities || [];
      if (JSON.stringify(newAmenities) !== JSON.stringify(oldAmenities)) {
        changedFields.amenities = newAmenities;
      }

      if (Object.keys(changedFields).length === 0) {
        throw new Error("No se detectaron cambios");
      }

      return await apiRequest("POST", "/api/owner/change-requests", {
        propertyId: id,
        changedFields,
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de cambio ha sido enviada para aprobación",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties", id, "detail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/change-requests"] });
      setLocation(`/owner/property/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold mb-2">Propiedad no encontrada</h3>
          <Button onClick={() => setLocation("/mis-propiedades")}>
            Volver a Mis Propiedades
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/owner/property/${id}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Editar Propiedad
          </h1>
          <p className="text-muted-foreground mt-1">
            Los cambios serán enviados para aprobación del administrador
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Propiedad</CardTitle>
          <CardDescription>
            Modifica la información de tu propiedad. Los cambios serán revisados antes de aplicarse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => submitChangeRequest.mutate(data))}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Casa moderna en zona residencial"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Propiedad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="house">Casa</SelectItem>
                          <SelectItem value="apartment">Apartamento</SelectItem>
                          <SelectItem value="condo">Condominio</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="land">Terreno</SelectItem>
                          <SelectItem value="commercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe las características principales de la propiedad..."
                        rows={4}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (MXN)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="15000"
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Cancún, Quintana Roo"
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Habitaciones</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="3"
                          data-testid="input-bedrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baños</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="2.5"
                          data-testid="input-bathrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="120"
                          data-testid="input-area"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenidades</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Piscina, Gimnasio, Estacionamiento (separadas por coma)"
                        data-testid="input-amenities"
                      />
                    </FormControl>
                    <FormDescription>
                      Separa las amenidades con comas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  type="submit"
                  disabled={submitChangeRequest.isPending}
                  data-testid="button-submit"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitChangeRequest.isPending ? "Enviando..." : "Enviar para Aprobación"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/owner/property/${id}`)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
