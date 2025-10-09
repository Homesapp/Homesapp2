import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCreateProperty, useUpdateProperty } from "@/hooks/useProperties";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  mode: "create" | "edit";
}

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  mode,
}: PropertyFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const [imageFiles, setImageFiles] = useState<{ name: string; data: string }[]>([]);

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0",
      currency: "MXN",
      bedrooms: 1,
      bathrooms: "1",
      area: "0",
      location: "",
      status: "rent",
      amenities: [],
      images: [],
      ownerId: "",
      managementId: undefined,
      active: true,
      accessInfo: undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    
    if (property && mode === "edit") {
      const accessInfo = property.accessInfo as { lockboxCode?: string; contactPerson?: string; contactPhone?: string } | null;
      form.reset({
        title: property.title,
        description: property.description || "",
        price: property.price,
        currency: property.currency,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        location: property.location,
        status: property.status,
        amenities: property.amenities || [],
        images: property.images || [],
        ownerId: property.ownerId,
        managementId: property.managementId || undefined,
        active: property.active,
        accessInfo: accessInfo || undefined,
      });
      // Load existing images
      const files = (property.images || []).map((data, index) => ({
        name: `Imagen ${index + 1}`,
        data,
      }));
      setImageFiles(files);
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        price: "0",
        currency: "MXN",
        bedrooms: 1,
        bathrooms: "1",
        area: "0",
        location: "",
        status: "rent",
        amenities: [],
        images: [],
        ownerId: "",
        managementId: undefined,
        active: true,
        accessInfo: undefined,
      });
      setImageFiles([]);
    }
  }, [property, mode, form, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Process all files in parallel
    const filePromises = filesArray.map(async (file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: `${file.name}: Solo se permiten imágenes`,
          variant: "destructive",
        });
        return null;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `${file.name} supera el límite de 10MB`,
          variant: "destructive",
        });
        return null;
      }

      // Convert to base64 (create new FileReader for each file)
      return new Promise<{ name: string; data: string } | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ name: file.name, data: reader.result as string });
        };
        reader.onerror = () => {
          toast({
            title: "Error",
            description: `Error al leer ${file.name}`,
            variant: "destructive",
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(filePromises);
    const validFiles = results.filter((f): f is { name: string; data: string } => f !== null);

    if (validFiles.length > 0) {
      const updatedFiles = [...imageFiles, ...validFiles];
      setImageFiles(updatedFiles);
      form.setValue("images", updatedFiles.map(f => f.data));
    }

    // Reset input
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    form.setValue("images", updatedFiles.map(f => f.data));
  };

  const onSubmit = async (data: InsertProperty) => {
    try {
      if (mode === "edit" && property) {
        await updateMutation.mutateAsync({ id: property.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setImageFiles([]);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-property-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Agregar Propiedad" : "Editar Propiedad"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Complete los detalles de la nueva propiedad"
              : "Actualice los detalles de la propiedad"}
          </DialogDescription>
        </DialogHeader>

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
                      placeholder="Casa moderna en zona residencial"
                      data-testid="input-title"
                      {...field}
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
                      placeholder="Descripción detallada de la propiedad..."
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="15000"
                        data-testid="input-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recámaras</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        data-testid="input-bedrooms"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        type="text"
                        placeholder="1.5"
                        data-testid="input-bathrooms"
                        {...field}
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
                        type="text"
                        placeholder="120"
                        data-testid="input-area"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Col. Centro, Ciudad de México"
                      data-testid="input-location"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rent">En Renta</SelectItem>
                      <SelectItem value="sale">En Venta</SelectItem>
                      <SelectItem value="both">Renta y Venta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenidades (separadas por comas)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Estacionamiento, Gimnasio, Alberca"
                      data-testid="input-amenities"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const amenities = e.target.value
                          .split(",")
                          .map((a) => a.trim())
                          .filter((a) => a.length > 0);
                        field.onChange(amenities);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Imágenes</FormLabel>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  data-testid="input-images"
                />
                <Upload className="h-5 w-5 text-secondary-foreground" />
              </div>
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={file.data}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Propietario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ID del usuario propietario"
                      data-testid="input-owner-id"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />
            
            <div className="space-y-4">
              <FormLabel className="text-base">Información de Acceso</FormLabel>
              
              <FormField
                control={form.control}
                name="accessInfo.lockboxCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Caja Fuerte</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234"
                        data-testid="input-lockbox-code"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessInfo.contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la persona que dará acceso"
                        data-testid="input-contact-person"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessInfo.contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+52 55 1234 5678"
                        data-testid="input-contact-phone"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear Propiedad" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
