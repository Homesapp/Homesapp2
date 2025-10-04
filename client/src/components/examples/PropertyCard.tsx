import { PropertyCard } from "../PropertyCard";

export default function PropertyCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <PropertyCard
        id="1"
        title="Casa Moderna en Zona Residencial"
        price={25000}
        currency="MXN"
        bedrooms={3}
        bathrooms={2}
        area={180}
        location="Polanco, CDMX"
        status="rent"
        onView={() => console.log("Ver propiedad")}
        onEdit={() => console.log("Editar propiedad")}
        onSchedule={() => console.log("Agendar cita")}
      />
    </div>
  );
}
