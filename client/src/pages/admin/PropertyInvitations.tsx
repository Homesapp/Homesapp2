import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { PropertyInviteDialog } from "@/components/PropertyInviteDialog";
import {
  Copy,
  Check,
  Link2,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface PropertyInvitationToken {
  id: string;
  token: string;
  inviteUrl: string;
  inviteeName: string | null;
  inviteeEmail: string | null;
  inviteePhone: string | null;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  status: "pending" | "used" | "expired";
  propertyDraftId: string | null;
  notes: string | null;
}

export default function PropertyInvitations() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { data: tokens, isLoading, refetch } = useQuery<PropertyInvitationToken[]>({
    queryKey: ["/api/admin/property-tokens"],
  });

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast({
      title: t("copied") || "Copiado",
      description: t("linkCopied") || "El link se ha copiado al portapapeles",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800" data-testid="status-pending">
            <Clock className="w-3 h-3 mr-1" />
            {t("pending") || "Pendiente"}
          </Badge>
        );
      case "used":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800" data-testid="status-used">
            <Check className="w-3 h-3 mr-1" />
            {t("used") || "Usado"}
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800" data-testid="status-expired">
            <Calendar className="w-3 h-3 mr-1" />
            {t("expired") || "Expirado"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", {
      locale: language === "es" ? es : enUS,
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === "es" ? es : enUS,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" data-testid="page-property-invitations">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-title">
            {t("propertyInvitations") || "Invitaciones de Propiedades"}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-description">
            {t("propertyInvitationsDescription") || "Gestiona los links de invitación para que propietarios suban sus propiedades"}
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="gap-2"
          data-testid="button-generate-new-invitation"
        >
          <Plus className="w-4 h-4" />
          {t("generateNewLink") || "Generar Nuevo Link"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {t("invitationTokens") || "Tokens de Invitación"}
          </CardTitle>
          <CardDescription>
            {t("invitationTokensDescription") || "Todos los links generados, su estado y acciones disponibles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokens || tokens.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("noInvitations") || "No hay invitaciones generadas"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowInviteDialog(true)}
                data-testid="button-generate-first"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("generateFirstLink") || "Generar primer link"}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-owner">{t("owner") || "Propietario"}</TableHead>
                    <TableHead data-testid="header-contact">{t("contact") || "Contacto"}</TableHead>
                    <TableHead data-testid="header-created">{t("created") || "Creado"}</TableHead>
                    <TableHead data-testid="header-expires">{t("expires") || "Expira"}</TableHead>
                    <TableHead data-testid="header-status">{t("status") || "Estado"}</TableHead>
                    <TableHead data-testid="header-actions" className="text-right">{t("actions") || "Acciones"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id} data-testid={`token-row-${token.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`owner-name-${token.id}`}>
                            {token.inviteeName || t("notSpecified") || "No especificado"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {token.inviteeEmail && (
                            <div className="flex items-center gap-1 text-sm" data-testid={`email-${token.id}`}>
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{token.inviteeEmail}</span>
                            </div>
                          )}
                          {token.inviteePhone && (
                            <div className="flex items-center gap-1 text-sm" data-testid={`phone-${token.id}`}>
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{token.inviteePhone}</span>
                            </div>
                          )}
                          {!token.inviteeEmail && !token.inviteePhone && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" data-testid={`created-${token.id}`}>
                          <div>{formatDate(token.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(token.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" data-testid={`expires-${token.id}`}>
                          <div>{formatDate(token.expiresAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(token.expiresAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(token.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(token.inviteUrl, token.id)}
                            disabled={token.status === "used"}
                            data-testid={`button-copy-${token.id}`}
                          >
                            {copiedId === token.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          {token.inviteePhone && token.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const message = encodeURIComponent(
                                  `Hola${token.inviteeName ? ` ${token.inviteeName}` : ''}! Te comparto este link para que puedas subir tu propiedad a nuestra plataforma. El link expira en 24 horas:\n\n${token.inviteUrl}`
                                );
                                window.open(`https://wa.me/${token.inviteePhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                              }}
                              className="gap-1"
                              data-testid={`button-whatsapp-${token.id}`}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(token.inviteUrl, '_blank')}
                            disabled={token.status === "used" || token.status === "expired"}
                            data-testid={`button-open-${token.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
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

      <PropertyInviteDialog
        open={showInviteDialog}
        onOpenChange={(open) => {
          setShowInviteDialog(open);
          if (!open) {
            refetch();
          }
        }}
      />
    </div>
  );
}
