import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay
} from "date-fns";
import { es } from "date-fns/locale";
import type { Appointment, User as UserType, Property, PresentationCard, CalendarEvent } from "@shared/schema";

type AppointmentWithRelations = Appointment & {
  property?: Property;
  client?: UserType;
  concierge?: UserType;
  presentationCard?: PresentationCard;
};

type CalendarEventWithRelations = CalendarEvent & {
  property?: Property;
  assignedTo?: UserType;
  client?: UserType;
};

type AllEvents = (AppointmentWithRelations | CalendarEventWithRelations) & {
  isAppointment?: boolean;
};

const EVENT_TYPE_COLORS = {
  appointment: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-700 dark:text-blue-400" },
  maintenance: { bg: "bg-orange-500/10", border: "border-orange-500", text: "text-orange-700 dark:text-orange-400" },
  cleaning: { bg: "bg-green-500/10", border: "border-green-500", text: "text-green-700 dark:text-green-400" },
  inspection: { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-700 dark:text-purple-400" },
  administrative: { bg: "bg-gray-500/10", border: "border-gray-500", text: "text-gray-700 dark:text-gray-400" },
  meeting: { bg: "bg-pink-500/10", border: "border-pink-500", text: "text-pink-700 dark:text-pink-400" },
};

const EVENT_TYPE_LABELS = {
  appointment: "Cita",
  maintenance: "Mantenimiento",
  cleaning: "Limpieza",
  inspection: "Inspección",
  administrative: "Administrativo",
  meeting: "Reunión",
};

export default function AdminCalendar() {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AllEvents | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Filters
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    "appointment",
    "maintenance",
    "cleaning",
    "inspection",
    "administrative",
    "meeting"
  ]);
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch calendar events
  const { data: calendarEvents = [], isLoading: loadingEvents } = useQuery<CalendarEventWithRelations[]>({
    queryKey: ["/api/calendar-events"],
  });

  // Fetch users for role filtering
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = loadingAppointments || loadingEvents;

  // Calculate date range
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  // Combine and filter events
  const allEvents: AllEvents[] = useMemo(() => {
    const appointmentEvents: AllEvents[] = appointments
      .filter(apt => selectedEventTypes.includes("appointment"))
      .map(apt => ({
        ...apt,
        isAppointment: true,
        eventType: "appointment" as const,
        startDate: apt.date,
        endDate: new Date(new Date(apt.date).getTime() + 60 * 60 * 1000), // 1 hour
      }));

    const otherEvents: AllEvents[] = calendarEvents
      .filter(evt => selectedEventTypes.includes(evt.eventType))
      .map(evt => ({
        ...evt,
        isAppointment: false,
      }));

    let combined = [...appointmentEvents, ...otherEvents];

    // Filter by role
    if (selectedRole !== "all") {
      combined = combined.filter(evt => {
        if (evt.isAppointment) {
          const apt = evt as AppointmentWithRelations;
          return apt.concierge?.role === selectedRole;
        } else {
          const calEvt = evt as CalendarEventWithRelations;
          return calEvt.assignedTo?.role === selectedRole;
        }
      });
    }

    // Filter by date range
    combined = combined.filter(evt => {
      const eventStart = new Date(evt.startDate);
      const eventEnd = new Date(evt.endDate);
      return (
        isWithinInterval(eventStart, { start: dateRange.start, end: dateRange.end }) ||
        isWithinInterval(eventEnd, { start: dateRange.start, end: dateRange.end }) ||
        (eventStart <= dateRange.start && eventEnd >= dateRange.end)
      );
    });

    return combined.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [appointments, calendarEvents, selectedEventTypes, selectedRole, dateRange]);

  // Days to display
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleEventType = (eventType: string) => {
    if (selectedEventTypes.includes(eventType)) {
      setSelectedEventTypes(selectedEventTypes.filter(t => t !== eventType));
    } else {
      setSelectedEventTypes([...selectedEventTypes, eventType]);
    }
  };

  const getEventsForDay = (day: Date) => {
    return allEvents.filter(evt => {
      const eventStart = new Date(evt.startDate);
      const eventEnd = new Date(evt.endDate);
      return isWithinInterval(day, { start: startOfDay(eventStart), end: endOfDay(eventEnd) });
    });
  };

  if (isLoading) {
    return <LoadingScreen className="h-full" />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-admin-calendar-title">
            <CalendarIcon className="h-8 w-8" />
            Calendario Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de citas, mantenimiento, limpieza y eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            data-testid="button-open-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                data-testid="button-previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleToday}
                data-testid="button-today"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                data-testid="button-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4">
                {viewMode === "week"
                  ? `Semana del ${format(dateRange.start, "d MMM", { locale: es })} - ${format(dateRange.end, "d MMM yyyy", { locale: es })}`
                  : format(currentDate, "MMMM yyyy", { locale: es })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                data-testid="button-week-view"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                data-testid="button-month-view"
              >
                Mes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {days.slice(0, 7).map((day, index) => (
                <div key={index} className="p-2 text-center font-medium text-sm border-r last:border-r-0">
                  {format(day, "EEE", { locale: es })}
                </div>
              ))}
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={index}
                    className={`min-h-32 p-2 border-r border-b last:border-r-0 ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((evt, evtIndex) => {
                        const eventType = evt.eventType;
                        const colors = EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.administrative;
                        
                        return (
                          <div
                            key={evtIndex}
                            className={`text-xs p-1 rounded border-l-2 ${colors.bg} ${colors.border} ${colors.text} cursor-pointer hover-elevate`}
                            onClick={() => setSelectedEvent(evt)}
                            data-testid={`event-${evt.id}`}
                          >
                            <div className="font-medium truncate">
                              {format(new Date(evt.startDate), "HH:mm")} - {evt.isAppointment ? (evt as AppointmentWithRelations).property?.title : (evt as CalendarEventWithRelations).title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent data-testid="dialog-filters">
          <DialogHeader>
            <DialogTitle>Filtros de Calendario</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Tipos de Eventos</h3>
              <div className="space-y-2">
                {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${type}`}
                      checked={selectedEventTypes.includes(type)}
                      onCheckedChange={() => toggleEventType(type)}
                      data-testid={`checkbox-${type}`}
                    />
                    <label htmlFor={`filter-${type}`} className="text-sm cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Filtrar por Rol</h3>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="concierge">Conserjería</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-event-details">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent.isAppointment ? "Detalles de la Cita" : "Detalles del Evento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="text-base">
                    <Badge className={EVENT_TYPE_COLORS[selectedEvent.eventType]?.bg || ""}>
                      {EVENT_TYPE_LABELS[selectedEvent.eventType]}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha y Hora</label>
                  <p className="text-base">
                    {format(new Date(selectedEvent.startDate), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {selectedEvent.isAppointment ? (
                <>
                  {/* Appointment Details */}
                  {(selectedEvent as AppointmentWithRelations).property && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Propiedad</label>
                      <p className="text-base">{(selectedEvent as AppointmentWithRelations).property?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedEvent as AppointmentWithRelations).property?.location}
                      </p>
                    </div>
                  )}

                  {(selectedEvent as AppointmentWithRelations).client && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-medium">Información del Cliente</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                          <p className="text-base">
                            {(selectedEvent as AppointmentWithRelations).client?.firstName}{" "}
                            {(selectedEvent as AppointmentWithRelations).client?.lastName}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-base">{(selectedEvent as AppointmentWithRelations).client?.email}</p>
                        </div>
                      </div>
                      
                      {(selectedEvent as AppointmentWithRelations).client?.phone && (
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Teléfono
                            </label>
                            <p className="text-base">{(selectedEvent as AppointmentWithRelations).client?.phone}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://wa.me/${(selectedEvent as AppointmentWithRelations).client?.phone?.replace(/\D/g, '')}`, '_blank')}
                            data-testid="button-whatsapp"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      )}

                      {(selectedEvent as AppointmentWithRelations).presentationCard && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Tarjeta de Presentación
                          </label>
                          <p className="text-sm">
                            {(selectedEvent as AppointmentWithRelations).presentationCard?.propertyType} - 
                            {(selectedEvent as AppointmentWithRelations).presentationCard?.modality}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedEvent as AppointmentWithRelations).concierge && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Conserje Asignado</label>
                      <p className="text-base">
                        {(selectedEvent as AppointmentWithRelations).concierge?.firstName}{" "}
                        {(selectedEvent as AppointmentWithRelations).concierge?.lastName}
                      </p>
                    </div>
                  )}

                  {(selectedEvent as AppointmentWithRelations).notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notas</label>
                      <p className="text-base">{(selectedEvent as AppointmentWithRelations).notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Calendar Event Details */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Título</label>
                    <p className="text-base">{(selectedEvent as CalendarEventWithRelations).title}</p>
                  </div>

                  {(selectedEvent as CalendarEventWithRelations).description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                      <p className="text-base">{(selectedEvent as CalendarEventWithRelations).description}</p>
                    </div>
                  )}

                  {(selectedEvent as CalendarEventWithRelations).property && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Propiedad</label>
                      <p className="text-base">{(selectedEvent as CalendarEventWithRelations).property?.title}</p>
                    </div>
                  )}

                  {(selectedEvent as CalendarEventWithRelations).assignedTo && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
                      <p className="text-base">
                        {(selectedEvent as CalendarEventWithRelations).assignedTo?.firstName}{" "}
                        {(selectedEvent as CalendarEventWithRelations).assignedTo?.lastName}
                      </p>
                    </div>
                  )}

                  {(selectedEvent as CalendarEventWithRelations).notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notas</label>
                      <p className="text-base">{(selectedEvent as CalendarEventWithRelations).notes}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                  data-testid="button-close-details"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
