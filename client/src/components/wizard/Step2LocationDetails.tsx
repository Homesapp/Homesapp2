import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { SuggestCondoDialog } from "@/components/SuggestCondoDialog";
import { SuggestAmenityDialog } from "@/components/SuggestAmenityDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Colony, Condominium, Amenity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const step2Schema = z.object({
  // Ubicación
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  city: z.string().min(2, "La ciudad es requerida"),
  state: z.string().min(2, "El estado es requerido"),
  zipCode: z.string().min(4, "El código postal debe tener al menos 4 caracteres"),
  colonyId: z.string().optional(),
  condominiumId: z.string().optional(),
  unitNumber: z.string().optional(),
  googleMapsUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  // Detalles
  bedrooms: z.coerce.number().int().min(0, "Las habitaciones deben ser un número positivo"),
  bathrooms: z.coerce.number().min(0, "Los baños deben ser un número positivo"),
  area: z.coerce.number().min(1, "El área debe ser mayor a 0"),
  propertyAmenities: z.array(z.string()).optional().default([]),
  condoAmenities: z.array(z.string()).optional().default([]),
});

type Step2Form = z.infer<typeof step2Schema>;

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step2LocationDetails({ data, onUpdate, onNext, onPrevious }: Step2Props) {
  const { t } = useLanguage();
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [showAmenityDialog, setShowAmenityDialog] = useState(false);

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Fetch approved amenities by category
  const { data: propertyAmenitiesList = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/approved", "property"],
    queryFn: async () => {
      const response = await fetch("/api/amenities/approved?category=property");
      if (!response.ok) throw new Error("Failed to fetch property amenities");
      return response.json();
    },
  });

  const { data: condoAmenitiesList = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities/approved", "condo"],
    queryFn: async () => {
      const response = await fetch("/api/amenities/approved?category=condo");
      if (!response.ok) throw new Error("Failed to fetch condo amenities");
      return response.json();
    },
  });

  const form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      // Ubicación
      address: data.locationInfo?.address || "",
      city: data.locationInfo?.city || "",
      state: data.locationInfo?.state || "",
      zipCode: data.locationInfo?.zipCode || "",
      colonyId: data.locationInfo?.colonyId || "",
      condominiumId: data.locationInfo?.condominiumId || "",
      unitNumber: data.locationInfo?.unitNumber || "",
      googleMapsUrl: data.locationInfo?.googleMapsUrl || "",
      latitude: data.locationInfo?.latitude || "",
      longitude: data.locationInfo?.longitude || "",
      // Detalles
      bedrooms: data.details?.bedrooms || 0,
      bathrooms: data.details?.bathrooms || 0,
      area: data.details?.area || 0,
      propertyAmenities: data.details?.propertyAmenities || [],
      condoAmenities: data.details?.condoAmenities || [],
    },
  });

  const onSubmit = async (formData: Step2Form) => {
    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      locationInfo: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        colonyId: formData.colonyId && formData.colonyId.trim() !== "" ? formData.colonyId : undefined,
        condominiumId: formData.condominiumId && formData.condominiumId.trim() !== "" ? formData.condominiumId : undefined,
        unitNumber: formData.unitNumber && formData.unitNumber.trim() !== "" ? formData.unitNumber : undefined,
        googleMapsUrl: formData.googleMapsUrl && formData.googleMapsUrl.trim() !== "" ? formData.googleMapsUrl : undefined,
        latitude: formData.latitude && formData.latitude.trim() !== "" ? formData.latitude : undefined,
        longitude: formData.longitude && formData.longitude.trim() !== "" ? formData.longitude : undefined,
      },
      details: {
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        propertyAmenities: formData.propertyAmenities || [],
        condoAmenities: formData.condoAmenities || [],
      },
    };
    onNext(cleanedData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step2-title">
          Ubicación y Características
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          Detalles de la ubicación y características físicas
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de Ubicación */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ubicación</h3>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Calle Principal 123"
                      {...field}
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Tulum"
                        {...field}
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Quintana Roo"
                        {...field}
                        data-testid="input-state"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 77760"
                        {...field}
                        data-testid="input-zipcode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="colonyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colonia (Opcional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-colony">
                          <SelectValue placeholder="Sin colonia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colonies.map((colony) => (
                          <SelectItem
                            key={colony.id}
                            value={colony.id}
                            data-testid={`option-colony-${colony.id}`}
                          >
                            {colony.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowColonyDialog(true)}
                      data-testid="button-suggest-colony"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condominiumId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condominio (Opcional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-condominium">
                          <SelectValue placeholder="Sin condominio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {condominiums.map((condo) => (
                          <SelectItem
                            key={condo.id}
                            value={condo.id}
                            data-testid={`option-condo-${condo.id}`}
                          >
                            {condo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCondoDialog(true)}
                      data-testid="button-suggest-condo"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Unidad (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 101, A-5..."
                      {...field}
                      data-testid="input-unit-number"
                    />
                  </FormControl>
                  <FormDescription>
                    Si la propiedad está en un condominio, especifica el número
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="googleMapsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Google Maps (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://maps.google.com/..."
                      {...field}
                      data-testid="input-google-maps-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Sección de Detalles */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Características</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habitaciones *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ej: 3"
                        {...field}
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
                    <FormLabel>Baños *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        placeholder="Ej: 2"
                        {...field}
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
                    <FormLabel>Área (m²) *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ej: 150"
                        {...field}
                        data-testid="input-area"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Características de la Propiedad */}
            <FormField
              control={form.control}
              name="propertyAmenities"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Características de la Propiedad</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAmenityDialog(true)}
                      data-testid="button-suggest-amenity"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Sugerir
                    </Button>
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap gap-2" data-testid="container-property-amenities">
                      {propertyAmenitiesList.map((amenity) => {
                        const isSelected = field.value?.includes(amenity.id);
                        return (
                          <Badge
                            key={amenity.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover-elevate active-elevate-2"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((id) => id !== amenity.id) || []
                                : [...(field.value || []), amenity.id];
                              field.onChange(newValue);
                            }}
                            data-testid={`badge-property-amenity-${amenity.id}`}
                          >
                            {amenity.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amenidades del Condominio */}
            <FormField
              control={form.control}
              name="condoAmenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenidades del Condominio (Si aplica)</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2" data-testid="container-condo-amenities">
                      {condoAmenitiesList.map((amenity) => {
                        const isSelected = field.value?.includes(amenity.id);
                        return (
                          <Badge
                            key={amenity.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover-elevate active-elevate-2"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((id) => id !== amenity.id) || []
                                : [...(field.value || []), amenity.id];
                              field.onChange(newValue);
                            }}
                            data-testid={`badge-condo-amenity-${amenity.id}`}
                          >
                            {amenity.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="w-full sm:w-auto"
              data-testid="button-previous-step2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" className="w-full sm:w-auto" data-testid="button-next-step2">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>

      <SuggestColonyDialog
        open={showColonyDialog}
        onOpenChange={setShowColonyDialog}
      />
      
      <SuggestCondoDialog
        open={showCondoDialog}
        onOpenChange={setShowCondoDialog}
      />

      <SuggestAmenityDialog
        open={showAmenityDialog}
        onOpenChange={setShowAmenityDialog}
      />
    </div>
  );
}
