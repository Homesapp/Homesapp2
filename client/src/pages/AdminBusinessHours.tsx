import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BusinessHours } from "@shared/schema";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export default function AdminBusinessHours() {
  const { toast } = useToast();
  const [editingDays, setEditingDays] = useState<Record<number, BusinessHours>>({});

  const { data: businessHours = [], isLoading } = useQuery<BusinessHours[]>({
    queryKey: ["/api/business-hours"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ dayOfWeek, data }: { dayOfWeek: number; data: any }) => {
      return await apiRequest(`/api/business-hours/${dayOfWeek}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-hours"] });
      toast({
        title: "Horario actualizado",
        description: "Los horarios de atención han sido actualizados exitosamente",
      });
      setEditingDays({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el horario",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (hours: BusinessHours) => {
    setEditingDays(prev => ({ ...prev, [hours.dayOfWeek]: { ...hours } }));
  };

  const handleCancel = (dayOfWeek: number) => {
    setEditingDays(prev => {
      const newState = { ...prev };
      delete newState[dayOfWeek];
      return newState;
    });
  };

  const handleSave = (dayOfWeek: number) => {
    const editedData = editingDays[dayOfWeek];
    if (!editedData) return;

    updateMutation.mutate({
      dayOfWeek,
      data: {
        isOpen: editedData.isOpen,
        openTime: editedData.openTime,
        closeTime: editedData.closeTime,
      },
    });
  };

  const handleFieldChange = (dayOfWeek: number, field: string, value: any) => {
    setEditingDays(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando horarios...</div>
        </div>
      </div>
    );
  }

  // Create a map for quick lookup
  const hoursMap = businessHours.reduce((acc, h) => {
    acc[h.dayOfWeek] = h;
    return acc;
  }, {} as Record<number, BusinessHours>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-business-hours">
          Horarios de Atención
        </h1>
        <p className="text-muted-foreground">
          Configura los horarios de atención para las citas
        </p>
      </div>

      <Card data-testid="card-business-hours">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Configuración de Horarios</CardTitle>
          </div>
          <CardDescription>
            Define los días y horarios en que se pueden agendar citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map(day => {
            const hours = hoursMap[day.value];
            const editing = editingDays[day.value];
            const currentData = editing || hours;

            if (!currentData) return null;

            return (
              <Card key={day.value} data-testid={`card-day-${day.value}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 min-w-[140px]">
                      <Switch
                        checked={currentData.isOpen}
                        onCheckedChange={(checked) => {
                          if (editing) {
                            handleFieldChange(day.value, "isOpen", checked);
                          } else {
                            handleEdit(currentData);
                            setTimeout(() => {
                              handleFieldChange(day.value, "isOpen", checked);
                            }, 0);
                          }
                        }}
                        data-testid={`switch-day-${day.value}`}
                      />
                      <Label className="font-medium">{day.label}</Label>
                    </div>

                    {currentData.isOpen && (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">Abre:</Label>
                          <Input
                            type="time"
                            value={currentData.openTime}
                            onChange={(e) => {
                              if (!editing) {
                                handleEdit(currentData);
                              }
                              handleFieldChange(day.value, "openTime", e.target.value);
                            }}
                            className="w-32"
                            data-testid={`input-open-${day.value}`}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">Cierra:</Label>
                          <Input
                            type="time"
                            value={currentData.closeTime}
                            onChange={(e) => {
                              if (!editing) {
                                handleEdit(currentData);
                              }
                              handleFieldChange(day.value, "closeTime", e.target.value);
                            }}
                            className="w-32"
                            data-testid={`input-close-${day.value}`}
                          />
                        </div>
                      </div>
                    )}

                    {editing && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          size="sm"
                          onClick={() => handleSave(day.value)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-save-${day.value}`}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(day.value)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-cancel-${day.value}`}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
