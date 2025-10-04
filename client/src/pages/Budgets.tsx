import { useState, useMemo } from "react";
import { BudgetFormDialog } from "@/components/BudgetFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBudgets, useUpdateBudget, useDeleteBudget } from "@/hooks/useBudgets";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Check, X, CheckCircle, Trash2, FileText } from "lucide-react";
import type { Budget } from "@shared/schema";

const statusLabels = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  completed: "Completado",
};

const statusVariants = {
  pending: "secondary" as const,
  approved: "default" as const,
  rejected: "destructive" as const,
  completed: "outline" as const,
};

export default function Budgets() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const filters = {
    ...(activeTab !== "all" && { status: activeTab }),
    ...(selectedProperty !== "all" && { propertyId: selectedProperty }),
  };
  
  const { data: budgets, isLoading, error } = useBudgets(filters);
  const { data: properties } = useProperties({ active: true });
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const canCreate = user && ["master", "admin", "admin_jr", "management", "provider"].includes(user.role);
  const canApproveReject = user && ["master", "admin", "owner"].includes(user.role);

  const budgetsWithProperty = useMemo(() => {
    if (!budgets || !properties) return [];
    
    return budgets.map(budget => {
      const property = properties.find(p => p.id === budget.propertyId);
      return {
        ...budget,
        propertyTitle: property?.title || "Propiedad",
      };
    });
  }, [budgets, properties]);

  const handleApprove = async (id: string) => {
    try {
      await updateBudget.mutateAsync({
        id,
        data: { status: "approved" },
      });
    } catch (error) {
      console.error("Error approving budget:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateBudget.mutateAsync({
        id,
        data: { status: "rejected" },
      });
    } catch (error) {
      console.error("Error rejecting budget:", error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateBudget.mutateAsync({
        id,
        data: { status: "completed" },
      });
    } catch (error) {
      console.error("Error completing budget:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este presupuesto?")) return;
    
    try {
      await deleteBudget.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingBudget(undefined);
    setDialogOpen(true);
  };

  const allBudgets = budgets || [];
  const pendingCount = allBudgets.filter(b => b.status === "pending").length;
  const approvedCount = allBudgets.filter(b => b.status === "approved").length;
  const rejectedCount = allBudgets.filter(b => b.status === "rejected").length;
  const completedCount = allBudgets.filter(b => b.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">Gestiona presupuestos y cotizaciones</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateNew} data-testid="button-new-budget">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-property-filter">
            <SelectValue placeholder="Filtrar por propiedad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las propiedades</SelectItem>
            {properties?.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="text-center py-8 text-destructive" data-testid="error-message">
          Error al cargar los presupuestos. Por favor, intenta de nuevo.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-budgets">
            Todos ({allBudgets.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobados ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazados ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completados ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-64 w-full" />
                </div>
              ))}
            </div>
          ) : budgetsWithProperty.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetsWithProperty.map((budget) => (
                <Card key={budget.id} data-testid={`card-budget-${budget.id}`}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2" data-testid="budget-title">
                        {budget.title}
                      </CardTitle>
                      <Badge variant={statusVariants[budget.status]} data-testid="budget-status">
                        {statusLabels[budget.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span data-testid="budget-property">{budget.propertyTitle}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3" data-testid="budget-description">
                      {budget.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold" data-testid="budget-cost">
                        ${parseFloat(budget.estimatedCost).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">{budget.currency}</span>
                    </div>
                    {budget.notes && (
                      <p className="text-xs text-muted-foreground" data-testid="budget-notes">
                        Notas: {budget.notes}
                      </p>
                    )}
                    {budget.attachments && budget.attachments.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {budget.attachments.length} adjunto(s)
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {canApproveReject && budget.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(budget.id)}
                          disabled={updateBudget.isPending}
                          data-testid={`button-approve-${budget.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(budget.id)}
                          disabled={updateBudget.isPending}
                          data-testid={`button-reject-${budget.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {canApproveReject && budget.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(budget.id)}
                        disabled={updateBudget.isPending}
                        data-testid={`button-complete-${budget.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completar
                      </Button>
                    )}
                    {user && (budget.staffId === user.id || ["master", "admin"].includes(user.role)) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(budget)}
                          data-testid={`button-edit-${budget.id}`}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(budget.id)}
                          disabled={deleteBudget.isPending}
                          data-testid={`button-delete-${budget.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-budgets">
              No hay presupuestos {activeTab !== "all" ? statusLabels[activeTab as keyof typeof statusLabels] : ""} en este momento
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budget={editingBudget}
        mode={editingBudget ? "edit" : "create"}
      />
    </div>
  );
}
