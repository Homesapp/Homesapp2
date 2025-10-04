import { useState } from "react";
import { UserApprovalCard } from "@/components/UserApprovalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus, CheckCircle, Loader2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePendingUsers, useApproveUser, useRejectUser, useApproveAllUsers } from "@/hooks/useUsers";
import { format } from "date-fns";

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

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const { user: currentUser } = useAuth();
  const { data: pendingUsers = [], isLoading, error } = usePendingUsers();
  const { toast } = useToast();
  
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const approveAllUsers = useApproveAllUsers();

  const handleApprove = async (userId: string, userName: string) => {
    try {
      await approveUser.mutateAsync(userId);
      toast({
        title: "Usuario aprobado",
        description: `${userName} ha sido aprobado exitosamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    try {
      await rejectUser.mutateAsync(userId);
      toast({
        title: "Usuario rechazado",
        description: `${userName} ha sido rechazado.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    try {
      const result = await approveAllUsers.mutateAsync();
      toast({
        title: "Usuarios aprobados",
        description: `Se aprobaron ${result.count} usuarios exitosamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron aprobar todos los usuarios",
        variant: "destructive",
      });
    }
  };

  const filterUsers = (users: typeof pendingUsers) => {
    if (!searchQuery) return users;
    return users.filter(
      (user) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      }
    );
  };

  const formatUserForCard = (user: typeof pendingUsers[0]) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
    const roleLabel = roleLabels[user.role] || user.role;
    const requestDate = format(new Date(user.createdAt), "dd MMM yyyy");

    return {
      id: user.id,
      name: fullName,
      email: user.email || "",
      role: roleLabel,
      requestDate,
      avatar: user.profileImageUrl || undefined,
    };
  };

  const canApproveUsers = currentUser && ["master", "admin"].includes(currentUser.role);
  const isMaster = currentUser?.role === "master";

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar los usuarios: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Aprueba usuarios y gestiona permisos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canApproveUsers && pendingUsers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  data-testid="button-approve-all"
                  disabled={approveAllUsers.isPending}
                >
                  {approveAllUsers.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprobar Todos ({pendingUsers.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Aprobar todos los usuarios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Estás a punto de aprobar {pendingUsers.length} usuarios pendientes.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApproveAll}>
                    Aprobar Todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isMaster && (
            <Button data-testid="button-create-admin-user">
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario Admin
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending-users">
            Pendientes ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved-users">
            Aprobados (0)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterUsers(pendingUsers).map((user) => {
                  const cardData = formatUserForCard(user);
                  return (
                    <UserApprovalCard
                      key={user.id}
                      {...cardData}
                      onApprove={
                        canApproveUsers
                          ? () => handleApprove(user.id, cardData.name)
                          : undefined
                      }
                      onReject={
                        canApproveUsers
                          ? () => handleReject(user.id, cardData.name)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              {filterUsers(pendingUsers).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron usuarios que coincidan con la búsqueda"
                    : "No hay usuarios pendientes de aprobación"}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Funcionalidad de usuarios aprobados en desarrollo
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
