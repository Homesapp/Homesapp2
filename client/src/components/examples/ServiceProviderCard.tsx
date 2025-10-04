import { ServiceProviderCard } from "../ServiceProviderCard";

export default function ServiceProviderCardExample() {
  return (
    <div className="p-4 max-w-md">
      <ServiceProviderCard
        id="1"
        name="Juan Pérez"
        specialty="Electricista"
        rating={4.8}
        reviewCount={24}
        available={true}
        services={[
          { name: "Instalación eléctrica", price: 1500, description: "Instalación completa de sistema eléctrico" },
          { name: "Reparación de fallas", price: 800, description: "Diagnóstico y reparación de problemas eléctricos" }
        ]}
        onMessage={() => console.log("Enviar mensaje")}
        onCall={() => console.log("Llamar")}
        onHire={() => console.log("Contratar")}
      />
    </div>
  );
}
