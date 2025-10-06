import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Plus, X, UserCog } from "lucide-react";
import type { User, Permission } from "@shared/schema";

const AVAILABLE_PERMISSIONS = [
  { value: "properties:read", label: "Ver Propiedades" },
  { value: "properties:write", label: "Editar Propiedades" },
  { value: "properties:approve", label: "Aprobar Propiedades" },
  { value: "users:read", label: "Ver Usuarios" },
  { value: "users:approve", label: "Aprobar Usuarios" },
  { value: "appointments:read", label: "Ver Citas" },
  { value: "appointments:manage", label: "Gestionar Citas" },
  { value: "leads:read", label: "Ver Leads" },
  { value: "leads:manage", label: "Gestionar Leads" },
  { value: "condominiums:read", label: "Ver Condominios" },
  { value: "condominiums:approve", label: "Aprobar Condominios" },
  { value: "feedback:read", label: "Ver Feedback" },
  { value: "feedback:manage", label: "Gestionar Feedback" },
];

export default function Permissions() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPermission, setNewPermission] = useState<string>("");
  const { toast } = useToast();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter for admin_jr users
  const adminJrUsers = users.filter(user => user.role === "admin_jr");

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: [`/api/users/${selectedUserId}/permissions`],
    enabled: !!selectedUserId,
  });

  const addPermissionMutation = useMutation({
    mutationFn: async (permission: string) => {
      return apiRequest("POST", "/api/permissions", {
        userId: selectedUserId,
        permission,
      });
    },
    onSuccess: () => {
      toast({
        title: "Permiso agregado",
        description: "El permiso ha sido agregado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/permissions`] });
      setShowAddDialog(false);
      setNewPermission("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el permiso",
        variant: "destructive",
      });
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async (permission: string) => {
      return apiRequest("DELETE", "/api/permissions", {
        userId: selectedUserId,
        permission,
      });
    },
    onSuccess: () => {
      toast({
        title: "Permiso eliminado",
        description: "El permiso ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/permissions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el permiso",
        variant: "destructive",
      });
    },
  });

  const handleAddPermission = () => {
    if (!newPermission) {
      toast({
        title: "Error",
        description: "Selecciona un permiso para agregar",
        variant: "destructive",
      });
      return;
    }
    addPermissionMutation.mutate(newPermission);
  };

  const handleRemovePermission = (permission: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el permiso "${getPermissionLabel(permission)}"?`)) {
      removePermissionMutation.mutate(permission);
    }
  };

  const getPermissionLabel = (permissionValue: string) => {
    const found = AVAILABLE_PERMISSIONS.find(p => p.value === permissionValue);
    return found ? found.label : permissionValue;
  };

  const availableToAdd = AVAILABLE_PERMISSIONS.filter(
    p => !permissions.some(perm => perm.permission === p.value)
  );

  const selectedUser = users.find(u => u.id === selectedUserId);

  if (isLoadingUsers) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-permissions">
          <Shield className="w-6 h-6" />
          Gestión de Permisos
        </h1>
        <p className="text-muted-foreground">
          Administra los permisos granulares para usuarios con rol Admin Jr
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Seleccionar Usuario
          </CardTitle>
          <CardDescription>
            Selecciona un usuario Admin Jr para ver y gestionar sus permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="user-select">Usuario Admin Jr</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select" data-testid="select-user">
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {adminJrUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No hay usuarios con rol Admin Jr
                  </div>
                ) : (
                  adminJrUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Permisos de {selectedUser?.firstName} {selectedUser?.lastName}
                </CardTitle>
                <CardDescription>
                  {permissions.length} {permissions.length === 1 ? "permiso asignado" : "permisos asignados"}
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddDialog(true)}
                disabled={availableToAdd.length === 0}
                data-testid="button-add-permission"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Permiso
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando permisos...</div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-permissions">
                  Este usuario no tiene permisos asignados
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                  className="mt-4"
                  data-testid="button-add-first-permission"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar primer permiso
                </Button>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between gap-2 p-3 border rounded-lg hover-elevate"
                    data-testid={`permission-item-${permission.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium truncate" data-testid={`text-permission-${permission.id}`}>
                        {getPermissionLabel(permission.permission)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePermission(permission.permission)}
                      disabled={removePermissionMutation.isPending}
                      data-testid={`button-remove-${permission.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Permission Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-permission">
          <DialogHeader>
            <DialogTitle>Agregar Permiso</DialogTitle>
            <DialogDescription>
              Selecciona un permiso para agregar al usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permission-select">Permiso</Label>
              <Select value={newPermission} onValueChange={setNewPermission}>
                <SelectTrigger id="permission-select" data-testid="select-permission">
                  <SelectValue placeholder="Selecciona un permiso" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((perm) => (
                    <SelectItem key={perm.value} value={perm.value}>
                      {perm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewPermission("");
              }}
              data-testid="button-cancel-add"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPermission}
              disabled={addPermissionMutation.isPending || !newPermission}
              data-testid="button-confirm-add"
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
