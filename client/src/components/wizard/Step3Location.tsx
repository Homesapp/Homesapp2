import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SuggestColonyDialog } from "@/components/SuggestColonyDialog";
import { SuggestCondominiumDialog } from "@/components/SuggestCondominiumDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import type { Colony, Condominium } from "@shared/schema";

const getLocationSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    address: z.string().min(5, t.errors.addressMin),
    city: z.string().min(2, t.errors.cityMin),
    state: z.string().min(2, t.errors.stateMin),
    zipCode: z.string().min(4, t.errors.zipCodeMin),
    colonyId: z.string().optional(),
    condominiumId: z.string().optional(),
    unitNumber: z.string().optional(),
    googleMapsUrl: z.string().url(t.errors.googleMapsValidUrl).optional().or(z.literal("")),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  });
};

type Step3Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step3Location({ data, onUpdate, onNext, onPrevious, language = "es" }: Step3Props) {
  const t = getTranslation(language);
  const locationSchema = getLocationSchema(language);
  type LocationForm = z.infer<typeof locationSchema>;
  
  const { toast } = useToast();
  const [showColonyDialog, setShowColonyDialog] = useState(false);
  const [showCondoDialog, setShowCondoDialog] = useState(false);
  const [showNewCondoInput, setShowNewCondoInput] = useState(false);
  const [newCondoName, setNewCondoName] = useState("");

  // Fetch approved colonies
  const { data: colonies = [] } = useQuery<Colony[]>({
    queryKey: ["/api/colonies/approved"],
  });

  // Fetch approved condominiums
  const { data: condominiums = [] } = useQuery<Condominium[]>({
    queryKey: ["/api/condominiums/approved"],
  });

  // Mutation para crear sugerencia de condominio automáticamente
  const createCondoSuggestion = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/condominiums", { name });
    },
  });

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
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
    },
  });

  const onSubmit = async (formData: LocationForm) => {
    let pendingCondoName: string | undefined = undefined;
    let finalCondoId: string | undefined = formData.condominiumId;
    
    // Si seleccionaron "nuevo" y escribieron un nombre, crear sugerencia
    if (formData.condominiumId === "NEW_CONDO" && newCondoName.trim() !== "") {
      pendingCondoName = newCondoName.trim();
      
      try {
        // Crear sugerencia automáticamente sin bloquear el flujo
        await createCondoSuggestion.mutateAsync(newCondoName.trim());
        toast({
          title: t.notifications.suggestionSentTitle,
          description: `${t.step2.condominium} "${newCondoName}" ${t.notifications.suggestionSentDesc}`,
        });
        // Limpiar el ID porque no está aprobado aún
        finalCondoId = undefined;
      } catch (error: any) {
        // Si falla, mostrar error informativo pero permitir continuar
        console.error("Error creating condo suggestion:", error);
        toast({
          title: t.notifications.suggestionErrorTitle,
          description: `${t.step2.condominium} "${newCondoName}" ${t.notifications.suggestionErrorDesc}`,
          variant: "destructive",
        });
        finalCondoId = undefined;
      }
    } else if (formData.condominiumId === "NEW_CONDO") {
      // Si seleccionaron nuevo pero no escribieron nada, limpiar
      finalCondoId = undefined;
    }

    // Transform empty strings to undefined for optional fields
    const cleanedData = {
      ...formData,
      colonyId: formData.colonyId && formData.colonyId.trim() !== "" ? formData.colonyId : undefined,
      condominiumId: finalCondoId && finalCondoId.trim() !== "" && finalCondoId !== "NEW_CONDO" ? finalCondoId : undefined,
      unitNumber: formData.unitNumber && formData.unitNumber.trim() !== "" ? formData.unitNumber : undefined,
      googleMapsUrl: formData.googleMapsUrl && formData.googleMapsUrl.trim() !== "" ? formData.googleMapsUrl : undefined,
      latitude: formData.latitude && formData.latitude.trim() !== "" ? formData.latitude : undefined,
      longitude: formData.longitude && formData.longitude.trim() !== "" ? formData.longitude : undefined,
      pendingCondoName, // Guardar el nombre del condominio pendiente
    };
    onNext({ locationInfo: cleanedData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step3-title">
          {t.step2.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step3-description">
          {t.step2.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step2.address}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step2.addressPlaceholder}
                    {...field}
                    data-testid="input-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step2.city}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.cityPlaceholder}
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
                  <FormLabel>{t.step2.state}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step2.statePlaceholder}
                      {...field}
                      data-testid="input-state"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step2.zipCode}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step2.zipCodePlaceholder}
                    {...field}
                    data-testid="input-zipcode"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="colonyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step2.colony} ({t.step1.customListingTitleDescription.split(',')[0]})</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-colony">
                        <SelectValue placeholder={t.step2.colonyPlaceholder} />
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
                <FormDescription>
                  {t.step2.suggestDialogDescription}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condominiumId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step2.condominium} ({t.step1.customListingTitleDescription.split(',')[0]})</FormLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowNewCondoInput(value === "NEW_CONDO");
                    if (value !== "NEW_CONDO") {
                      setNewCondoName("");
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-condominium">
                      <SelectValue placeholder={t.step2.condominiumPlaceholder} />
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
                    <SelectItem value="NEW_CONDO" data-testid="option-new-condo">
                      ✏️ {t.step2.addNewCondominium}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t.step2.selectCondominium}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Input condicional para nombre de nuevo condominio */}
          {showNewCondoInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.step2.newCondoName}
              </label>
              <Input
                value={newCondoName}
                onChange={(e) => setNewCondoName(e.target.value)}
                placeholder={t.step2.newCondominiumPlaceholder}
                data-testid="input-new-condo-name"
              />
              <p className="text-sm text-muted-foreground">
                {t.step2.suggestDialogDescription}
              </p>
            </div>
          )}

          <FormField
            control={form.control}
            name="unitNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step2.unitNumber} ({t.step1.customListingTitleDescription.split(',')[0]})</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step2.unitNumberPlaceholder}
                    {...field}
                    data-testid="input-unit-number"
                  />
                </FormControl>
                <FormDescription>
                  {t.step2.unitNumberDescription}
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
                <FormLabel>{t.step2.googleMapsUrl} ({t.step1.customListingTitleDescription.split(',')[0]})</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step2.googleMapsPlaceholder}
                    {...field}
                    data-testid="input-google-maps-url"
                  />
                </FormControl>
                <FormDescription>
                  {t.step2.googleMapsDesc}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous-step3"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button type="submit" data-testid="button-next-step3">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>

      <SuggestColonyDialog
        open={showColonyDialog}
        onOpenChange={setShowColonyDialog}
      />
      <SuggestCondominiumDialog
        open={showCondoDialog}
        onOpenChange={setShowCondoDialog}
      />
    </div>
  );
}
