import { ClientPresentationCard } from "../ClientPresentationCard";

export default function ClientPresentationCardExample() {
  return (
    <div className="p-4 max-w-md">
      <ClientPresentationCard
        id="1"
        clientName="Carlos Rodríguez"
        propertyType="Casa"
        modality="rent"
        minPrice={20000}
        maxPrice={35000}
        location="Polanco, CDMX"
        bedrooms={3}
        bathrooms={2}
        amenities={["Estacionamiento", "Jardín", "Seguridad 24/7"]}
        matchCount={8}
        onSave={() => console.log("Guardar tarjeta")}
        onShare={() => console.log("Compartir tarjeta")}
        onViewMatches={() => console.log("Ver coincidencias")}
      />
    </div>
  );
}
