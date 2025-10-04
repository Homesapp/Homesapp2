import { useState, useMemo } from "react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { AppointmentFormDialog } from "@/components/AppointmentFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useProperties } from "@/hooks/useProperties";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default function Appointments() {
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const filters = activeTab === "all" ? {} : { status: activeTab };
  const { data: appointments, isLoading, error } = useAppointments(filters);
  const { data: properties } = useProperties();
  const updateAppointment = useUpdateAppointment();

  const appointmentsWithDetails = useMemo(() => {
    if (!appointments || !properties) return [];
    
    return appointments.map(appointment => {
      const property = properties.find(p => p.id === appointment.propertyId);
      
      return {
        id: appointment.id,
        propertyTitle: property?.title || "Propiedad",
        clientName: "Cliente",
        date: format(new Date(appointment.date), "dd MMM yyyy"),
        time: format(new Date(appointment.date), "h:mm a"),
        type: appointment.type,
        status: appointment.status,
        meetLink: appointment.meetLink || undefined,
      };
    });
  }, [appointments, properties]);

  const handleConfirm = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "confirmed" },
      });
      toast({
        title: "Cita confirmada",
        description: "La cita ha sido confirmada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled" },
      });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      });
    }
  };

  const allAppointments = appointments || [];
  const pendingCount = allAppointments.filter(a => a.status === "pending").length;
  const confirmedCount = allAppointments.filter(a => a.status === "confirmed").length;
  const completedCount = allAppointments.filter(a => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Citas</h1>
          <p className="text-muted-foreground">Gestiona todas tus citas y visitas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {error && (
        <div className="text-center py-8 text-destructive" data-testid="error-message">
          Error al cargar las citas. Por favor, intenta de nuevo.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-appointments">
            Todas ({allAppointments.length})
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

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : appointmentsWithDetails.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appointmentsWithDetails.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  {...appointment}
                  onConfirm={() => handleConfirm(appointment.id)}
                  onCancel={() => handleCancel(appointment.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-appointments">
              No hay citas {activeTab !== "all" ? activeTab : ""} en este momento
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
      />
    </div>
  );
}
