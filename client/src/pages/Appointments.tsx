import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight, X, Video } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type Appointment } from "@shared/schema";

interface AppointmentWithDetails extends Appointment {
  property?: {
    id: string;
    title: string;
    condoName?: string | null;
    unitNumber?: string | null;
  };
  client?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: allAppointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const updateAppointment = useUpdateAppointment();

  // Calculate date range for calendar
  const dateRange = useMemo(() => {
    if (viewMode === "calendar") {
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

  // Days to display in calendar
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Filter appointments for current user (cliente role)
  const myAppointments = useMemo(() => {
    if (user?.role === "cliente") {
      return allAppointments.filter(apt => apt.clientId === user.id);
    }
    return allAppointments;
  }, [allAppointments, user]);

  // Filter by status
  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return myAppointments;
    return myAppointments.filter(apt => apt.status === statusFilter);
  }, [myAppointments, statusFilter]);

  // Group appointments by day for calendar view
  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, AppointmentWithDetails[]>();
    filteredAppointments.forEach(apt => {
      const dayKey = format(new Date(apt.date), "yyyy-MM-dd");
      const existing = grouped.get(dayKey) || [];
      grouped.set(dayKey, [...existing, apt]);
    });
    return grouped;
  }, [filteredAppointments]);

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled" },
      });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada exitosamente",
      });
      setSelectedAppointment(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      });
    }
  };

  const getPropertyDisplay = (property?: AppointmentWithDetails["property"]) => {
    if (!property) return "Propiedad";
    if (property.condoName && property.unitNumber) {
      return `${property.condoName} - Unidad ${property.unitNumber}`;
    }
    if (property.condoName) return property.condoName;
    return property.title || "Propiedad";
  };

  const pendingCount = myAppointments.filter(a => a.status === "pending").length;
  const confirmedCount = myAppointments.filter(a => a.status === "confirmed").length;
  const completedCount = myAppointments.filter(a => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Citas</h1>
          <p className="text-muted-foreground">Gestiona tus visitas programadas</p>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-appointments">
            Todas ({myAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed">
            Confirmadas ({confirmedCount})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                data-testid="button-view-calendar"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendario
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                Lista
              </Button>
            </div>

            {/* Month/Week Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(currentDate.getDate() - (viewMode === "calendar" ? 7 : 30));
                  setCurrentDate(newDate);
                }}
                data-testid="button-prev-period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentDate, viewMode === "calendar" ? "'Semana del' d MMM" : "MMMM yyyy", { locale: es })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(currentDate.getDate() + (viewMode === "calendar" ? 7 : 30));
                  setCurrentDate(newDate);
                }}
                data-testid="button-next-period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                data-testid="button-today"
              >
                Hoy
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : viewMode === "calendar" ? (
            /* Calendar View */
            <div className="space-y-4">
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-2">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayAppointments = appointmentsByDay.get(dayKey) || [];
                  const isToday = isSameDay(day, new Date());

                  return (
                    <Card
                      key={dayKey}
                      className={cn(
                        "min-h-[120px] transition-colors",
                        isToday && "ring-2 ring-primary",
                        dayAppointments.length > 0 && "hover-elevate cursor-pointer"
                      )}
                      data-testid={`calendar-day-${dayKey}`}
                    >
                      <CardHeader className="p-2">
                        <div className={cn(
                          "text-sm font-medium",
                          isToday ? "text-primary" : "text-muted-foreground"
                        )}>
                          {format(day, "d")}
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 pt-0 space-y-1">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            className={cn(
                              "text-xs p-1 rounded truncate cursor-pointer",
                              apt.status === "pending" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
                              apt.status === "confirmed" && "bg-green-500/10 text-green-700 dark:text-green-300",
                              apt.status === "completed" && "bg-blue-500/10 text-blue-700 dark:text-blue-300",
                              apt.status === "cancelled" && "bg-red-500/10 text-red-700 dark:text-red-300"
                            )}
                            data-testid={`appointment-preview-${apt.id}`}
                          >
                            {format(new Date(apt.date), "HH:mm")} {getPropertyDisplay(apt.property)}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayAppointments.length - 3} más
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => (
                  <Card 
                    key={apt.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedAppointment(apt)}
                    data-testid={`appointment-card-${apt.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{getPropertyDisplay(apt.property)}</CardTitle>
                          <CardDescription className="mt-1">
                            {format(new Date(apt.date), "PPPP 'a las' HH:mm", { locale: es })}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            apt.status === "pending" ? "outline" :
                            apt.status === "confirmed" ? "default" :
                            apt.status === "completed" ? "secondary" :
                            "destructive"
                          }
                        >
                          {apt.status === "pending" ? "Pendiente" :
                           apt.status === "confirmed" ? "Confirmada" :
                           apt.status === "completed" ? "Completada" :
                           "Cancelada"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {apt.type === "video" ? (
                            <><Video className="h-4 w-4" /> Videollamada</>
                          ) : (
                            <><MapPin className="h-4 w-4" /> Presencial</>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="no-appointments">
                  No hay citas {statusFilter !== "all" ? statusFilter : ""} en este momento
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="dialog-appointment-details">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>Detalles de la Cita</CardTitle>
                  <CardDescription>Información completa de tu visita</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedAppointment(null)}
                  data-testid="button-close-dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Propiedad</div>
                  <div className="font-medium mt-1">{getPropertyDisplay(selectedAppointment.property)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Fecha</div>
                    <div className="font-medium mt-1">
                      {format(new Date(selectedAppointment.date), "PPP", { locale: es })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hora</div>
                    <div className="font-medium mt-1">
                      {format(new Date(selectedAppointment.date), "HH:mm")}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Tipo de visita</div>
                  <div className="font-medium mt-1 flex items-center gap-2">
                    {selectedAppointment.type === "video" ? (
                      <><Video className="h-4 w-4" /> Videollamada</>
                    ) : (
                      <><MapPin className="h-4 w-4" /> Presencial</>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Estado</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedAppointment.status === "pending" ? "outline" :
                        selectedAppointment.status === "confirmed" ? "default" :
                        selectedAppointment.status === "completed" ? "secondary" :
                        "destructive"
                      }
                    >
                      {selectedAppointment.status === "pending" ? "Pendiente de aprobación" :
                       selectedAppointment.status === "confirmed" ? "Confirmada" :
                       selectedAppointment.status === "completed" ? "Completada" :
                       "Cancelada"}
                    </Badge>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <div className="text-sm text-muted-foreground">Notas</div>
                    <div className="mt-1 text-sm">{selectedAppointment.notes}</div>
                  </div>
                )}

                {selectedAppointment.type === "video" && selectedAppointment.meetLink && selectedAppointment.status === "confirmed" && (
                  <div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(selectedAppointment.meetLink || "", "_blank")}
                      data-testid="button-join-meet"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Unirse a Videollamada
                    </Button>
                  </div>
                )}
              </div>

              {selectedAppointment.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleCancel(selectedAppointment.id)}
                    disabled={updateAppointment.isPending}
                    data-testid="button-cancel-appointment"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {updateAppointment.isPending ? "Cancelando..." : "Cancelar Cita"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
