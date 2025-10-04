import { AppointmentCard } from "../AppointmentCard";

export default function AppointmentCardExample() {
  return (
    <div className="p-4 max-w-md">
      <AppointmentCard
        id="1"
        propertyTitle="Casa Moderna en Zona Residencial"
        clientName="María González"
        date="15 Oct 2025"
        time="10:00 AM"
        type="video"
        status="pending"
        meetLink="https://meet.google.com/abc-defg-hij"
        onConfirm={() => console.log("Confirmar cita")}
        onCancel={() => console.log("Cancelar cita")}
      />
    </div>
  );
}
