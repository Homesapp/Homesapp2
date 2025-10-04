import { useState, useMemo } from "react";
import { OfferFormDialog } from "@/components/OfferFormDialog";
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
import { Search, MoreVertical, Eye, CheckCircle, XCircle, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOffers, useUpdateOffer } from "@/hooks/useOffers";
import { format } from "date-fns";
import type { Offer } from "@shared/schema";

export default function Backoffice() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerFormOpen, setOfferFormOpen] = useState(false);

  const { data: offers = [], isLoading, error } = useOffers({ 
    status: statusFilter !== "all" ? statusFilter : undefined 
  });

  const updateOffer = useUpdateOffer();

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

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    
    return offers.filter((offer) => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      const propertyTitle = offer.property?.title?.toLowerCase() || "";
      const clientId = offer.clientId?.toLowerCase() || "";
      
      return propertyTitle.includes(query) || clientId.includes(query);
    });
  }, [offers, searchQuery]);

  const handleAccept = (offerId: string) => {
    updateOffer.mutate({ id: offerId, data: { status: "accepted" } });
  };

  const handleReject = (offerId: string) => {
    updateOffer.mutate({ id: offerId, data: { status: "rejected" } });
  };

  const handleUnderReview = (offerId: string) => {
    updateOffer.mutate({ id: offerId, data: { status: "under-review" } });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "N/A";
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Backoffice</h1>
          <p className="text-muted-foreground">
            Gestión de ofertas y seguimiento de citas
          </p>
        </div>
        <div className="text-center py-12 text-destructive">
          Error al cargar ofertas: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backoffice</h1>
          <p className="text-muted-foreground">
            Gestión de ofertas y seguimiento de citas
          </p>
        </div>
        <Button onClick={() => setOfferFormOpen(true)} data-testid="button-new-offer">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Oferta
        </Button>
      </div>

      <OfferFormDialog
        open={offerFormOpen}
        onOpenChange={setOfferFormOpen}
      />

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID de cliente o propiedad..."
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
              <TableHead>Cliente ID</TableHead>
              <TableHead>Propiedad</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo Cita</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando ofertas...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No se encontraron ofertas
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => (
                <TableRow key={offer.id} className="hover-elevate" data-testid={`row-offer-${offer.id}`}>
                  <TableCell className="font-medium" data-testid={`text-client-${offer.id}`}>
                    {offer.clientId.substring(0, 8)}...
                  </TableCell>
                  <TableCell data-testid={`text-property-${offer.id}`}>
                    {offer.property?.title || `Propiedad ${offer.propertyId.substring(0, 8)}...`}
                  </TableCell>
                  <TableCell className="font-mono" data-testid={`text-amount-${offer.id}`}>
                    {formatCurrency(offer.offerAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[offer.status]} data-testid={`badge-status-${offer.id}`}>
                      {statusLabels[offer.status]}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-date-${offer.id}`}>
                    {formatDate(offer.createdAt)}
                  </TableCell>
                  <TableCell>
                    {offer.appointment ? (
                      <Badge variant="outline" data-testid={`badge-type-${offer.id}`}>
                        {offer.appointment.type === "video" ? "Videollamada" : "Presencial"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin cita</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          data-testid={`button-actions-${offer.id}`}
                          disabled={updateOffer.isPending}
                        >
                          {updateOffer.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => console.log("Ver detalles", offer.id)}
                          data-testid={`button-view-${offer.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {offer.status === "pending" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleUnderReview(offer.id)}
                              data-testid={`button-review-${offer.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Poner en Revisión
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAccept(offer.id)}
                              data-testid={`button-accept-${offer.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aceptar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleReject(offer.id)}
                              data-testid={`button-reject-${offer.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                        {offer.status === "under-review" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleAccept(offer.id)}
                              data-testid={`button-accept-${offer.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aceptar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleReject(offer.id)}
                              data-testid={`button-reject-${offer.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
