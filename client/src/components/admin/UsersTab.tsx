import { useState } from "react";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApprovedUsers } from "@/hooks/useUsers";
import type { User } from "@shared/schema";

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

export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: approvedUsers = [], isLoading: isLoadingApproved, error: errorApproved } = useApprovedUsers();
  const { toast } = useToast();

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const filterUsers = (users: typeof approvedUsers) => {
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

  if (errorApproved) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar los usuarios: {errorApproved.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Usuarios del Sistema</h2>
          <p className="text-muted-foreground">
            Ver información de usuarios y sus tarjetas de presentación
          </p>
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

      <div className="mt-6">
        {isLoadingApproved ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterUsers(approvedUsers).map((user) => {
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario";
                const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
                const roleLabel = roleLabels[user.role] || user.role;
                
                return (
                  <Card 
                    key={user.id} 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => handleViewProfile(user)}
                    data-testid={`card-user-${user.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImageUrl || undefined} alt={fullName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-semibold truncate" data-testid={`text-user-name-${user.id}`}>
                            {fullName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" data-testid={`badge-user-role-${user.id}`}>
                              {roleLabel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filterUsers(approvedUsers).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? "No se encontraron usuarios que coincidan con la búsqueda"
                  : "No hay usuarios aprobados"}
              </div>
            )}
          </>
        )}
      </div>

      <UserProfileDialog 
        user={selectedUser}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
}
