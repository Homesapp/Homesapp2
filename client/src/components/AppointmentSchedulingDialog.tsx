import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Property, type BusinessHours, type PresentationCard } from "@shared/schema";
import { Calendar, Clock, MapPin, Plus, X } from "lucide-react";
import { format, addDays, startOfDay, isBefore, isAfter, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  propertyId: z.string().min(1, "Propiedad es requerida"),
  date: z.date({ required_error: "Fecha es requerida" }),
  timeSlot: z.string().min(1, "Horario es requerido"),
  appointmentMode: z.enum(["individual", "tour"]),
  presentationCardId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AppointmentSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
}

export function AppointmentSchedulingDialog({
  open,
  onOpenChange,
  property,
}: AppointmentSchedulingDialogProps) {
  const { toast } = useToast();
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([property]);
  const [showPropertySearch, setShowPropertySearch] = useState(false);

  // Fetch business hours
  const { data: businessHours } = useQuery<BusinessHours[]>({
    queryKey: ["/api/business-hours"],
    enabled: open,
  });

  // Fetch presentation cards
  const { data: presentationCards } = useQuery<PresentationCard[]>({
    queryKey: ["/api/presentation-cards"],
    enabled: open,
  });

  // Fetch available properties for tour (approved/published properties)
  const { data: availableProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties", { status: "approved" }],
    enabled: open && showPropertySearch,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: property.id,
      appointmentMode: "individual",
      notes: "",
    },
  });

  const watchDate = form.watch("date");
  const watchMode = form.watch("appointmentMode");

  // Generate available time slots based on business hours
  const getAvailableTimeSlots = (selectedDate: Date) => {
    if (!selectedDate || !businessHours) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayConfig = businessHours.find(h => h.dayOfWeek === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) return [];

    const slots: string[] = [];
    const [openHour, openMinute] = dayConfig.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayConfig.closeTime.split(':').map(Number);

    let currentTime = setMinutes(setHours(selectedDate, openHour), openMinute);
    const endTime = setMinutes(setHours(selectedDate, closeHour), closeMinute);

    while (isBefore(currentTime, endTime)) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1);
      
      // Only add slot if the end time doesn't exceed business hours close time
      if (isAfter(nextHour, endTime)) {
        break;
      }
      
      const slotStart = format(currentTime, 'HH:mm');
      const slotEnd = format(nextHour, 'HH:mm');
      slots.push(`${slotStart} - ${slotEnd}`);
      currentTime = nextHour;
    }

    return slots;
  };

  const timeSlots = watchDate ? getAvailableTimeSlots(watchDate) : [];

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const [startTime, endTime] = data.timeSlot.split(' - ');
      
      // For tour mode, create multiple appointments with same tourGroupId
      // Each property gets 30 minutes, staggered sequentially
      if (data.appointmentMode === "tour" && selectedProperties.length > 1) {
        // Validate tour fits within time slot
        const tourDurationMinutes = selectedProperties.length * 30;
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const slotStart = new Date(data.date);
        slotStart.setHours(startHour, startMinute, 0, 0);
        
        const slotEnd = new Date(data.date);
        slotEnd.setHours(endHour, endMinute, 0, 0);
        
        const tourEnd = new Date(slotStart);
        tourEnd.setMinutes(slotStart.getMinutes() + tourDurationMinutes);
        
        // Check if tour exceeds slot end time
        if (isAfter(tourEnd, slotEnd)) {
          throw new Error(`El tour requiere ${tourDurationMinutes} minutos pero el slot solo tiene ${(slotEnd.getTime() - slotStart.getTime()) / 60000} minutos disponibles. Por favor selecciona un horario más temprano.`);
        }
        
        const tourGroupId = crypto.randomUUID();
        
        const tourAppointments = selectedProperties.map((prop, index) => {
          // Each property gets 30 minutes, starting from base time + (index * 30 minutes)
          const appointmentTime = new Date(slotStart);
          appointmentTime.setMinutes(slotStart.getMinutes() + (index * 30));
          
          return {
            propertyId: prop.id,
            date: data.date,
            time: format(appointmentTime, 'HH:mm'),
            appointmentMode: "tour" as const,
            appointmentType: "in-person" as const,
            presentationCardId: data.presentationCardId || null,
            notes: data.notes || "",
            tourGroupId,
          };
        });
        
        // Create all appointments for the tour
        const results = await Promise.all(
          tourAppointments.map(apt => apiRequest("POST", "/api/appointments", apt))
        );
        return results;
      } else {
        // Single appointment
        const appointmentData = {
          propertyId: data.propertyId,
          date: data.date,
          time: startTime,
          appointmentMode: data.appointmentMode,
          appointmentType: "in-person" as const,
          presentationCardId: data.presentationCardId || null,
          notes: data.notes || "",
        };
        return await apiRequest("POST", "/api/appointments", appointmentData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "¡Cita coordinada!",
        description: "Tu cita ha sido agendada exitosamente.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedProperties([property]);
    },
    onError: (error: any) => {
      toast({
        title: "Error al agendar cita",
        description: error.message || "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createAppointmentMutation.mutate(data);
  };

  const addPropertyToTour = (prop: Property) => {
    if (!selectedProperties.find(p => p.id === prop.id)) {
      setSelectedProperties([...selectedProperties, prop]);
    }
  };

  const removePropertyFromTour = (propId: string) => {
    if (selectedProperties.length > 1) {
      setSelectedProperties(selectedProperties.filter(p => p.id !== propId));
    }
  };

  // Get days that are open based on business hours
  const getDisabledDays = () => {
    if (!businessHours) return [];
    
    const closedDays = businessHours
      .filter(h => !h.isOpen)
      .map(h => h.dayOfWeek);
    
    return (date: Date) => {
      return closedDays.includes(date.getDay());
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-appointment-scheduling">
        <DialogHeader>
          <DialogTitle>Coordinar cita</DialogTitle>
          <DialogDescription>
            Agenda una cita para visitar la propiedad
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              {/* Appointment Mode */}
              <FormField
                control={form.control}
                name="appointmentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de visita</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="individual"
                            id="individual"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="individual"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-individual"
                          >
                            <Calendar className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Visita Individual</div>
                              <div className="text-sm text-muted-foreground">Una propiedad</div>
                            </div>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="tour"
                            id="tour"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="tour"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-tour"
                          >
                            <MapPin className="mb-3 h-6 w-6" />
                            <div className="text-center">
                              <div className="font-semibold">Tour de Propiedades</div>
                              <div className="text-sm text-muted-foreground">Varias propiedades</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tour Properties Selection */}
              {watchMode === "tour" && (
                <div className="space-y-3">
                  <Label>Propiedades seleccionadas ({selectedProperties.length})</Label>
                  <div className="space-y-2">
                    {selectedProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        data-testid={`tour-property-${prop.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{prop.title}</div>
                          <div className="text-sm text-muted-foreground">{prop.location}</div>
                        </div>
                        {selectedProperties.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePropertyFromTour(prop.id)}
                            data-testid={`button-remove-property-${prop.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPropertySearch(!showPropertySearch)}
                    data-testid="button-add-property-tour"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar propiedad al tour
                  </Button>
                </div>
              )}

              {/* Presentation Card Selection */}
              {presentationCards && presentationCards.length > 0 && (
                <FormField
                  control={form.control}
                  name="presentationCardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarjeta de presentación (opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-presentation-card">
                            <SelectValue placeholder="Selecciona una tarjeta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin tarjeta</SelectItem>
                          {presentationCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name || `${card.propertyType} - ${card.location}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date Selection */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-select-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={getDisabledDays()}
                          initialFocus
                          fromDate={startOfDay(new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Slot Selection */}
              {watchDate && (
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario disponible</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-time-slot">
                            <SelectValue placeholder="Selecciona un horario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No hay horarios disponibles
                            </SelectItem>
                          ) : (
                            timeSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {slot}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Agrega cualquier información adicional..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-appointment"
                >
                  {createAppointmentMutation.isPending ? "Agendando..." : "Confirmar cita"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>

      {/* Property Search Dialog */}
      <Dialog open={showPropertySearch} onOpenChange={setShowPropertySearch}>
        <DialogContent className="max-w-2xl" data-testid="dialog-add-property">
          <DialogHeader>
            <DialogTitle>Agregar propiedad al tour</DialogTitle>
            <DialogDescription>
              Selecciona propiedades adicionales para incluir en el tour
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableProperties && availableProperties.length > 0 ? (
              availableProperties
                .filter(prop => !selectedProperties.find(p => p.id === prop.id))
                .map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate cursor-pointer"
                    onClick={() => {
                      addPropertyToTour(prop);
                      setShowPropertySearch(false);
                    }}
                    data-testid={`available-property-${prop.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{prop.title}</div>
                      <div className="text-sm text-muted-foreground">{prop.location}</div>
                      <div className="text-sm font-semibold text-primary mt-1">
                        ${prop.pricePerMonth?.toLocaleString()}/mes
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      data-testid={`button-select-property-${prop.id}`}
                    >
                      Seleccionar
                    </Button>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay propiedades disponibles
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
