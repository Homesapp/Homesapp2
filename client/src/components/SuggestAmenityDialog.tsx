import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SuggestAmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestAmenityDialog({ open, onOpenChange }: SuggestAmenityDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"property" | "condo">("property");

  const suggestMutation = useMutation({
    mutationFn: async (data: { name: string; category: string }) => {
      return await apiRequest("POST", "/api/amenities", data);
    },
    onSuccess: () => {
      setName("");
      setCategory("property");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities/approved"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      suggestMutation.mutate({ name: name.trim(), category });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-suggest-amenity">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            Sugerir Nueva Amenidad
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Proporciona el nombre y categoría de la amenidad. Será revisada y aprobada por un administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amenity-name" data-testid="label-amenity-name">
                Nombre de la Amenidad
              </Label>
              <Input
                id="amenity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Jacuzzi"
                data-testid="input-amenity-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenity-category" data-testid="label-amenity-category">
                Categoría
              </Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as "property" | "condo")}
              >
                <SelectTrigger id="amenity-category" data-testid="select-amenity-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property" data-testid="option-category-property">
                    Característica de la Propiedad
                  </SelectItem>
                  <SelectItem value="condo" data-testid="option-category-condo">
                    Amenidad del Condominio
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={suggestMutation.isPending || !name.trim()}
              data-testid="button-submit-amenity"
            >
              {suggestMutation.isPending ? "Enviando..." : "Enviar Sugerencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
