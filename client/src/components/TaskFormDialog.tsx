import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask, type Task } from "@shared/schema";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useProperties } from "@/hooks/useProperties";
import { useUsersByRole } from "@/hooks/useUsers";
import { useBudgets } from "@/hooks/useBudgets";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  mode: "create" | "edit";
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  mode,
}: TaskFormDialogProps) {
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { data: properties, isLoading: loadingProperties } = useProperties({ active: true });
  const { data: staff } = useUsersByRole("management");
  const { data: concierges } = useUsersByRole("concierge");
  const { data: budgets } = useBudgets();

  const allStaff = [...(staff || []), ...(concierges || [])];

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      propertyId: "",
      assignedToId: "",
      title: "",
      description: "",
      dueDate: undefined,
      status: "pending",
      priority: "medium",
      budgetId: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (task && mode === "edit") {
      form.reset({
        propertyId: task.propertyId,
        assignedToId: task.assignedToId,
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        status: task.status,
        priority: task.priority,
        budgetId: task.budgetId || undefined,
        notes: task.notes || "",
      });
    } else if (mode === "create") {
      form.reset({
        propertyId: "",
        assignedToId: "",
        title: "",
        description: "",
        dueDate: undefined,
        status: "pending",
        priority: "medium",
        budgetId: undefined,
        notes: "",
      });
    }
  }, [task, mode, form]);

  const onSubmit = async (data: InsertTask) => {
    try {
      if (mode === "edit" && task) {
        await updateMutation.mutateAsync({ id: task.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-task-form">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "create" ? "Nueva Tarea" : "Editar Tarea"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva tarea para el personal"
              : "Actualiza los detalles de la tarea"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propiedad *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingProperties}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property">
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignado a *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assigned-to">
                        <SelectValue placeholder="Seleccionar personal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allStaff?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} - {member.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Título de la tarea"
                      data-testid="input-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción detallada de la tarea..."
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de vencimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-date-picker"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Prioridad *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                      data-testid="radio-priority"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="low" data-testid="radio-low" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Baja
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="medium" data-testid="radio-medium" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Media
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="high" data-testid="radio-high" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Alta
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-budget">
                        <SelectValue placeholder="Seleccionar presupuesto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin presupuesto</SelectItem>
                      {budgets?.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.title} - ${budget.estimatedCost}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales..."
                      data-testid="input-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "create" ? "Crear Tarea" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
