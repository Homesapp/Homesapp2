import { useState } from "react";
import { ClientPresentationCard } from "@/components/ClientPresentationCard";
import { PresentationCardFormDialog } from "@/components/PresentationCardFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePresentationCards, useMatchPropertiesForCard } from "@/hooks/usePresentationCards";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropertyCard } from "@/components/PropertyCard";
import type { Property, User, PresentationCard } from "@shared/schema";

export default function PresentationCards() {
  const { user } = useAuth();
  const { data: cards, isLoading, error } = usePresentationCards();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PresentationCard | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  
  const { data: matchingProperties = [], isLoading: matchesLoading } = useMatchPropertiesForCard(
    selectedCardId || ""
  );

  const handleViewMatches = (cardId: string) => {
    setSelectedCardId(cardId);
    setMatchesDialogOpen(true);
  };

  const handleNewCard = () => {
    setFormMode("create");
    setEditingCard(undefined);
    setFormDialogOpen(true);
  };

  const handleEditCard = (card: PresentationCard) => {
    setFormMode("edit");
    setEditingCard(card);
    setFormDialogOpen(true);
  };

  const getClientName = (card: any) => {
    return `${(card.client as User)?.firstName || ""} ${(card.client as User)?.lastName || ""}`.trim() || "Cliente";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
            <p className="text-muted-foreground">
              Perfiles de búsqueda de clientes
            </p>
          </div>
          <Button data-testid="button-new-card" onClick={handleNewCard} disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarjeta
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
            <p className="text-muted-foreground">
              Perfiles de búsqueda de clientes
            </p>
          </div>
          <Button data-testid="button-new-card" onClick={handleNewCard}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarjeta
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar las tarjetas: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
          <p className="text-muted-foreground">
            Perfiles de búsqueda de clientes
          </p>
        </div>
        <Button data-testid="button-new-card" onClick={handleNewCard}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarjeta
        </Button>
      </div>

      <PresentationCardFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        card={editingCard}
        mode={formMode}
      />

      {!cards || cards.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay tarjetas de presentación aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea una nueva tarjeta para empezar a buscar propiedades
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const matchCount = 0;

            return (
              <PresentationCardWithMatches
                key={card.id}
                card={card}
                clientName={getClientName(card)}
                onViewMatches={() => handleViewMatches(card.id)}
                onEdit={() => handleEditCard(card)}
              />
            );
          })}
        </div>
      )}

      <Dialog open={matchesDialogOpen} onOpenChange={setMatchesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Propiedades Coincidentes</DialogTitle>
          </DialogHeader>
          {matchesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 py-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
              ))}
            </div>
          ) : matchingProperties.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron propiedades que coincidan con esta tarjeta
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 py-4">
              {matchingProperties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PresentationCardWithMatches({ 
  card, 
  clientName, 
  onViewMatches,
  onEdit
}: { 
  card: any; 
  clientName: string; 
  onViewMatches: () => void;
  onEdit: () => void;
}) {
  const { data: matchingProperties = [] } = useMatchPropertiesForCard(card.id);
  const matchCount = matchingProperties.length;

  return (
    <ClientPresentationCard
      id={card.id}
      clientName={clientName}
      propertyType={card.propertyType}
      modality={card.modality}
      minPrice={parseFloat(card.minPrice)}
      maxPrice={parseFloat(card.maxPrice)}
      location={card.location}
      bedrooms={card.bedrooms || undefined}
      bathrooms={card.bathrooms || undefined}
      amenities={card.amenities || []}
      matchCount={matchCount}
      onSave={onEdit}
      onShare={() => console.log("Compartir tarjeta", card.id)}
      onViewMatches={onViewMatches}
    />
  );
}
