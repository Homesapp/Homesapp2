import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { 
  Target, 
  Plus, 
  Pencil, 
  Trash2,
  Users,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

interface SellerGoal {
  id: string;
  agencyId: string;
  sellerId: string | null;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  goalType: "leads" | "conversions" | "revenue" | "showings";
  target: number;
  period: "weekly" | "monthly" | "quarterly";
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

type GoalFormData = {
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  goalType: "leads" | "conversions" | "revenue" | "showings";
  target: number;
  period: "weekly" | "monthly" | "quarterly";
  startDate: string;
  endDate: string;
  sellerId: string | null;
  isActive: boolean;
};

const emptyFormData: GoalFormData = {
  nameEs: "",
  nameEn: "",
  descriptionEs: "",
  descriptionEn: "",
  goalType: "leads",
  target: 10,
  period: "monthly",
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  sellerId: null,
  isActive: true,
};

export default function AdminSellerGoals() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SellerGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(emptyFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: goals = [], isLoading } = useQuery<SellerGoal[]>({
    queryKey: ["/api/admin/seller-goals"],
  });

  const { data: sellers = [] } = useQuery<Seller[]>({
    queryKey: ["/api/admin/sellers-for-goals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      return apiRequest("/api/admin/seller-goals", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seller-goals"] });
      toast({
        title: language === 'es' ? "Meta creada" : "Goal created",
        description: language === 'es' ? "La meta se ha creado correctamente" : "The goal has been created successfully",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GoalFormData> }) => {
      return apiRequest(`/api/admin/seller-goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seller-goals"] });
      toast({
        title: language === 'es' ? "Meta actualizada" : "Goal updated",
        description: language === 'es' ? "La meta se ha actualizado correctamente" : "The goal has been updated successfully",
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/seller-goals/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seller-goals"] });
      toast({
        title: language === 'es' ? "Meta eliminada" : "Goal deleted",
        description: language === 'es' ? "La meta se ha eliminado correctamente" : "The goal has been deleted successfully",
      });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'es' ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingGoal(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: SellerGoal) => {
    setEditingGoal(goal);
    setFormData({
      nameEs: goal.nameEs,
      nameEn: goal.nameEn,
      descriptionEs: goal.descriptionEs || "",
      descriptionEn: goal.descriptionEn || "",
      goalType: goal.goalType,
      target: goal.target,
      period: goal.period,
      startDate: goal.startDate.split('T')[0],
      endDate: goal.endDate.split('T')[0],
      sellerId: goal.sellerId,
      isActive: goal.isActive,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "leads": return <Users className="h-4 w-4" />;
      case "conversions": return <TrendingUp className="h-4 w-4" />;
      case "revenue": return <Award className="h-4 w-4" />;
      case "showings": return <Calendar className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      leads: { es: "Leads", en: "Leads" },
      conversions: { es: "Conversiones", en: "Conversions" },
      revenue: { es: "Ingresos", en: "Revenue" },
      showings: { es: "Visitas", en: "Showings" },
    };
    return labels[type]?.[language] || type;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      weekly: { es: "Semanal", en: "Weekly" },
      monthly: { es: "Mensual", en: "Monthly" },
      quarterly: { es: "Trimestral", en: "Quarterly" },
    };
    return labels[period]?.[language] || period;
  };

  const getSellerName = (sellerId: string | null) => {
    if (!sellerId) {
      return language === 'es' ? "Todos los vendedores" : "All sellers";
    }
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? `${seller.firstName} ${seller.lastName}` : sellerId;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">
            {language === 'es' ? "Gestión de Metas" : "Goals Management"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {language === 'es' 
              ? "Crea y administra metas para los vendedores de tu agencia" 
              : "Create and manage goals for your agency sellers"}
          </p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="min-h-[44px]"
          data-testid="button-create-goal"
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'es' ? "Nueva Meta" : "New Goal"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {language === 'es' ? "Metas Activas" : "Active Goals"}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? `${goals.filter(g => g.isActive).length} metas activas de ${goals.length} totales`
              : `${goals.filter(g => g.isActive).length} active goals out of ${goals.length} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {language === 'es' ? "No hay metas configuradas" : "No goals configured"}
              </p>
              <p className="text-sm mt-1">
                {language === 'es' 
                  ? "Crea tu primera meta para empezar a motivar a tus vendedores"
                  : "Create your first goal to start motivating your sellers"}
              </p>
              <Button 
                onClick={openCreateDialog} 
                variant="outline" 
                className="mt-4 min-h-[44px]"
                data-testid="button-create-first-goal"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? "Crear Primera Meta" : "Create First Goal"}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'es' ? "Nombre" : "Name"}</TableHead>
                    <TableHead>{language === 'es' ? "Tipo" : "Type"}</TableHead>
                    <TableHead className="text-center">{language === 'es' ? "Objetivo" : "Target"}</TableHead>
                    <TableHead>{language === 'es' ? "Período" : "Period"}</TableHead>
                    <TableHead>{language === 'es' ? "Vendedor" : "Seller"}</TableHead>
                    <TableHead>{language === 'es' ? "Estado" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === 'es' ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => (
                    <TableRow key={goal.id} data-testid={`row-goal-${goal.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{language === 'es' ? goal.nameEs : goal.nameEn}</div>
                          {(language === 'es' ? goal.descriptionEs : goal.descriptionEn) && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {language === 'es' ? goal.descriptionEs : goal.descriptionEn}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getGoalTypeIcon(goal.goalType)}
                          {getGoalTypeLabel(goal.goalType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {goal.target}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPeriodLabel(goal.period)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getSellerName(goal.sellerId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={goal.isActive ? "default" : "secondary"}>
                          {goal.isActive 
                            ? (language === 'es' ? "Activa" : "Active")
                            : (language === 'es' ? "Inactiva" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(goal)}
                            className="min-h-[44px] min-w-[44px]"
                            data-testid={`button-edit-goal-${goal.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(goal.id)}
                            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                            data-testid={`button-delete-goal-${goal.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal 
                ? (language === 'es' ? "Editar Meta" : "Edit Goal")
                : (language === 'es' ? "Nueva Meta" : "New Goal")}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? (language === 'es' ? "Modifica los detalles de la meta" : "Modify the goal details")
                : (language === 'es' ? "Configura una nueva meta para tus vendedores" : "Configure a new goal for your sellers")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEs">{language === 'es' ? "Nombre (Español)" : "Name (Spanish)"}</Label>
                <Input
                  id="nameEs"
                  value={formData.nameEs}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  placeholder={language === 'es' ? "Ej: Meta de leads mensual" : "Ex: Monthly leads goal"}
                  required
                  className="min-h-[44px]"
                  data-testid="input-name-es"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{language === 'es' ? "Nombre (Inglés)" : "Name (English)"}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder={language === 'es' ? "Ej: Monthly leads goal" : "Ex: Monthly leads goal"}
                  required
                  className="min-h-[44px]"
                  data-testid="input-name-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionEs">{language === 'es' ? "Descripción (Español)" : "Description (Spanish)"}</Label>
                <Textarea
                  id="descriptionEs"
                  value={formData.descriptionEs}
                  onChange={(e) => setFormData({ ...formData, descriptionEs: e.target.value })}
                  placeholder={language === 'es' ? "Descripción opcional..." : "Optional description..."}
                  rows={2}
                  data-testid="input-description-es"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{language === 'es' ? "Descripción (Inglés)" : "Description (English)"}</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder={language === 'es' ? "Optional description..." : "Optional description..."}
                  rows={2}
                  data-testid="input-description-en"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goalType">{language === 'es' ? "Tipo de Meta" : "Goal Type"}</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value: "leads" | "conversions" | "revenue" | "showings") => 
                    setFormData({ ...formData, goalType: value })
                  }
                >
                  <SelectTrigger className="min-h-[44px]" data-testid="select-goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">{getGoalTypeLabel("leads")}</SelectItem>
                    <SelectItem value="conversions">{getGoalTypeLabel("conversions")}</SelectItem>
                    <SelectItem value="revenue">{getGoalTypeLabel("revenue")}</SelectItem>
                    <SelectItem value="showings">{getGoalTypeLabel("showings")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">{language === 'es' ? "Objetivo" : "Target"}</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                  required
                  className="min-h-[44px]"
                  data-testid="input-target"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">{language === 'es' ? "Período" : "Period"}</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: "weekly" | "monthly" | "quarterly") => 
                    setFormData({ ...formData, period: value })
                  }
                >
                  <SelectTrigger className="min-h-[44px]" data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{getPeriodLabel("weekly")}</SelectItem>
                    <SelectItem value="monthly">{getPeriodLabel("monthly")}</SelectItem>
                    <SelectItem value="quarterly">{getPeriodLabel("quarterly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{language === 'es' ? "Fecha de Inicio" : "Start Date"}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="min-h-[44px]"
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{language === 'es' ? "Fecha de Fin" : "End Date"}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="min-h-[44px]"
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerId">{language === 'es' ? "Asignar a Vendedor" : "Assign to Seller"}</Label>
              <Select
                value={formData.sellerId || "all"}
                onValueChange={(value) => 
                  setFormData({ ...formData, sellerId: value === "all" ? null : value })
                }
              >
                <SelectTrigger className="min-h-[44px]" data-testid="select-seller">
                  <SelectValue placeholder={language === 'es' ? "Seleccionar vendedor" : "Select seller"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'es' ? "Todos los vendedores" : "All sellers"}
                  </SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.firstName} {seller.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">
                {formData.isActive 
                  ? (language === 'es' ? "Meta activa" : "Goal active")
                  : (language === 'es' ? "Meta inactiva" : "Goal inactive")}
              </Label>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog}
                className="min-h-[44px]"
                data-testid="button-cancel"
              >
                {language === 'es' ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="min-h-[44px]"
                data-testid="button-save"
              >
                {(createMutation.isPending || updateMutation.isPending) 
                  ? (language === 'es' ? "Guardando..." : "Saving...")
                  : (editingGoal 
                    ? (language === 'es' ? "Actualizar" : "Update")
                    : (language === 'es' ? "Crear" : "Create"))}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? "Confirmar Eliminación" : "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {language === 'es' 
                ? "¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer."
                : "Are you sure you want to delete this goal? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmId(null)}
              className="min-h-[44px]"
              data-testid="button-cancel-delete"
            >
              {language === 'es' ? "Cancelar" : "Cancel"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              className="min-h-[44px]"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending 
                ? (language === 'es' ? "Eliminando..." : "Deleting...")
                : (language === 'es' ? "Eliminar" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
