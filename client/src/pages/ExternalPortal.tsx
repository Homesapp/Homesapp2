import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RotateCw, Copy, Check, Search, Filter, Ban, KeyRound, User, Building2, Calendar, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
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

interface PortalToken {
  id: string;
  contractId: string;
  agencyId: string;
  role: 'tenant' | 'owner';
  accessCode: string;
  status: 'active' | 'revoked' | 'expired';
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  tenantName: string | null;
  tenantEmail: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  contractStatus: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  propertyId: string | null;
  unitId: string | null;
}

const ROLE_LABELS = {
  es: { tenant: "Inquilino", owner: "Propietario" },
  en: { tenant: "Tenant", owner: "Owner" },
};

const STATUS_LABELS = {
  es: { active: "Activo", revoked: "Revocado", expired: "Expirado" },
  en: { active: "Active", revoked: "Revoked", expired: "Expired" },
};

export default function ExternalPortal() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PortalToken | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ accessCode: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dateLocale = language === "es" ? es : enUS;

  const { data: tokens = [], isLoading, refetch } = useQuery<PortalToken[]>({
    queryKey: ["/api/external/portal-tokens", roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await fetch(`/api/external/portal-tokens?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tokens");
      return response.json();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await apiRequest("POST", `/api/external/portal-tokens/${tokenId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      setNewCredentials({ accessCode: data.accessCode, password: data.password });
      toast({
        title: language === "es" ? "Contraseña restablecida" : "Password reset",
        description: language === "es" ? "La nueva contraseña se muestra a continuación" : "The new password is shown below",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external/portal-tokens"] });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo restablecer la contraseña" : "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      await apiRequest("DELETE", `/api/external/portal-tokens/${tokenId}`);
    },
    onSuccess: () => {
      setRevokeDialogOpen(false);
      setSelectedToken(null);
      toast({
        title: language === "es" ? "Acceso revocado" : "Access revoked",
        description: language === "es" ? "El token de acceso ha sido desactivado" : "The access token has been deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external/portal-tokens"] });
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" ? "No se pudo revocar el acceso" : "Could not revoke access",
        variant: "destructive",
      });
    },
  });

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(token => 
      token.accessCode.toLowerCase().includes(query) ||
      token.tenantName?.toLowerCase().includes(query) ||
      token.ownerName?.toLowerCase().includes(query) ||
      token.tenantEmail?.toLowerCase().includes(query) ||
      token.ownerEmail?.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedPassword(password);
    setTimeout(() => setCopiedPassword(null), 2000);
  };

  const handleResetPassword = (token: PortalToken) => {
    setSelectedToken(token);
    setNewCredentials(null);
    setShowPassword(false);
    setResetDialogOpen(true);
  };

  const handleRevokeAccess = (token: PortalToken) => {
    setSelectedToken(token);
    setRevokeDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (selectedToken) {
      resetPasswordMutation.mutate(selectedToken.id);
    }
  };

  const confirmRevokeAccess = () => {
    if (selectedToken) {
      revokeTokenMutation.mutate(selectedToken.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'revoked': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'tenant' ? 'outline' : 'secondary';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd MMM yyyy", { locale: dateLocale });
  };

  const activeFiltersCount = [roleFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2" data-testid="text-page-title">
                <KeyRound className="h-5 w-5" />
                {language === "es" ? "Credenciales del Portal" : "Portal Credentials"}
              </CardTitle>
              <CardDescription data-testid="text-page-description">
                {language === "es" 
                  ? "Gestiona las credenciales de acceso al portal de inquilinos y propietarios" 
                  : "Manage access credentials for tenant and owner portals"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "es" ? "Buscar por código, nombre o email..." : "Search by code, name or email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-filters">
                  <Filter className="h-4 w-4" />
                  {language === "es" ? "Filtros" : "Filters"}
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Rol" : "Role"}
                    </label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger data-testid="select-role-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                        <SelectItem value="tenant">{language === "es" ? "Inquilino" : "Tenant"}</SelectItem>
                        <SelectItem value="owner">{language === "es" ? "Propietario" : "Owner"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "es" ? "Estado" : "Status"}
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "es" ? "Todos" : "All"}</SelectItem>
                        <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                        <SelectItem value="revoked">{language === "es" ? "Revocado" : "Revoked"}</SelectItem>
                        <SelectItem value="expired">{language === "es" ? "Expirado" : "Expired"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setRoleFilter("all");
                        setStatusFilter("all");
                      }}
                      data-testid="button-clear-filters"
                    >
                      {language === "es" ? "Limpiar filtros" : "Clear filters"}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <KeyRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2" data-testid="text-empty-state">
                {language === "es" ? "No hay credenciales" : "No credentials"}
              </h3>
              <p className="text-muted-foreground">
                {language === "es" 
                  ? "Las credenciales se crean automáticamente cuando generas acceso al portal desde un contrato de renta activo."
                  : "Credentials are created automatically when you generate portal access from an active rental contract."}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Código de Acceso" : "Access Code"}</TableHead>
                    <TableHead>{language === "es" ? "Rol" : "Role"}</TableHead>
                    <TableHead>{language === "es" ? "Usuario" : "User"}</TableHead>
                    <TableHead>{language === "es" ? "Estado" : "Status"}</TableHead>
                    <TableHead>{language === "es" ? "Último Uso" : "Last Used"}</TableHead>
                    <TableHead>{language === "es" ? "Vence" : "Expires"}</TableHead>
                    <TableHead className="text-right">{language === "es" ? "Acciones" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map((token) => (
                    <TableRow key={token.id} data-testid={`row-token-${token.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono" data-testid={`text-access-code-${token.id}`}>
                            {token.accessCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyCode(token.accessCode)}
                            data-testid={`button-copy-code-${token.id}`}
                          >
                            {copiedCode === token.accessCode ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(token.role)} data-testid={`badge-role-${token.id}`}>
                          {ROLE_LABELS[language][token.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium" data-testid={`text-user-name-${token.id}`}>
                            {token.role === 'tenant' ? token.tenantName : token.ownerName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {token.role === 'tenant' ? token.tenantEmail : token.ownerEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(token.status)} data-testid={`badge-status-${token.id}`}>
                          {STATUS_LABELS[language][token.status]}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-last-used-${token.id}`}>
                        {token.lastUsedAt ? formatDate(token.lastUsedAt) : "-"}
                        {token.usageCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({token.usageCount}x)
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-expires-${token.id}`}>
                        {formatDate(token.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {token.status === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResetPassword(token)}
                                title={language === "es" ? "Restablecer contraseña" : "Reset password"}
                                data-testid={`button-reset-password-${token.id}`}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRevokeAccess(token)}
                                title={language === "es" ? "Revocar acceso" : "Revoke access"}
                                data-testid={`button-revoke-${token.id}`}
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
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

      <Dialog open={resetDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setResetDialogOpen(false);
          setNewCredentials(null);
          setSelectedToken(null);
          setShowPassword(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Restablecer Contraseña" : "Reset Password"}
            </DialogTitle>
            <DialogDescription>
              {newCredentials 
                ? (language === "es" 
                    ? "La contraseña ha sido restablecida. Copia las nuevas credenciales:" 
                    : "The password has been reset. Copy the new credentials:")
                : (language === "es" 
                    ? "¿Estás seguro de que deseas restablecer la contraseña para este acceso?" 
                    : "Are you sure you want to reset the password for this access?")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedToken && !newCredentials && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedToken.role === 'tenant' ? selectedToken.tenantName : selectedToken.ownerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[language][selectedToken.role]} - {selectedToken.accessCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {newCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Código de Acceso" : "Access Code"}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {newCredentials.accessCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyCode(newCredentials.accessCode)}
                  >
                    {copiedCode === newCredentials.accessCode ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "es" ? "Nueva Contraseña" : "New Password"}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {showPassword ? newCredentials.password : "••••••••••••"}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPassword(newCredentials.password)}
                  >
                    {copiedPassword === newCredentials.password ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {language === "es" 
                  ? "Guarda estas credenciales. No podrás ver la contraseña nuevamente."
                  : "Save these credentials. You won't be able to see the password again."}
              </p>
            </div>
          )}

          <DialogFooter>
            {!newCredentials ? (
              <>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button 
                  onClick={confirmResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {language === "es" ? "Restablecer" : "Reset"}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setResetDialogOpen(false);
                setNewCredentials(null);
                setSelectedToken(null);
                setShowPassword(false);
              }}>
                {language === "es" ? "Cerrar" : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "Revocar Acceso" : "Revoke Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? "¿Estás seguro de que deseas revocar este acceso al portal? El usuario ya no podrá iniciar sesión."
                : "Are you sure you want to revoke this portal access? The user will no longer be able to log in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedToken && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {selectedToken.role === 'tenant' ? selectedToken.tenantName : selectedToken.ownerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ROLE_LABELS[language][selectedToken.role]} - {selectedToken.accessCode}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "es" ? "Cancelar" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAccess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeTokenMutation.isPending}
            >
              {revokeTokenMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "es" ? "Revocar" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
