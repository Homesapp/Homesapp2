import { useState, useMemo } from "react";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { WorkReportFormDialog } from "@/components/WorkReportFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTasks, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useWorkReports } from "@/hooks/useWorkReports";
import { useProperties } from "@/hooks/useProperties";
import { useUsersByRole } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Task } from "@shared/schema";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");

  const { toast } = useToast();
  const { user } = useAuth();
  
  const filters: any = {};
  if (activeTab !== "all") filters.status = activeTab;
  if (propertyFilter !== "all") filters.propertyId = propertyFilter;
  if (assignedFilter !== "all") filters.assignedToId = assignedFilter;

  const { data: tasks, isLoading, error } = useTasks(filters);
  const { data: properties } = useProperties();
  const { data: staff } = useUsersByRole("management");
  const { data: concierges } = useUsersByRole("concierge");
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const allStaff = [...(staff || []), ...(concierges || [])];

  const canCreateTask = user && ["master", "admin", "admin_jr", "management"].includes(user.role);
  const canEditTask = user && ["master", "admin", "admin_jr", "management"].includes(user.role);

  const tasksWithDetails = useMemo(() => {
    if (!tasks || !properties || !allStaff) return [];
    
    return tasks.map(task => {
      const property = properties.find(p => p.id === task.propertyId);
      const assignedTo = allStaff.find(s => s.id === task.assignedToId);
      
      return {
        ...task,
        propertyTitle: property?.title || "Propiedad",
        propertyLocation: property?.location || "",
        assignedToName: assignedTo ? `${assignedTo.firstName} ${assignedTo.lastName}` : "Sin asignar",
      };
    });
  }, [tasks, properties, allStaff]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        data: { status: newStatus as any },
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setEditMode("edit");
    setDialogOpen(true);
  };

  const handleCreateReport = (taskId: string) => {
    setSelectedTaskId(taskId);
    setReportDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteTask.mutateAsync(taskToDelete);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setEditMode("create");
    setDialogOpen(true);
  };

  const allTasks = tasks || [];
  const pendingCount = allTasks.filter(t => t.status === "pending").length;
  const inProgressCount = allTasks.filter(t => t.status === "in-progress").length;
  const completedCount = allTasks.filter(t => t.status === "completed").length;
  const cancelledCount = allTasks.filter(t => t.status === "cancelled").length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tareas</h1>
          <p className="text-muted-foreground">Gestiona las tareas asignadas al personal</p>
        </div>
        {canCreateTask && (
          <Button onClick={handleNewTask} data-testid="button-new-task">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger data-testid="select-property-filter">
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
        <div className="flex-1">
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger data-testid="select-assigned-filter">
              <SelectValue placeholder="Filtrar por asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el personal</SelectItem>
              {allStaff?.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="text-center py-8 text-destructive" data-testid="error-message">
          Error al cargar las tareas. Por favor, intenta de nuevo.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-tasks">
            Todas ({allTasks.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="in-progress" data-testid="tab-in-progress">
            En progreso ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completadas ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">
            Canceladas ({cancelledCount})
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
          ) : tasksWithDetails.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasksWithDetails.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={(id) => setTaskToDelete(id)}
                  onCreateReport={handleCreateReport}
                  canEdit={canEditTask}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-tasks">
              No hay tareas {activeTab !== "all" ? activeTab : ""} en este momento
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        mode={editMode}
      />

      <WorkReportFormDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        taskId={selectedTaskId}
      />

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea y todos sus reportes asociados serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateReport: (taskId: string) => void;
  canEdit: boolean;
  getPriorityColor: (priority: string) => any;
  getPriorityLabel: (priority: string) => string;
  currentUserId?: string;
}

function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onCreateReport,
  canEdit,
  getPriorityColor,
  getPriorityLabel,
  currentUserId,
}: TaskCardProps) {
  const { data: workReports } = useWorkReports({ taskId: task.id });
  const reportsCount = workReports?.length || 0;
  const isAssignedToMe = currentUserId === task.assignedToId;

  return (
    <Card className="flex flex-col" data-testid={`task-card-${task.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" data-testid="task-title">
            {task.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate" data-testid="task-property">
            {task.propertyTitle}
          </p>
        </div>
        <Badge variant={getPriorityColor(task.priority)} data-testid="task-priority">
          {getPriorityLabel(task.priority)}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="task-description">
            {task.description}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Asignado a:</span>
            <span className="font-medium" data-testid="task-assigned">
              {task.assignedToName}
            </span>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Vencimiento:</span>
              <span className="font-medium" data-testid="task-due-date">
                {format(new Date(task.dueDate), "dd/MM/yyyy")}
              </span>
            </div>
          )}

          {reportsCount > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground" data-testid="task-reports-count">
                {reportsCount} reporte{reportsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Select
            value={task.status}
            onValueChange={(value) => onStatusChange(task.id, value)}
            disabled={!canEdit && !isAssignedToMe}
          >
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in-progress">En progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCreateReport(task.id)}
          data-testid="button-create-report"
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-1" />
          Reporte
        </Button>
        
        {canEdit && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(task)}
              data-testid="button-edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(task.id)}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
