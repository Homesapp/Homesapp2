import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Home, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTranslation, Language } from "@/lib/wizardTranslations";

const getStep1Schema = (language: Language) => {
  const t = getTranslation(language);
  return z.object({
    isForRent: z.boolean(),
    isForSale: z.boolean(),
    title: z.string().min(5, t.errors.titleMin),
    customListingTitle: z.string().max(60, t.errors.customListingTitleMax).optional().or(z.literal("")),
    description: z.string().min(20, t.errors.descriptionMin),
    propertyType: z.string().min(1, t.errors.propertyTypeRequired),
    rentalPrice: z.string().optional(),
    rentalPriceCurrency: z.enum(["MXN", "USD"]).default("MXN"),
    salePrice: z.string().optional(),
    salePriceCurrency: z.enum(["MXN", "USD"]).default("MXN"),
    petFriendly: z.boolean().default(false),
    allowsSubleasing: z.boolean().default(false),
  })
  .refine((data) => data.isForRent || data.isForSale, {
    message: t.errors.operationTypeRequired,
    path: ["isForRent"],
  })
  .refine((data) => !data.isForRent || (data.rentalPrice && data.rentalPrice.length > 0), {
    message: t.errors.priceRequired,
    path: ["rentalPrice"],
  })
  .refine((data) => !data.isForSale || (data.salePrice && data.salePrice.length > 0), {
    message: t.errors.priceRequired,
    path: ["salePrice"],
  });
};

type Step1Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  language?: Language;
};

export default function Step1BasicInfo({ data, onUpdate, onNext, language = "es" }: Step1Props) {
  const t = getTranslation(language);
  const step1Schema = getStep1Schema(language);
  type Step1Form = z.infer<typeof step1Schema>;

  // Migración de campos legacy: si existe price/currency (borradores antiguos), migrar a rentalPrice/salePrice
  const legacyPrice = data.basicInfo?.price;
  const legacyCurrency = data.basicInfo?.currency;
  
  const form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      isForRent: data.isForRent || false,
      isForSale: data.isForSale || false,
      title: data.basicInfo?.title || "",
      customListingTitle: data.basicInfo?.customListingTitle || "",
      description: data.basicInfo?.description || "",
      propertyType: data.basicInfo?.propertyType || "house",
      // Migración: usar rentalPrice si existe, si no, usar legacy price si isForRent
      rentalPrice: data.basicInfo?.rentalPrice || (data.isForRent ? legacyPrice : "") || "",
      rentalPriceCurrency: data.basicInfo?.rentalPriceCurrency || (data.isForRent ? legacyCurrency : "MXN") || "MXN",
      // Migración: usar salePrice si existe, si no, usar legacy price si isForSale
      salePrice: data.basicInfo?.salePrice || (data.isForSale ? legacyPrice : "") || "",
      salePriceCurrency: data.basicInfo?.salePriceCurrency || (data.isForSale ? legacyCurrency : "MXN") || "MXN",
      petFriendly: data.basicInfo?.petFriendly || false,
      allowsSubleasing: data.basicInfo?.allowsSubleasing || false,
    },
  });

  const onSubmit = (formData: Step1Form) => {
    // Mantener campos legacy para compatibilidad con componentes downstream
    // Si solo isForRent, usar rentalPrice como price legacy
    // Si solo isForSale, usar salePrice como price legacy
    // Si ambos, dar prioridad a rentalPrice para legacy
    const legacyPrice = formData.isForRent ? formData.rentalPrice : formData.salePrice;
    const legacyCurrency = formData.isForRent ? formData.rentalPriceCurrency : formData.salePriceCurrency;
    
    onNext({
      isForRent: formData.isForRent,
      isForSale: formData.isForSale,
      basicInfo: {
        title: formData.title,
        customListingTitle: formData.customListingTitle && formData.customListingTitle.trim() !== "" ? formData.customListingTitle : undefined,
        description: formData.description,
        propertyType: formData.propertyType,
        // Nuevos campos
        rentalPrice: formData.rentalPrice,
        rentalPriceCurrency: formData.rentalPriceCurrency,
        salePrice: formData.salePrice,
        salePriceCurrency: formData.salePriceCurrency,
        // Campos legacy para compatibilidad
        price: legacyPrice,
        currency: legacyCurrency,
        petFriendly: formData.petFriendly,
        allowsSubleasing: formData.allowsSubleasing,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step1-title">
          {t.step1.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step1-description">
          {t.step1.subtitle}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Operación */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step1.operationType}</h3>
              <p className="text-sm text-muted-foreground">
                {t.step1.operationDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isForRent"
                render={({ field }) => (
                  <FormItem>
                    <Card 
                      className={`cursor-pointer transition-all hover-elevate ${
                        field.value ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid="card-rent-option"
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Home className="w-12 h-12 text-primary" />
                        <div className="text-center space-y-1">
                          <h4 className="font-semibold" data-testid="text-rent-title">
                            {t.step1.rent}
                          </h4>
                          <p className="text-xs text-muted-foreground" data-testid="text-rent-description">
                            {t.step1.rentDescription}
                          </p>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-rent"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isForSale"
                render={({ field }) => (
                  <FormItem>
                    <Card
                      className={`cursor-pointer transition-all hover-elevate ${
                        field.value ? "ring-2 ring-primary" : ""
                      }`}
                      data-testid="card-sale-option"
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                        <Building2 className="w-12 h-12 text-primary" />
                        <div className="text-center space-y-1">
                          <h4 className="font-semibold" data-testid="text-sale-title">
                            {t.step1.sale}
                          </h4>
                          <p className="text-xs text-muted-foreground" data-testid="text-sale-description">
                            {t.step1.saleDescription}
                          </p>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-sale"
                          />
                        </FormControl>
                      </CardContent>
                    </Card>
                  </FormItem>
                )}
              />
            </div>

            {(form.formState.errors.isForRent || form.formState.errors.isForSale) && (
              <p className="text-sm text-destructive" data-testid="error-operation-type">
                {form.formState.errors.isForRent?.message || form.formState.errors.isForSale?.message}
              </p>
            )}
          </div>

          <Separator />

          {/* Información Básica */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step1.mainDetails}</h3>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.propertyTitle} *</FormLabel>
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
              name="customListingTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.customListingTitle}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.step1.customListingTitlePlaceholder}
                      maxLength={60}
                      {...field}
                      data-testid="input-custom-listing-title"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t.step1.customListingTitleDescription}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.step1.description} *</FormLabel>
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
                  <FormLabel>{t.step1.propertyType} *</FormLabel>
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

            {/* Precio de Renta (solo si isForRent) */}
            {form.watch("isForRent") && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">
                  {language === "es" ? "Precio de Renta" : "Rental Price"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rentalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Precio Mensual de Renta" : "Monthly Rental Price"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={t.step1.pricePlaceholder}
                            {...field}
                            data-testid="input-rental-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rentalPriceCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step1.currency} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-rental-currency">
                              <SelectValue placeholder={t.step1.currency} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MXN" data-testid="option-rental-currency-mxn">
                              {t.step1.mxn}
                            </SelectItem>
                            <SelectItem value="USD" data-testid="option-rental-currency-usd">
                              {t.step1.usd}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {t.step1.currencyDesc}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Precio de Venta (solo si isForSale) */}
            {form.watch("isForSale") && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">
                  {language === "es" ? "Precio de Venta" : "Sale Price"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "es" ? "Precio de Venta" : "Sale Price"} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={language === "es" ? "Ej: 5000000" : "Ex: 5000000"}
                            {...field}
                            data-testid="input-sale-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePriceCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.step1.currency} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sale-currency">
                              <SelectValue placeholder={t.step1.currency} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MXN" data-testid="option-sale-currency-mxn">
                              {t.step1.mxn}
                            </SelectItem>
                            <SelectItem value="USD" data-testid="option-sale-currency-usd">
                              {t.step1.usd}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {t.step1.currencyDesc}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Mascotas y Subarrendamiento */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="petFriendly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t.step1.petFriendly}
                      </FormLabel>
                      <FormDescription>
                        {t.step1.petFriendlyDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pet-friendly"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowsSubleasing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t.step1.allowsSubleasing}
                      </FormLabel>
                      <FormDescription>
                        {t.step1.allowsSubleasingDesc}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allows-subleasing"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full sm:w-auto" data-testid="button-next-step1">
              {t.next}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
