import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Upload, X, Star, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "shared/schema";
import type { EditWizardData } from "../PropertyEditWizard";

const mediaSchema = z.object({
  primaryImages: z.array(z.string()).min(1, "Debes tener al menos 1 imagen principal"),
  coverImageIndex: z.number().min(0).default(0),
  secondaryImages: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  virtualTourUrl: z.string().url().optional().or(z.literal("")),
});

type MediaForm = z.infer<typeof mediaSchema>;

interface EditStep3Props {
  property: Property;
  data: EditWizardData;
  onUpdate: (data: Partial<EditWizardData>, modifiedFields?: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function EditStep3Media({ property, data, onUpdate, onNext, onPrevious }: EditStep3Props) {
  const { toast } = useToast();
  const [primaryImages, setPrimaryImages] = useState<string[]>(
    data.primaryImages || property.primaryImages || []
  );
  const [secondaryImages, setSecondaryImages] = useState<string[]>(
    data.secondaryImages || property.secondaryImages || []
  );
  const [coverImageIndex, setCoverImageIndex] = useState<number>(
    data.coverImageIndex ?? property.coverImageIndex ?? 0
  );
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MediaForm>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      primaryImages: primaryImages,
      coverImageIndex: coverImageIndex,
      secondaryImages: secondaryImages,
      videos: data.videos || property.videos || [],
      virtualTourUrl: data.virtualTourUrl || property.virtualTourUrl || "",
    },
  });

  const handleFileUpload = async (file: File, isPrimary: boolean) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten imágenes",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      if (isPrimary) {
        if (primaryImages.length >= 5) {
          toast({
            variant: "destructive",
            title: "Límite alcanzado",
            description: "Máximo 5 imágenes principales",
          });
          return;
        }
        const newImages = [...primaryImages, base64String];
        setPrimaryImages(newImages);
        form.setValue("primaryImages", newImages);
      } else {
        if (secondaryImages.length >= 20) {
          toast({
            variant: "destructive",
            title: "Límite alcanzado",
            description: "Máximo 20 imágenes secundarias",
          });
          return;
        }
        const newImages = [...secondaryImages, base64String];
        setSecondaryImages(newImages);
        form.setValue("secondaryImages", newImages);
      }
    };
    reader.readAsDataURL(file);
  };

  const removePrimaryImage = (index: number) => {
    const newImages = primaryImages.filter((_, i) => i !== index);
    setPrimaryImages(newImages);
    form.setValue("primaryImages", newImages);
    if (coverImageIndex >= newImages.length) {
      setCoverImageIndex(Math.max(0, newImages.length - 1));
      form.setValue("coverImageIndex", Math.max(0, newImages.length - 1));
    }
  };

  const removeSecondaryImage = (index: number) => {
    const newImages = secondaryImages.filter((_, i) => i !== index);
    setSecondaryImages(newImages);
    form.setValue("secondaryImages", newImages);
  };

  const setCoverImage = (index: number) => {
    setCoverImageIndex(index);
    form.setValue("coverImageIndex", index);
  };

  const onSubmit = (formData: MediaForm) => {
    const modified: string[] = [];
    
    const originalPrimary = property.primaryImages || [];
    const originalSecondary = property.secondaryImages || [];
    
    if (JSON.stringify(formData.primaryImages) !== JSON.stringify(originalPrimary)) {
      modified.push("primaryImages");
    }
    if (formData.coverImageIndex !== (property.coverImageIndex ?? 0)) {
      modified.push("coverImageIndex");
    }
    if (JSON.stringify(formData.secondaryImages) !== JSON.stringify(originalSecondary)) {
      modified.push("secondaryImages");
    }
    if (formData.virtualTourUrl !== (property.virtualTourUrl || "")) {
      modified.push("virtualTourUrl");
    }

    onUpdate({
      primaryImages: formData.primaryImages,
      coverImageIndex: formData.coverImageIndex,
      secondaryImages: formData.secondaryImages,
      videos: formData.videos,
      virtualTourUrl: formData.virtualTourUrl || undefined,
    }, modified);
    
    onNext();
  };

  const hasChanges = () => {
    const values = form.getValues();
    const originalPrimary = property.primaryImages || [];
    const originalSecondary = property.secondaryImages || [];
    
    return (
      JSON.stringify(values.primaryImages) !== JSON.stringify(originalPrimary) ||
      values.coverImageIndex !== (property.coverImageIndex ?? 0) ||
      JSON.stringify(values.secondaryImages) !== JSON.stringify(originalSecondary) ||
      values.virtualTourUrl !== (property.virtualTourUrl || "")
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Multimedia</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza las fotos y medios de la propiedad
        </p>
      </div>

      {hasChanges() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has realizado cambios en esta sección
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Primary Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Imágenes Principales (Máximo 5)</FormLabel>
              <Badge variant="outline">{primaryImages.length}/5</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {primaryImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Imagen principal ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {coverImageIndex === idx && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Portada
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {coverImageIndex !== idx && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => setCoverImage(idx)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => removePrimaryImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {primaryImages.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => primaryFileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Agregar Imagen Principal
              </Button>
            )}
            <input
              ref={primaryFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, true);
                e.target.value = "";
              }}
            />
          </div>

          {/* Secondary Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Imágenes Secundarias (Máximo 20)</FormLabel>
              <Badge variant="outline">{secondaryImages.length}/20</Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {secondaryImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Imagen secundaria ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSecondaryImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {secondaryImages.length < 20 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => secondaryFileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Agregar Imagen Secundaria
              </Button>
            )}
            <input
              ref={secondaryFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, false);
                e.target.value = "";
              }}
            />
          </div>

          {/* Virtual Tour URL */}
          <FormField
            control={form.control}
            name="virtualTourUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Tour Virtual (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://..." data-testid="input-virtualTourUrl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onPrevious} data-testid="button-previous">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button type="submit" data-testid="button-next">
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
