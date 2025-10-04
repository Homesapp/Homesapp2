import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreVertical, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Offer = {
  id: string;
  clientName: string;
  propertyTitle: string;
  offerAmount: number;
  status: "pending" | "accepted" | "rejected" | "under-review";
  date: string;
  appointmentType: "video" | "in-person";
  appointmentDate?: string;
};

export default function Backoffice() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const offers: Offer[] = [
    {
      id: "1",
      clientName: "María González",
      propertyTitle: "Casa Moderna en Polanco",
      offerAmount: 24000,
      status: "pending",
      date: "15 Oct 2025",
      appointmentType: "video",
      appointmentDate: "15 Oct 2025",
    },
    {
      id: "2",
      clientName: "Carlos Rodríguez",
      propertyTitle: "Departamento en Santa Fe",
      offerAmount: 4200000,
      status: "under-review",
      date: "14 Oct 2025",
      appointmentType: "in-person",
      appointmentDate: "16 Oct 2025",
    },
    {
      id: "3",
      clientName: "Ana López",
      propertyTitle: "Penthouse Vista Panorámica",
      offerAmount: 8000000,
      status: "accepted",
      date: "13 Oct 2025",
      appointmentType: "video",
      appointmentDate: "17 Oct 2025",
    },
    {
      id: "4",
      clientName: "Roberto Sánchez",
      propertyTitle: "Casa Residencial Jardín",
      offerAmount: 32000,
      status: "rejected",
      date: "12 Oct 2025",
      appointmentType: "in-person",
      appointmentDate: "12 Oct 2025",
    },
    {
      id: "5",
      clientName: "Diana Morales",
      propertyTitle: "Loft Moderno Centro",
      offerAmount: 2700000,
      status: "pending",
      date: "11 Oct 2025",
      appointmentType: "video",
    },
  ];

  const statusLabels: Record<Offer["status"], string> = {
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
    "under-review": "En Revisión",
  };

  const statusVariants: Record<Offer["status"], "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    accepted: "default",
    rejected: "destructive",
    "under-review": "secondary",
  };

  const filterOffers = () => {
    let filtered = offers;
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (o) =>
          o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backoffice</h1>
        <p className="text-muted-foreground">
          Gestión de ofertas y seguimiento de citas
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o propiedad..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-offers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="under-review">En Revisión</SelectItem>
            <SelectItem value="accepted">Aceptada</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Propiedad</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo Cita</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filterOffers().map((offer) => (
              <TableRow key={offer.id} className="hover-elevate">
                <TableCell className="font-medium">{offer.clientName}</TableCell>
                <TableCell>{offer.propertyTitle}</TableCell>
                <TableCell className="font-mono">
                  ${offer.offerAmount.toLocaleString()} MXN
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[offer.status]}>
                    {statusLabels[offer.status]}
                  </Badge>
                </TableCell>
                <TableCell>{offer.date}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {offer.appointmentType === "video" ? "Videollamada" : "Presencial"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${offer.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Ver detalles", offer.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                      {offer.status === "pending" && (
                        <>
                          <DropdownMenuItem onClick={() => console.log("Aceptar", offer.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aceptar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log("Rechazar", offer.id)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filterOffers().length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron ofertas
        </div>
      )}
    </div>
  );
}
