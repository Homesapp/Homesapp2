import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import type { User } from "@shared/schema";
import { useUserAuditHistory, useUpdateUserRole } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  UserIcon, 
  Mail, 
  Briefcase, 
  Calendar, 
  Clock,
  Activity,
  FileText,
  Edit,
  Trash2,
  Plus,
  Eye,
  Shield,
  KeyRound
} from "lucide-react";

const roleLabels: Record<string, string> = {
  master: "Master",
  admin: "Administrador",
  admin_jr: "Administrador Jr",
  seller: "Vendedor",
  owner: "Propietario",
  management: "Management",
  concierge: "Conserje",
  provider: "Proveedor",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const actionLabels: Record<string, string> = {
  create: "Crear",
  update: "Actualizar",
  delete: "Eliminar",
  view: "Ver",
  approve: "Aprobar",
  reject: "Rechazar",
  assign: "Asignar",
};

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  approve: Plus,
  reject: Trash2,
  assign: UserIcon,
};

interface UserProfileDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  const [newRole, setNewRole] = useState<string>("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: auditHistory, isLoading: isLoadingHistory } = useUserAuditHistory(
    user?.id || null,
    100
  );
  const updateUserRole = useUpdateUserRole();
  const { toast } = useToast();
  
  const sendResetLink = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/admin/users/${userId}/send-reset-link`);
    },
    onSuccess: () => {
      toast({
        title: "Enlace enviado",
        description: "El enlace de restablecimiento ha sido enviado al usuario",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el enlace de restablecimiento",
        variant: "destructive",
      });
    },
  });
  
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/approved'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  const canChangeRole = currentUser?.role === "master";

  const availableRoles = [
    { value: "admin", label: "Administrador" },
    { value: "admin_jr", label: "Administrador Jr" },
    { value: "seller", label: "Vendedor" },
    { value: "owner", label: "Propietario" },
    { value: "management", label: "Management" },
    { value: "concierge", label: "Conserje" },
    { value: "provider", label: "Proveedor" },
  ];

  const handleChangeRole = () => {
    if (!newRole || newRole === user.role) {
      toast({
        title: "Error",
        description: "Selecciona un rol diferente al actual",
        variant: "destructive",
      });
      return;
    }
    setShowRoleDialog(true);
  };

  const handleConfirmChangeRole = async () => {
    if (!user || !newRole) return;

    try {
      await updateUserRole.mutateAsync({
        userId: user.id,
        role: newRole,
      });
      
      toast({
        title: "Rol actualizado",
        description: `El rol de ${fullName} ha sido cambiado a ${roleLabels[newRole] || newRole}`,
      });
      
      setShowRoleDialog(false);
      setNewRole("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const formatDetails = (details: unknown): string => {
    if (!details) return "";
    if (typeof details === "string") return details;
    try {
      return JSON.stringify(details);
    } catch {
      return String(details);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]" data-testid="dialog-user-profile">
        <DialogHeader>
          <DialogTitle>Perfil de Usuario</DialogTitle>
          <DialogDescription>
            Información detallada y historial de actividad
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4">
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold" data-testid="text-user-name">
                        {fullName}
                      </h3>
                      <Badge variant="secondary" data-testid="badge-user-role">
                        {roleLabels[user.role] || user.role}
                      </Badge>
                      <Badge 
                        variant={user.status === "approved" ? "default" : user.status === "pending" ? "secondary" : "destructive"}
                        data-testid="badge-user-status"
                      >
                        {statusLabels[user.status] || user.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span data-testid="text-user-email">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Registrado: {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Activity Tabs */}
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Activity className="h-4 w-4 mr-2" />
                  Actividad Reciente
                </TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details">
                  <FileText className="h-4 w-4 mr-2" />
                  Detalles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !auditHistory || auditHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay actividad registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditHistory.map((log) => {
                      const ActionIcon = actionIcons[log.action] || Activity;
                      return (
                        <Card key={log.id} className="hover-elevate">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-primary/10 p-2">
                                <ActionIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {actionLabels[log.action] || log.action}
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {log.entityType}
                                  </span>
                                  {log.entityId && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground font-mono">
                                        ID: {log.entityId.slice(0, 8)}...
                                      </span>
                                    </>
                                  )}
                                </div>
                                {log.details && (
                                  <p className="text-sm text-muted-foreground">
                                    {formatDetails(log.details)}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {format(new Date(log.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {canChangeRole && user.status === "approved" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Gestión de Roles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-role">Cambiar Rol de Usuario</Label>
                        <div className="flex gap-2">
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger id="new-role" data-testid="select-new-role">
                              <SelectValue placeholder="Seleccionar nuevo rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((role) => (
                                <SelectItem 
                                  key={role.value} 
                                  value={role.value}
                                  disabled={role.value === user.role}
                                >
                                  {role.label}
                                  {role.value === user.role && " (Actual)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleChangeRole} 
                            disabled={!newRole || newRole === user.role || updateUserRole.isPending}
                            data-testid="button-change-role"
                          >
                            Cambiar
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          El rol actual es: <span className="font-semibold">{roleLabels[user.role] || user.role}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {(currentUser?.role === "master" || currentUser?.role === "admin") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Acciones Administrativas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Gestionar contraseña y cuenta del usuario</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendResetLink.mutate(user.id)}
                            disabled={sendResetLink.isPending || !user.passwordHash}
                            data-testid="button-send-reset-link"
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            {sendResetLink.isPending ? "Enviando..." : "Enviar Link de Restablecimiento"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={deleteUser.isPending || user.id === currentUser?.id}
                            data-testid="button-delete-user"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Usuario
                          </Button>
                        </div>
                        {!user.passwordHash && (
                          <p className="text-xs text-muted-foreground">
                            Este usuario usa autenticación de terceros. No se puede enviar enlace de restablecimiento.
                          </p>
                        )}
                        {user.id === currentUser?.id && (
                          <p className="text-xs text-muted-foreground">
                            No puedes eliminar tu propia cuenta desde aquí.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                        <span className="text-sm font-medium">{user.firstName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Apellido</span>
                        <span className="text-sm font-medium">{user.lastName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                        <span className="text-sm font-medium truncate ml-4">{user.email || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Rol</span>
                        <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Estado</span>
                        <Badge 
                          variant={user.status === "approved" ? "default" : user.status === "pending" ? "outline" : "destructive"}
                        >
                          {statusLabels[user.status] || user.status}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between py-2">
                        <span className="text-sm font-medium text-muted-foreground">ID</span>
                        <span className="text-xs font-mono break-all text-right ml-4">{user.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Fechas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                      <p className="text-sm">
                        {format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                      <p className="text-sm">
                        {format(new Date(user.updatedAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent data-testid="dialog-confirm-role-change">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar el rol de <span className="font-semibold">{fullName}</span> de{" "}
              <span className="font-semibold">{roleLabels[user.role] || user.role}</span> a{" "}
              <span className="font-semibold">{roleLabels[newRole] || newRole}</span>.
              Esta acción actualizará los permisos y acceso del usuario inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-role-change">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmChangeRole}
              disabled={updateUserRole.isPending}
              data-testid="button-confirm-role-change"
            >
              {updateUserRole.isPending ? "Cambiando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-confirm-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar permanentemente a <span className="font-semibold">{fullName}</span> ({user.email}).
              Esta acción no se puede deshacer y eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos los datos del usuario</li>
                <li>Propiedades asociadas</li>
                <li>Citas y reservas</li>
                <li>Historial de actividad</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-user">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteUser.mutate(user.id)}
              disabled={deleteUser.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-user"
            >
              {deleteUser.isPending ? "Eliminando..." : "Eliminar Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
