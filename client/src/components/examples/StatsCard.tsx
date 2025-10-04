import { StatsCard } from "../StatsCard";
import { Building2 } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <StatsCard
        title="Propiedades Activas"
        value={45}
        icon={Building2}
        trend={{ value: 12, label: "vs mes anterior" }}
        description="En renta y venta"
      />
    </div>
  );
}
