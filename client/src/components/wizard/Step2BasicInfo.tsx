import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getBasicInfoSchema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    title: z.string().min(5, t.errors.titleMin),
    description: z.string().min(20, t.errors.descriptionMin),
    propertyType: z.string().min(1, t.errors.propertyTypeRequired),
    price: z.string().min(1, t.errors.priceRequired),
    unitType: z.enum(["private", "condo"], { required_error: t.errors.required }),
    condoName: z.string().optional(),
    unitNumber: z.string().optional(),
  }).refine((data) => {
    if (data.unitType === "condo") {
      return data.condoName && data.condoName.length > 0 && data.unitNumber && data.unitNumber.length > 0;
    }
    return true;
  }, {
    message: t.errors.required,
    path: ["condoName"],
  });
};

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
  language?: Language;
};

export default function Step2BasicInfo({ data, onUpdate, onNext, onPrevious, language = "es" }: Step2Props) {
  const t = getTranslation(language);
  const basicInfoSchema = getBasicInfoSchema(language);
  type BasicInfoForm = z.infer<typeof basicInfoSchema>;

  const form = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      title: data.basicInfo?.title || "",
      description: data.basicInfo?.description || "",
      propertyType: data.basicInfo?.propertyType || "house",
      price: data.basicInfo?.price || "",
      unitType: data.basicInfo?.unitType || "private",
      condoName: data.basicInfo?.condoName || "",
      unitNumber: data.basicInfo?.unitNumber || "",
    },
  });

  const unitType = form.watch("unitType");

  const onSubmit = (formData: BasicInfoForm) => {
    // Pass the form data directly to onNext
    onNext({ basicInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step2-title">
          {t.step1.mainDetails}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          {t.step1.descriptionDesc}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step1.propertyTitle}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.step1.titlePlaceholder}
                    {...field}
                    data-testid="input-title"
                  />
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
                <FormLabel>{t.step1.description}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t.step1.descriptionPlaceholder}
                    rows={4}
                    {...field}
                    data-testid="textarea-description"
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
                <FormLabel>{t.step1.propertyType}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder={t.step1.selectPropertyType} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="house" data-testid="option-property-house">
                      {t.step1.propertyTypes.house}
                    </SelectItem>
                    <SelectItem value="apartment" data-testid="option-property-apartment">
                      {t.step1.propertyTypes.apartment}
                    </SelectItem>
                    <SelectItem value="condo" data-testid="option-property-condo">
                      {t.step1.propertyTypes.condo}
                    </SelectItem>
                    <SelectItem value="land" data-testid="option-property-land">
                      {t.step1.propertyTypes.land}
                    </SelectItem>
                    <SelectItem value="commercial" data-testid="option-property-commercial">
                      {t.step1.propertyTypes.commercial}
                    </SelectItem>
                    <SelectItem value="office" data-testid="option-property-office">
                      {t.step1.propertyTypes.office}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.step1.price} (MXN)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t.step1.pricePlaceholder}
                    {...field}
                    data-testid="input-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t.step2.location}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" data-testid="radio-private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">
                        {t.step2.noCondominium}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="condo" id="condo" data-testid="radio-condo" />
                      <Label htmlFor="condo" className="font-normal cursor-pointer">
                        {t.step2.condominium}
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {unitType === "condo" && (
            <>
              <FormField
                control={form.control}
                name="condoName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step2.newCondoName}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.step2.newCondominiumPlaceholder}
                        {...field}
                        data-testid="input-condo-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.step2.unitNumber}</FormLabel>
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
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-testid="button-previous-step2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.previous}
            </Button>
            <Button type="submit" data-testid="button-next-step2">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
