import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema, type InsertBudget, type Budget } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { useCreateBudget, useUpdateBudget } from "@/hooks/useBudgets";
import { useProperties } from "@/hooks/useProperties";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  mode: "create" | "edit";
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  mode,
}: BudgetFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const { data: properties } = useProperties({ active: true });
  const [attachmentFiles, setAttachmentFiles] = useState<{ name: string; data: string }[]>([]);

  const form = useForm<InsertBudget>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      propertyId: "",
      staffId: "",
      title: "",
      description: "",
      estimatedCost: "0",
      currency: "MXN",
      attachments: [],
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    
    if (budget && mode === "edit") {
      form.reset({
        propertyId: budget.propertyId,
        staffId: budget.staffId,
        title: budget.title,
        description: budget.description,
        estimatedCost: budget.estimatedCost,
        currency: budget.currency,
        attachments: budget.attachments || [],
        notes: budget.notes || "",
      });
      // Load existing attachments as files for display
      const files = (budget.attachments || []).map((data, index) => ({
        name: `Archivo ${index + 1}`,
        data,
      }));
      setAttachmentFiles(files);
    } else if (mode === "create") {
      form.reset({
        propertyId: "",
        staffId: "",
        title: "",
        description: "",
        estimatedCost: "0",
        currency: "MXN",
        attachments: [],
        notes: "",
      });
      setAttachmentFiles([]);
    }
  }, [budget, mode, form, open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Process all files in parallel
    const filePromises = filesArray.map(async (file) => {
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/', 'application/pdf'];
      const isValid = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValid) {
        toast({
          title: "Error",
          description: `${file.name}: Solo se permiten imágenes y PDFs`,
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
      const updatedFiles = [...attachmentFiles, ...validFiles];
      setAttachmentFiles(updatedFiles);
      form.setValue("attachments", updatedFiles.map(f => f.data));
    }

    // Reset input
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    const updatedFiles = attachmentFiles.filter((_, i) => i !== index);
    setAttachmentFiles(updatedFiles);
    form.setValue("attachments", updatedFiles.map(f => f.data));
  };

  const onSubmit = async (data: InsertBudget) => {
    try {
      if (mode === "edit" && budget) {
        await updateMutation.mutateAsync({ id: budget.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setAttachmentFiles([]);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-budget-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Crear Presupuesto" : "Editar Presupuesto"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Complete los detalles del nuevo presupuesto"
              : "Actualice los detalles del presupuesto"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property">
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Reparación de plomería"
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
                      placeholder="Descripción detallada del trabajo a realizar..."
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
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Estimado</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="5000"
                        data-testid="input-estimated-cost"
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

            <div className="space-y-2">
              <FormLabel>Adjuntos (Imágenes o PDFs)</FormLabel>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  data-testid="input-attachments"
                />
                <Upload className="h-5 w-5 text-secondary-foreground" />
              </div>
              {attachmentFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachmentFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-secondary-foreground" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        data-testid={`button-remove-attachment-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales..."
                      data-testid="input-notes"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAttachmentFiles([]);
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear Presupuesto" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
