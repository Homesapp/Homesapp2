import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getDetailsSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    bedrooms: z.coerce.number().int().min(0, t.errors.bedroomsPositive),
    bathrooms: z.coerce.number().min(0, t.errors.bathroomsPositive),
    area: z.coerce.number().min(1, t.errors.areaGreaterThanZero),
    amenities: z.string().optional(),
  });
};

type Step4Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step4Details({ data, onUpdate, onNext, onPrevious, language = "es" }: Step4Props) {
  const t = getTranslation(language);
  const detailsSchema = getDetailsSchema(language);
  type DetailsForm = z.infer<typeof detailsSchema>;

  const form = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      bedrooms: data.details?.bedrooms || 0,
      bathrooms: data.details?.bathrooms || 0,
      area: data.details?.area || 0,
      amenities: data.details?.amenities || "",
    },
  });

  const onSubmit = (formData: DetailsForm) => {
    onNext({ details: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step4-title">
          {t.step2.characteristics}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step4-description">
          {t.step2.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step2.bedrooms}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={t.step2.bedroomsPlaceholder}
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
                  <FormLabel>{t.step2.bathrooms}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder={t.step2.bathroomsPlaceholder}
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
                  <FormLabel>{t.step2.area}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={t.step2.areaPlaceholder}
                      {...field}
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
                <FormLabel>{t.step2.propertyAmenities}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t.step2.propertyAmenities}
                    rows={3}
                    {...field}
                    data-testid="textarea-amenities"
                  />
                </FormControl>
                <FormDescription data-testid="text-amenities-description">
                  {t.step2.noAmenitiesSelected}
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
              data-testid="button-previous-step4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button type="submit" data-testid="button-next-step4">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
