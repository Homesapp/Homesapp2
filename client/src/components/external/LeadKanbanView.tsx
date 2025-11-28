import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExternalLead } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type LeadStatus =
  | "nuevo_lead"
  | "cita_coordinada"
  | "interesado"
  | "oferta_enviada"
  | "oferta_completada"
  | "formato_enviado"
  | "formato_completado"
  | "proceso_renta"
  | "renta_concretada"
  | "perdido"
  | "muerto";

interface LeadKanbanViewProps {
  leads: ExternalLead[];
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  onViewDetail?: (lead: ExternalLead) => void;
}

interface KanbanColumnDef {
  id: LeadStatus;
  labelEs: string;
  labelEn: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: "nuevo_lead", labelEs: "Nuevo Lead", labelEn: "New Lead" },
  { id: "cita_coordinada", labelEs: "Cita Coordinada", labelEn: "Appointment Scheduled" },
  { id: "interesado", labelEs: "Interesado", labelEn: "Interested" },
  { id: "oferta_enviada", labelEs: "Oferta Enviada", labelEn: "Offer Sent" },
  { id: "oferta_completada", labelEs: "Oferta Completada", labelEn: "Offer Completed" },
  { id: "formato_enviado", labelEs: "Formato Enviado", labelEn: "Form Sent" },
  { id: "formato_completado", labelEs: "Formato Completado", labelEn: "Form Completed" },
  { id: "proceso_renta", labelEs: "Proceso de Renta", labelEn: "Rental Process" },
  { id: "renta_concretada", labelEs: "Renta Concretada", labelEn: "Rental Completed" },
  { id: "perdido", labelEs: "Lead Perdido", labelEn: "Lead Lost" },
  { id: "muerto", labelEs: "Lead Muerto", labelEn: "Dead Lead" },
];

function DroppableColumn({
  id,
  label,
  count,
  children,
}: {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 rounded-lg border-2 p-4 transition-colors",
        isOver ? "border-primary bg-accent/50" : "border-border bg-card"
      )}
      data-testid={`kanban-column-${id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-3 min-h-[200px]">{children}</div>
    </div>
  );
}

function DraggableLeadCard({
  lead,
  onEdit,
  onDelete,
  isDragging = false,
}: {
  lead: ExternalLead;
  onEdit: (lead: ExternalLead) => void;
  onDelete: (lead: ExternalLead) => void;
  isDragging?: boolean;
}) {
  const { language } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover-elevate cursor-grab active:cursor-grabbing",
        (isDragging || dragging) && "opacity-50"
      )}
      data-testid={`lead-card-${lead.id}`}
      {...listeners}
      {...attributes}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium truncate">
            {lead.firstName} {lead.lastName}
          </CardTitle>
          <Badge variant="outline" className="mt-1 text-xs">
            {lead.registrationType === "broker" 
              ? (language === "es" ? "Broker" : "Broker") 
              : (language === "es" ? "Vendedor" : "Seller")}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid={`button-lead-actions-${lead.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(lead)} data-testid={`button-edit-lead-${lead.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {language === "es" ? "Editar" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(lead)}
              className="text-destructive"
              data-testid={`button-delete-lead-${lead.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {language === "es" ? "Eliminar" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {lead.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.phoneLast4 && !lead.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>*** {lead.phoneLast4}</span>
          </div>
        )}
        {lead.createdAt && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-3 w-3 flex-shrink-0" />
            <span>{format(new Date(lead.createdAt), "d MMM yyyy", { locale: language === "es" ? es : undefined })}</span>
          </div>
        )}
        {lead.notes && (
          <p className="text-muted-foreground line-clamp-2 mt-2 pt-2 border-t">
            {lead.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function LeadKanbanView({
  leads,
  onUpdateStatus,
  onEdit,
  onDelete,
}: LeadKanbanViewProps) {
  const { language } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStatus = over.id as LeadStatus;
      onUpdateStatus(leadId, newStatus);
    }

    setActiveId(null);
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          const label = language === "es" ? column.labelEs : column.labelEn;
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              label={label}
              count={columnLeads.length}
            >
              {columnLeads.map((lead) => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDragging={activeId === lead.id}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <DraggableLeadCard lead={activeLead} onEdit={onEdit} onDelete={onDelete} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
