import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, User, Home, MapPin, Globe, MessageSquare } from "lucide-react";
import type { ClientReferral, OwnerReferral } from "@shared/schema";
import { format } from "date-fns";

interface ReferralsListProps {
  type: "client" | "owner";
  referrals: ClientReferral[] | OwnerReferral[];
}

const statusLabels: Record<string, { es: string; en: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente_confirmacion: { es: "Pendiente Confirmación", en: "Pending Confirmation", variant: "secondary" },
  confirmado: { es: "Confirmado", en: "Confirmed", variant: "default" },
  en_revision: { es: "En Revisión", en: "Under Review", variant: "default" },
  seleccion_propiedad: { es: "Selección de Propiedad", en: "Property Selection", variant: "default" },
  proceso_renta: { es: "Proceso de Renta", en: "Rental Process", variant: "default" },
  contactado: { es: "Contactado", en: "Contacted", variant: "default" },
  propiedad_agregada: { es: "Propiedad Agregada", en: "Property Added", variant: "default" },
  completado: { es: "Completado", en: "Completed", variant: "default" },
  cancelado: { es: "Cancelado", en: "Cancelled", variant: "destructive" },
};

export function ReferralsList({ type, referrals }: ReferralsListProps) {
  const { t, language } = useLanguage();

  if (referrals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-secondary-foreground mb-4" />
          <p className="text-secondary-foreground text-center">
            {type === "client"
              ? t("referrals.noClientReferrals", "No tienes referidos de clientes aún")
              : t("referrals.noOwnerReferrals", "No tienes referidos de propietarios aún")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {referrals.map((referral) => {
        const status = referral.status;
        const statusInfo = statusLabels[status] || { es: status, en: status, variant: "outline" as const };
        const isOwner = type === "owner";

        return (
          <Card key={referral.id} className="hover-elevate" data-testid={`card-referral-${referral.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate" data-testid="text-referral-name">
                    {referral.firstName} {referral.lastName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("referrals.createdOn", "Creado el")} {format(new Date(referral.createdAt), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
                <Badge variant={statusInfo.variant} data-testid="badge-status">
                  {language === "es" ? statusInfo.es : statusInfo.en}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                <span className="truncate" data-testid="text-email">{referral.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                <span data-testid="text-phone">{referral.phone}</span>
              </div>

              {isOwner && (
                <>
                  {"nationality" in referral && referral.nationality && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-nationality">{referral.nationality}</span>
                    </div>
                  )}

                  {"whatsappNumber" in referral && referral.whatsappNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-whatsapp">{referral.whatsappNumber}</span>
                    </div>
                  )}

                  {"propertyType" in referral && referral.propertyType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span data-testid="text-property-type">
                        {t(`propertyTypes.${referral.propertyType}`, referral.propertyType)}
                      </span>
                    </div>
                  )}

                  {("condoName" in referral && referral.condoName) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <span className="truncate" data-testid="text-condo">
                        {referral.condoName}
                        {referral.unitNumber && ` - ${t("referrals.unit", "Unidad")} ${referral.unitNumber}`}
                      </span>
                    </div>
                  )}
                </>
              )}

              {referral.commissionEarned && parseFloat(referral.commissionEarned) > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary-foreground">
                      {t("referrals.commissionEarned", "Comisión ganada")}:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400" data-testid="text-commission">
                      ${parseFloat(referral.commissionEarned).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
