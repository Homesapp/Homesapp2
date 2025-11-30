import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Building, 
  Users, 
  UserCog, 
  FileText, 
  History, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  Percent,
  Home,
  Key,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "@shared/schema";

interface CommissionProfile {
  id: string;
  agencyId: string;
  defaultRentalCommission: string;
  defaultListedPropertyCommission: string;
  defaultRecruitedPropertyCommission: string;
  createdAt: string;
  updatedAt: string;
}

interface RoleOverride {
  id: string;
  agencyId: string;
  role: string;
  rentalCommission: string | null;
  listedPropertyCommission: string | null;
  recruitedPropertyCommission: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserOverride {
  id: string;
  agencyId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  rentalCommission: string | null;
  listedPropertyCommission: string | null;
  recruitedPropertyCommission: string | null;
  notes: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  agencyId: string;
  entityType: string;
  entityId: string;
  action: string;
  previousValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changedBy: string | null;
  changedByName: string | null;
  createdAt: string;
}

const profileSchema = z.object({
  defaultRentalCommission: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Debe ser un número entre 0 y 100"),
  defaultListedPropertyCommission: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Debe ser un número entre 0 y 100"),
  defaultRecruitedPropertyCommission: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Debe ser un número entre 0 y 100"),
});

const roleOverrideSchema = z.object({
  role: z.string().min(1, "Selecciona un rol"),
  rentalCommission: z.string().optional(),
  listedPropertyCommission: z.string().optional(),
  recruitedPropertyCommission: z.string().optional(),
  notes: z.string().optional(),
});

const userOverrideSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  rentalCommission: z.string().optional(),
  listedPropertyCommission: z.string().optional(),
  recruitedPropertyCommission: z.string().optional(),
  notes: z.string().optional(),
  effectiveFrom: z.string().optional(),
  effectiveUntil: z.string().optional(),
});

const ROLE_LABELS: Record<string, { es: string; en: string }> = {
  external_agency_admin: { es: "Administrador", en: "Administrator" },
  external_agency_manager: { es: "Gerente", en: "Manager" },
  external_agency_seller: { es: "Vendedor", en: "Seller" },
  external_agency_accountant: { es: "Contador", en: "Accountant" },
};

export default function CommissionManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("defaults");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingRoleOverride, setEditingRoleOverride] = useState<RoleOverride | null>(null);
  const [editingUserOverride, setEditingUserOverride] = useState<UserOverride | null>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<CommissionProfile | null>({
    queryKey: ['/api/external/commissions/profile'],
  });

  const { data: roleOverrides = [], isLoading: roleOverridesLoading } = useQuery<RoleOverride[]>({
    queryKey: ['/api/external/commissions/role-overrides'],
  });

  const { data: userOverrides = [], isLoading: userOverridesLoading } = useQuery<UserOverride[]>({
    queryKey: ['/api/external/commissions/user-overrides'],
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/external/commissions/audit-logs'],
  });

  const { data: agencyUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/external/users'],
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      defaultRentalCommission: profile?.defaultRentalCommission || "10",
      defaultListedPropertyCommission: profile?.defaultListedPropertyCommission || "5",
      defaultRecruitedPropertyCommission: profile?.defaultRecruitedPropertyCommission || "20",
    },
  });

  const roleOverrideForm = useForm<z.infer<typeof roleOverrideSchema>>({
    resolver: zodResolver(roleOverrideSchema),
    defaultValues: {
      role: "",
      rentalCommission: "",
      listedPropertyCommission: "",
      recruitedPropertyCommission: "",
      notes: "",
    },
  });

  const userOverrideForm = useForm<z.infer<typeof userOverrideSchema>>({
    resolver: zodResolver(userOverrideSchema),
    defaultValues: {
      userId: "",
      rentalCommission: "",
      listedPropertyCommission: "",
      recruitedPropertyCommission: "",
      notes: "",
      effectiveFrom: "",
      effectiveUntil: "",
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      return await apiRequest("POST", "/api/external/commissions/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/audit-logs'] });
      toast({
        title: language === "es" ? "Configuración guardada" : "Configuration saved",
        description: language === "es" 
          ? "Los valores predeterminados de comisión han sido actualizados"
          : "Default commission values have been updated",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es"
          ? "No se pudo guardar la configuración"
          : "Could not save configuration",
        variant: "destructive",
      });
    },
  });

  const createRoleOverrideMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleOverrideSchema>) => {
      const payload = {
        ...data,
        rentalCommission: data.rentalCommission || null,
        listedPropertyCommission: data.listedPropertyCommission || null,
        recruitedPropertyCommission: data.recruitedPropertyCommission || null,
      };
      if (editingRoleOverride) {
        return await apiRequest("PATCH", `/api/external/commissions/role-overrides/${editingRoleOverride.id}`, payload);
      }
      return await apiRequest("POST", "/api/external/commissions/role-overrides", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/role-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/audit-logs'] });
      setRoleDialogOpen(false);
      setEditingRoleOverride(null);
      roleOverrideForm.reset();
      toast({
        title: language === "es" ? "Comisión por rol guardada" : "Role commission saved",
      });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        variant: "destructive",
      });
    },
  });

  const deleteRoleOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external/commissions/role-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/role-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/audit-logs'] });
      toast({
        title: language === "es" ? "Comisión eliminada" : "Commission deleted",
      });
    },
  });

  const createUserOverrideMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userOverrideSchema>) => {
      const payload = {
        ...data,
        rentalCommission: data.rentalCommission || null,
        listedPropertyCommission: data.listedPropertyCommission || null,
        recruitedPropertyCommission: data.recruitedPropertyCommission || null,
        effectiveFrom: data.effectiveFrom || null,
        effectiveUntil: data.effectiveUntil || null,
      };
      if (editingUserOverride) {
        return await apiRequest("PATCH", `/api/external/commissions/user-overrides/${editingUserOverride.id}`, payload);
      }
      return await apiRequest("POST", "/api/external/commissions/user-overrides", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/user-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/audit-logs'] });
      setUserDialogOpen(false);
      setEditingUserOverride(null);
      userOverrideForm.reset();
      toast({
        title: language === "es" ? "Comisión de usuario guardada" : "User commission saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: error?.message || "Error al guardar",
        variant: "destructive",
      });
    },
  });

  const deleteUserOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/external/commissions/user-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/user-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external/commissions/audit-logs'] });
      toast({
        title: language === "es" ? "Comisión eliminada" : "Commission deleted",
      });
    },
  });

  const onSaveProfile = (data: z.infer<typeof profileSchema>) => {
    saveProfileMutation.mutate(data);
  };

  const onSaveRoleOverride = (data: z.infer<typeof roleOverrideSchema>) => {
    createRoleOverrideMutation.mutate(data);
  };

  const onSaveUserOverride = (data: z.infer<typeof userOverrideSchema>) => {
    createUserOverrideMutation.mutate(data);
  };

  const openEditRoleOverride = (override: RoleOverride) => {
    setEditingRoleOverride(override);
    roleOverrideForm.reset({
      role: override.role,
      rentalCommission: override.rentalCommission || "",
      listedPropertyCommission: override.listedPropertyCommission || "",
      recruitedPropertyCommission: override.recruitedPropertyCommission || "",
      notes: override.notes || "",
    });
    setRoleDialogOpen(true);
  };

  const openEditUserOverride = (override: UserOverride) => {
    setEditingUserOverride(override);
    userOverrideForm.reset({
      userId: override.userId,
      rentalCommission: override.rentalCommission || "",
      listedPropertyCommission: override.listedPropertyCommission || "",
      recruitedPropertyCommission: override.recruitedPropertyCommission || "",
      notes: override.notes || "",
      effectiveFrom: override.effectiveFrom?.split('T')[0] || "",
      effectiveUntil: override.effectiveUntil?.split('T')[0] || "",
    });
    setUserDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    return ROLE_LABELS[role]?.[language] || role;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create": return language === "es" ? "Creación" : "Create";
      case "update": return language === "es" ? "Actualización" : "Update";
      case "delete": return language === "es" ? "Eliminación" : "Delete";
      default: return action;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "commission_profile": return language === "es" ? "Perfil de comisiones" : "Commission profile";
      case "role_override": return language === "es" ? "Comisión por rol" : "Role commission";
      case "user_override": return language === "es" ? "Comisión por usuario" : "User commission";
      case "lead_override": return language === "es" ? "Comisión por lead" : "Lead commission";
      default: return type;
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {language === "es" 
            ? "Las comisiones se calculan con prioridad: Lead/Prospecto específico > Usuario específico > Rol > Valores predeterminados"
            : "Commissions are calculated with priority: Specific Lead/Prospect > Specific User > Role > Default values"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1">
          <TabsTrigger value="defaults" className="flex items-center gap-1 text-xs sm:text-sm" data-testid="tab-defaults">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Predeterminados" : "Defaults"}</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1 text-xs sm:text-sm" data-testid="tab-roles">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Por Rol" : "By Role"}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm" data-testid="tab-users">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Por Usuario" : "By User"}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 text-xs sm:text-sm" data-testid="tab-history">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "es" ? "Historial" : "History"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="defaults" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {language === "es" ? "Comisiones Predeterminadas" : "Default Commissions"}
              </CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Estos valores se aplican cuando no hay una configuración específica para rol o usuario"
                  : "These values apply when there's no specific role or user configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={profileForm.control}
                      name="defaultRentalCommission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-green-600" />
                            {language === "es" ? "Renta" : "Rental"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="pr-8"
                                data-testid="input-rental-commission"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {language === "es" ? "Comisión por contratos de renta" : "Commission for rental contracts"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="defaultListedPropertyCommission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-blue-600" />
                            {language === "es" ? "Propiedad Listada" : "Listed Property"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="pr-8"
                                data-testid="input-listed-commission"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {language === "es" ? "Por propiedades del catálogo" : "For catalog properties"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="defaultRecruitedPropertyCommission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-amber-600" />
                            {language === "es" ? "Reclutamiento" : "Recruitment"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="pr-8"
                                data-testid="input-recruited-commission"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            {language === "es" ? "Por propiedades reclutadas" : "For recruited properties"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saveProfileMutation.isPending}
                      data-testid="button-save-defaults"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveProfileMutation.isPending 
                        ? (language === "es" ? "Guardando..." : "Saving...")
                        : (language === "es" ? "Guardar" : "Save")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "es" ? "Comisiones por Rol" : "Commissions by Role"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Configura comisiones diferentes según el rol del usuario"
                    : "Configure different commissions based on user role"}
                </CardDescription>
              </div>
              <Dialog open={roleDialogOpen} onOpenChange={(open) => {
                setRoleDialogOpen(open);
                if (!open) {
                  setEditingRoleOverride(null);
                  roleOverrideForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-role-override">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "es" ? "Agregar" : "Add"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRoleOverride 
                        ? (language === "es" ? "Editar Comisión por Rol" : "Edit Role Commission")
                        : (language === "es" ? "Nueva Comisión por Rol" : "New Role Commission")}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "es" 
                        ? "Los campos vacíos usarán los valores predeterminados"
                        : "Empty fields will use default values"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...roleOverrideForm}>
                    <form onSubmit={roleOverrideForm.handleSubmit(onSaveRoleOverride)} className="space-y-4">
                      <FormField
                        control={roleOverrideForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Rol" : "Role"}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!!editingRoleOverride}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder={language === "es" ? "Selecciona un rol" : "Select a role"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(ROLE_LABELS).map(([role, labels]) => (
                                  <SelectItem 
                                    key={role} 
                                    value={role}
                                    disabled={roleOverrides.some(o => o.role === role && !editingRoleOverride)}
                                  >
                                    {labels[language]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 grid-cols-3">
                        <FormField
                          control={roleOverrideForm.control}
                          name="rentalCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Renta %" : "Rental %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleOverrideForm.control}
                          name="listedPropertyCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Listada %" : "Listed %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleOverrideForm.control}
                          name="recruitedPropertyCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Reclut. %" : "Recruit. %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={roleOverrideForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            {language === "es" ? "Cancelar" : "Cancel"}
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={createRoleOverrideMutation.isPending}>
                          {language === "es" ? "Guardar" : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {roleOverridesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : roleOverrides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "es" ? "No hay comisiones por rol configuradas" : "No role commissions configured"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roleOverrides.map((override) => (
                    <div 
                      key={override.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      data-testid={`role-override-${override.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={override.isActive ? "default" : "secondary"}>
                            {getRoleLabel(override.role)}
                          </Badge>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Renta: <strong>{override.rentalCommission || "-"}%</strong></span>
                          <span>Listada: <strong>{override.listedPropertyCommission || "-"}%</strong></span>
                          <span>Reclut.: <strong>{override.recruitedPropertyCommission || "-"}%</strong></span>
                        </div>
                        {override.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{override.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditRoleOverride(override)}
                          data-testid={`button-edit-role-${override.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-delete-role-${override.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "es" ? "¿Eliminar comisión?" : "Delete commission?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "es" 
                                  ? "Esta acción no se puede deshacer. Los usuarios con este rol usarán los valores predeterminados."
                                  : "This action cannot be undone. Users with this role will use default values."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{language === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRoleOverrideMutation.mutate(override.id)}>
                                {language === "es" ? "Eliminar" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  {language === "es" ? "Comisiones por Usuario" : "Commissions by User"}
                </CardTitle>
                <CardDescription>
                  {language === "es" 
                    ? "Configura comisiones específicas para usuarios individuales"
                    : "Configure specific commissions for individual users"}
                </CardDescription>
              </div>
              <Dialog open={userDialogOpen} onOpenChange={(open) => {
                setUserDialogOpen(open);
                if (!open) {
                  setEditingUserOverride(null);
                  userOverrideForm.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-user-override">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "es" ? "Agregar" : "Add"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUserOverride 
                        ? (language === "es" ? "Editar Comisión de Usuario" : "Edit User Commission")
                        : (language === "es" ? "Nueva Comisión de Usuario" : "New User Commission")}
                    </DialogTitle>
                    <DialogDescription>
                      {language === "es" 
                        ? "Los campos vacíos usarán la configuración del rol o valores predeterminados"
                        : "Empty fields will use role configuration or default values"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userOverrideForm}>
                    <form onSubmit={userOverrideForm.handleSubmit(onSaveUserOverride)} className="space-y-4">
                      <FormField
                        control={userOverrideForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Usuario" : "User"}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!!editingUserOverride}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-user">
                                  <SelectValue placeholder={language === "es" ? "Selecciona un usuario" : "Select a user"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {agencyUsers
                                  .filter(u => u.role?.includes('external_agency'))
                                  .map((user) => (
                                    <SelectItem 
                                      key={user.id} 
                                      value={user.id}
                                      disabled={userOverrides.some(o => o.userId === user.id && !editingUserOverride)}
                                    >
                                      {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 grid-cols-3">
                        <FormField
                          control={userOverrideForm.control}
                          name="rentalCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Renta %" : "Rental %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userOverrideForm.control}
                          name="listedPropertyCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Listada %" : "Listed %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userOverrideForm.control}
                          name="recruitedPropertyCommission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{language === "es" ? "Reclut. %" : "Recruit. %"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" min="0" max="100" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 grid-cols-2">
                        <FormField
                          control={userOverrideForm.control}
                          name="effectiveFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === "es" ? "Vigente desde" : "Effective from"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userOverrideForm.control}
                          name="effectiveUntil"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === "es" ? "Vigente hasta" : "Effective until"}</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userOverrideForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "es" ? "Notas" : "Notes"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            {language === "es" ? "Cancelar" : "Cancel"}
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={createUserOverrideMutation.isPending}>
                          {language === "es" ? "Guardar" : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {userOverridesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : userOverrides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "es" ? "No hay comisiones por usuario configuradas" : "No user commissions configured"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOverrides.map((override) => (
                    <div 
                      key={override.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      data-testid={`user-override-${override.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{override.userName || "Usuario"}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRoleLabel(override.userRole || '')}
                          </Badge>
                          {!override.isActive && (
                            <Badge variant="secondary">{language === "es" ? "Inactivo" : "Inactive"}</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Renta: <strong>{override.rentalCommission || "-"}%</strong></span>
                          <span>Listada: <strong>{override.listedPropertyCommission || "-"}%</strong></span>
                          <span>Reclut.: <strong>{override.recruitedPropertyCommission || "-"}%</strong></span>
                        </div>
                        {(override.effectiveFrom || override.effectiveUntil) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "es" ? "Vigencia: " : "Valid: "}
                            {override.effectiveFrom ? format(new Date(override.effectiveFrom), "dd/MM/yyyy") : "∞"}
                            {" - "}
                            {override.effectiveUntil ? format(new Date(override.effectiveUntil), "dd/MM/yyyy") : "∞"}
                          </p>
                        )}
                        {override.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{override.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditUserOverride(override)}
                          data-testid={`button-edit-user-${override.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-delete-user-${override.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "es" ? "¿Eliminar comisión?" : "Delete commission?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "es" 
                                  ? "Esta acción no se puede deshacer. El usuario usará la configuración de su rol o los valores predeterminados."
                                  : "This action cannot be undone. The user will use their role configuration or default values."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{language === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUserOverrideMutation.mutate(override.id)}>
                                {language === "es" ? "Eliminar" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {language === "es" ? "Historial de Cambios" : "Change History"}
              </CardTitle>
              <CardDescription>
                {language === "es" 
                  ? "Registro de todos los cambios en la configuración de comisiones"
                  : "Log of all changes to commission configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "es" ? "No hay historial de cambios" : "No change history"}</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <Accordion type="single" collapsible key={log.id}>
                        <AccordionItem value={log.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <Badge 
                                variant={log.action === "delete" ? "destructive" : log.action === "create" ? "default" : "secondary"}
                              >
                                {getActionLabel(log.action)}
                              </Badge>
                              <span className="text-sm">{getEntityTypeLabel(log.entityType)}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {log.createdAt && format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
                                  locale: language === "es" ? es : undefined,
                                })}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-sm space-y-2 pb-2">
                              <p className="text-muted-foreground">
                                {language === "es" ? "Por: " : "By: "}
                                <span className="text-foreground">{log.changedByName || "Sistema"}</span>
                              </p>
                              {log.previousValues && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {language === "es" ? "Valores anteriores:" : "Previous values:"}
                                  </p>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.previousValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValues && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {language === "es" ? "Nuevos valores:" : "New values:"}
                                  </p>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
