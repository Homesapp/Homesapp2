import { useState } from "react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function Appointments() {
  const [activeTab, setActiveTab] = useState("all");

  const appointments = [
    {
      id: "1",
      propertyTitle: "Casa Moderna en Polanco",
      clientName: "María González",
      date: "15 Oct 2025",
      time: "10:00 AM",
      type: "video" as const,
      status: "pending" as const,
      meetLink: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: "2",
      propertyTitle: "Departamento en Santa Fe",
      clientName: "Carlos Rodríguez",
      date: "16 Oct 2025",
      time: "3:00 PM",
      type: "in-person" as const,
      status: "confirmed" as const,
    },
    {
      id: "3",
      propertyTitle: "Penthouse Vista Panorámica",
      clientName: "Ana López",
      date: "17 Oct 2025",
      time: "11:30 AM",
      type: "video" as const,
      status: "confirmed" as const,
      meetLink: "https://meet.google.com/xyz-abcd-efg",
    },
    {
      id: "4",
      propertyTitle: "Casa Residencial Jardín",
      clientName: "Roberto Sánchez",
      date: "12 Oct 2025",
      time: "2:00 PM",
      type: "in-person" as const,
      status: "completed" as const,
    },
    {
      id: "5",
      propertyTitle: "Loft Moderno Centro",
      clientName: "Diana Morales",
      date: "18 Oct 2025",
      time: "4:00 PM",
      type: "video" as const,
      status: "pending" as const,
      meetLink: "https://meet.google.com/lmn-opqr-stu",
    },
  ];

  const filterAppointments = (status: string) => {
    if (status === "all") return appointments;
    return appointments.filter((apt) => apt.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Citas</h1>
          <p className="text-muted-foreground">Gestiona todas tus citas y visitas</p>
        </div>
        <Button data-testid="button-new-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-appointments">
            Todas ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({appointments.filter(a => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" data-testid="tab-confirmed">
            Confirmadas ({appointments.filter(a => a.status === "confirmed").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({appointments.filter(a => a.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterAppointments(activeTab).map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                {...appointment}
                onConfirm={() => console.log("Confirmar cita", appointment.id)}
                onCancel={() => console.log("Cancelar cita", appointment.id)}
              />
            ))}
          </div>
          {filterAppointments(activeTab).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay citas {activeTab !== "all" ? activeTab : ""} en este momento
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
