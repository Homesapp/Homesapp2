import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, RefreshCcw, Check, AlertTriangle, Home, Building2, Loader2 } from "lucide-react";

interface PortalTokenGeneratorProps {
  contractId: number;
  contractStatus: string;
  propertyTitle?: string;
  tenantName?: string;
  ownerName?: string;
  tenantEmail?: string;
  ownerEmail?: string;
  existingTokens?: {
    tenant?: { portalId: string; createdAt: string };
    owner?: { portalId: string; createdAt: string };
  };
}

interface GeneratedCredentials {
  portalId: string;
  temporaryPassword: string;
  role: "tenant" | "owner";
}

export function PortalTokenGenerator({
  contractId,
  contractStatus,
  propertyTitle,
  tenantName,
  ownerName,
  tenantEmail,
  ownerEmail,
  existingTokens,
}: PortalTokenGeneratorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tenant" | "owner">("tenant");
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const t = (es: string, en: string) => language === "es" ? es : en;

  const isContractActive = contractStatus === "active";

  const generateTokenMutation = useMutation({
    mutationFn: async (role: "tenant" | "owner") => {
      const response = await apiRequest("POST", `/api/external-rental-contracts/${contractId}/portal-tokens`, { role });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCredentials(data);
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${contractId}`] });
      toast({
        title: t("Credenciales Generadas", "Credentials Generated"),
        description: t(
          "Las credenciales del portal se generaron exitosamente. Guarda la contraseña temporal.",
          "Portal credentials were generated successfully. Save the temporary password."
        ),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("Error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async (role: "tenant" | "owner") => {
      const response = await apiRequest("POST", `/api/external-rental-contracts/${contractId}/portal-tokens/regenerate`, { role });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCredentials(data);
      queryClient.invalidateQueries({ queryKey: [`/api/external-rental-contracts/${contractId}`] });
      toast({
        title: t("Contraseña Regenerada", "Password Regenerated"),
        description: t(
          "Se generó una nueva contraseña temporal. La anterior ya no funcionará.",
          "A new temporary password was generated. The previous one will no longer work."
        ),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("Error", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerate = (role: "tenant" | "owner") => {
    setGeneratedCredentials(null);
    generateTokenMutation.mutate(role);
  };

  const handleRegenerate = (role: "tenant" | "owner") => {
    setGeneratedCredentials(null);
    regenerateTokenMutation.mutate(role);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-portal-tokens">
          <Key className="h-4 w-4" />
          {t("Accesos del Portal", "Portal Access")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("Accesos del Portal de Inquilino/Propietario", "Tenant/Owner Portal Access")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Genera credenciales de acceso al portal para inquilinos y propietarios de este contrato.",
              "Generate portal access credentials for tenants and owners of this contract."
            )}
          </DialogDescription>
        </DialogHeader>

        {!isContractActive && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("Contrato Inactivo", "Inactive Contract")}</AlertTitle>
            <AlertDescription>
              {t(
                "Solo se pueden generar credenciales para contratos activos. El portal estará disponible mientras el contrato esté activo.",
                "Credentials can only be generated for active contracts. The portal will be available while the contract is active."
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tenant" | "owner")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tenant" className="gap-2" data-testid="tab-tenant-token">
              <Home className="h-4 w-4" />
              {t("Inquilino", "Tenant")}
            </TabsTrigger>
            <TabsTrigger value="owner" className="gap-2" data-testid="tab-owner-token">
              <Building2 className="h-4 w-4" />
              {t("Propietario", "Owner")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenant" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{tenantName || t("Inquilino", "Tenant")}</CardTitle>
                {tenantEmail && <CardDescription>{tenantEmail}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {existingTokens?.tenant ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("Portal ID:", "Portal ID:")}
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{existingTokens.tenant.portalId}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(existingTokens.tenant!.portalId, "tenant-id")}
                          data-testid="button-copy-tenant-id"
                        >
                          {copiedField === "tenant-id" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      {t("Acceso Configurado", "Access Configured")}
                    </Badge>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleRegenerate("tenant")}
                      disabled={!isContractActive || regenerateTokenMutation.isPending}
                      data-testid="button-regenerate-tenant"
                    >
                      {regenerateTokenMutation.isPending && activeTab === "tenant" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {t("Regenerar Contraseña", "Regenerate Password")}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleGenerate("tenant")}
                    disabled={!isContractActive || generateTokenMutation.isPending}
                    data-testid="button-generate-tenant"
                  >
                    {generateTokenMutation.isPending && activeTab === "tenant" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    {t("Generar Credenciales", "Generate Credentials")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owner" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{ownerName || t("Propietario", "Owner")}</CardTitle>
                {ownerEmail && <CardDescription>{ownerEmail}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {existingTokens?.owner ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("Portal ID:", "Portal ID:")}
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{existingTokens.owner.portalId}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(existingTokens.owner!.portalId, "owner-id")}
                          data-testid="button-copy-owner-id"
                        >
                          {copiedField === "owner-id" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      {t("Acceso Configurado", "Access Configured")}
                    </Badge>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleRegenerate("owner")}
                      disabled={!isContractActive || regenerateTokenMutation.isPending}
                      data-testid="button-regenerate-owner"
                    >
                      {regenerateTokenMutation.isPending && activeTab === "owner" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {t("Regenerar Contraseña", "Regenerate Password")}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleGenerate("owner")}
                    disabled={!isContractActive || generateTokenMutation.isPending}
                    data-testid="button-generate-owner"
                  >
                    {generateTokenMutation.isPending && activeTab === "owner" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    {t("Generar Credenciales", "Generate Credentials")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {generatedCredentials && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700 dark:text-green-300">
              {t("Credenciales Generadas", "Credentials Generated")}
            </AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="text-sm text-green-600 dark:text-green-400">
                {t(
                  "Guarda esta contraseña de forma segura. No se mostrará nuevamente.",
                  "Save this password securely. It will not be shown again."
                )}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-green-700 dark:text-green-300">{t("Portal ID:", "Portal ID:")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedCredentials.portalId}
                      readOnly
                      className="w-48 text-sm"
                      data-testid="input-generated-portal-id"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedCredentials.portalId, "new-id")}
                    >
                      {copiedField === "new-id" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-green-700 dark:text-green-300">{t("Contraseña:", "Password:")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedCredentials.temporaryPassword}
                      readOnly
                      className="w-48 text-sm font-mono"
                      data-testid="input-generated-password"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedCredentials.temporaryPassword, "new-pass")}
                    >
                      {copiedField === "new-pass" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t(
                    "El usuario puede acceder al portal en: /portal",
                    "User can access the portal at: /portal"
                  )}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("Cerrar", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
