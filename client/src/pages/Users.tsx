import { useState } from "react";
import { UserApprovalCard } from "@/components/UserApprovalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, CheckCircle } from "lucide-react";
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

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const pendingUsers = [
    {
      id: "1",
      name: "Laura Martínez",
      email: "laura.martinez@example.com",
      role: "Propietario",
      requestDate: "10 Oct 2025",
    },
    {
      id: "2",
      name: "Pedro Ramírez",
      email: "pedro.ramirez@example.com",
      role: "Management",
      requestDate: "11 Oct 2025",
    },
    {
      id: "3",
      name: "Sofia García",
      email: "sofia.garcia@example.com",
      role: "Conserje",
      requestDate: "12 Oct 2025",
    },
    {
      id: "4",
      name: "Miguel Torres",
      email: "miguel.torres@example.com",
      role: "Proveedor",
      requestDate: "13 Oct 2025",
    },
  ];

  const approvedUsers = [
    {
      id: "5",
      name: "Carlos Admin",
      email: "carlos@example.com",
      role: "Administrador",
      requestDate: "1 Oct 2025",
    },
    {
      id: "6",
      name: "Ana Seller",
      email: "ana@example.com",
      role: "Vendedor",
      requestDate: "5 Oct 2025",
    },
  ];

  const filterUsers = (users: typeof pendingUsers) => {
    if (!searchQuery) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

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
          {pendingUsers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="button-approve-all">
                  <CheckCircle className="h-4 w-4 mr-2" />
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
                  <AlertDialogAction onClick={() => console.log("Aprobar todos")}>
                    Aprobar Todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button data-testid="button-create-admin-user">
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario Admin
          </Button>
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
            Aprobados ({approvedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterUsers(pendingUsers).map((user) => (
              <UserApprovalCard
                key={user.id}
                {...user}
                onApprove={() => console.log("Aprobar usuario", user.id)}
                onReject={() => console.log("Rechazar usuario", user.id)}
              />
            ))}
          </div>
          {filterUsers(pendingUsers).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay usuarios pendientes de aprobación
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterUsers(approvedUsers).map((user) => (
              <UserApprovalCard
                key={user.id}
                {...user}
                onApprove={undefined}
                onReject={() => console.log("Desactivar usuario", user.id)}
              />
            ))}
          </div>
          {filterUsers(approvedUsers).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay usuarios aprobados
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
