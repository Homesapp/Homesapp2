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

const basicInfoSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  propertyType: z.string().min(1, "Selecciona un tipo de propiedad"),
  price: z.string().min(1, "El precio es requerido"),
  unitType: z.enum(["private", "condo"], { required_error: "Selecciona el tipo de unidad" }),
  condoName: z.string().optional(),
  unitNumber: z.string().optional(),
}).refine((data) => {
  if (data.unitType === "condo") {
    return data.condoName && data.condoName.length > 0 && data.unitNumber && data.unitNumber.length > 0;
  }
  return true;
}, {
  message: "Para unidades en condominio, debes proporcionar el nombre del condominio y número de unidad",
  path: ["condoName"],
});

type BasicInfoForm = z.infer<typeof basicInfoSchema>;

type Step2Props = {
  data: any;
  onUpdate: (data: any) => void;
  onNext: (stepData?: any) => void;
  onPrevious: () => void;
};

export default function Step2BasicInfo({ data, onUpdate, onNext, onPrevious }: Step2Props) {
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
          Información Básica
        </h2>
        <p className="text-muted-foreground" data-testid="text-step2-description">
          Proporciona los detalles principales de la propiedad
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Casa moderna en zona céntrica"
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
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe la propiedad en detalle..."
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
                <FormLabel>Tipo de Propiedad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="house" data-testid="option-property-house">Casa</SelectItem>
                    <SelectItem value="apartment" data-testid="option-property-apartment">Apartamento</SelectItem>
                    <SelectItem value="condo" data-testid="option-property-condo">Condominio</SelectItem>
                    <SelectItem value="land" data-testid="option-property-land">Terreno</SelectItem>
                    <SelectItem value="commercial" data-testid="option-property-commercial">Comercial</SelectItem>
                    <SelectItem value="office" data-testid="option-property-office">Oficina</SelectItem>
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
                <FormLabel>Precio (MXN)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej: 5000000"
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
                <FormLabel>Tipo de Unidad</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" data-testid="radio-private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">
                        Unidad Privada (casa privada a la calle)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="condo" id="condo" data-testid="radio-condo" />
                      <Label htmlFor="condo" className="font-normal cursor-pointer">
                        En Condominio
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
                    <FormLabel>Nombre del Condominio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Residencial Las Palmas"
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
                    <FormLabel>Número de Unidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 101, A-15, etc."
                        {...field}
                        data-testid="input-unit-number"
                      />
                    </FormControl>
                    <FormDescription>
                      Número o identificador de la unidad dentro del condominio
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
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next-step2">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
