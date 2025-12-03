import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bed, Bath, Square, MapPin, Eye, Edit, Calendar, Trash2, Droplet, Zap, Wifi, PawPrint, Building2, CheckCircle, XCircle, Flame, Trees, Waves } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type IncludedServices = {
  basicServices?: {
    water?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    electricity?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
    internet?: {
      included: boolean;
      provider?: string;
      cost?: string;
    };
  };
  additionalServices?: Array<{
    type: "pool_cleaning" | "garden" | "gas";
    provider?: string;
    cost?: string;
  }>;
  hoaMaintenance?: boolean; // Mantenimiento condominal incluido
};

export type PropertyCardProps = {
  id: string;
  title: string;
  customListingTitle?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  colonyName?: string;
  condoName?: string;
  unitNumber?: string;
  showCondoInListing?: boolean;
  showUnitNumberInListing?: boolean;
  status: "rent" | "sale" | "both";
  image?: string;
  petFriendly?: boolean;
  includedServices?: IncludedServices;
  externalAgencyName?: string | null;
  externalAgencyLogoUrl?: string | null;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSchedule?: () => void;
  showActions?: boolean;
};

export function PropertyCard({
  title,
  customListingTitle,
  price,
  salePrice,
  currency = "MXN",
  bedrooms,
  bathrooms,
  area,
  location,
  colonyName,
  condoName,
  unitNumber,
  showCondoInListing = true,
  showUnitNumberInListing = true,
  status,
  image,
  petFriendly = false,
  includedServices,
  externalAgencyName,
  externalAgencyLogoUrl,
  onView,
  onEdit,
  onDelete,
  onSchedule,
  showActions = true,
}: PropertyCardProps) {
  const { t } = useLanguage();
  
  const statusLabels = {
    rent: t("property.status.rent"),
    sale: t("property.status.sale"),
    both: t("property.status.both"),
  };

  const statusVariants = {
    rent: "default" as const,
    sale: "secondary" as const,
    both: "outline" as const,
  };

  // Construct display title
  const displayTitle = customListingTitle || title;

  // Construct display location: "Colony, Tulum" or fallback to location
  const displayLocation = colonyName ? `${colonyName}, Tulum` : location;

  // Construct condo/unit display
  const condoUnitParts: string[] = [];
  if (showCondoInListing && condoName) {
    condoUnitParts.push(condoName);
  }
  if (showUnitNumberInListing && unitNumber) {
    condoUnitParts.push(`#${unitNumber}`);
  }
  const condoUnitDisplay = condoUnitParts.length > 0 ? condoUnitParts.join(" ") : null;

  return (
    <Card className="overflow-hidden hover-elevate">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Square className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
        {externalAgencyName && (
          <div className="absolute bottom-2 left-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={externalAgencyLogoUrl || undefined} alt={externalAgencyName} />
                    <AvatarFallback className="text-[10px]">
                      <Building2 className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate max-w-[100px]">{externalAgencyName}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("property.listedBy")}: {externalAgencyName}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      
      <CardHeader className="gap-1 space-y-0 pb-2">
        <h3 className="font-semibold text-lg line-clamp-2" title={displayTitle}>{displayTitle}</h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span>{displayLocation}</span>
          </div>
          {condoUnitDisplay && (
            <div className="text-xs text-muted-foreground pl-4">
              {condoUnitDisplay}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {status === "both" && salePrice ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ${price.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-primary">{currency}</span>
              <span className="text-sm font-normal text-muted-foreground">{t("property.perMonth")}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-muted-foreground">
                {t("property.saleLabel")} ${salePrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
            </div>
          </div>
        ) : status === "sale" && salePrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${salePrice.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-primary">{currency}</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${price.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-primary">{currency}</span>
            {status === "rent" && <span className="text-sm font-normal text-muted-foreground">{t("property.perMonth")}</span>}
          </div>
        )}
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span>{bathrooms}</span>
          </div>
          {area > 0 && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span>{area} m²</span>
            </div>
          )}
          {petFriendly && (
            <div className="flex items-center gap-1" title={t("property.petFriendly")} data-testid="indicator-pet-friendly">
              <PawPrint className="h-4 w-4 text-black dark:text-white" />
            </div>
          )}
        </div>

        {/* Servicios Incluidos y No Incluidos - Solo iconos */}
        {includedServices && (
          <div className="pt-2 border-t space-y-1">
            {/* Incluido */}
            {(includedServices?.hoaMaintenance || 
              includedServices?.basicServices?.water?.included || 
              includedServices?.basicServices?.electricity?.included || 
              includedServices?.basicServices?.internet?.included ||
              includedServices?.additionalServices?.some(s => s.type)) && (
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t("property.included") || "Incluido"}</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-1.5">
                  {includedServices?.hoaMaintenance && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Building2 className="h-3.5 w-3.5 text-green-600" data-testid="service-hoa-icon" />
                      </TooltipTrigger>
                      <TooltipContent>{t("property.hoaIncluded") || "Mantenimiento HOA"}</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.basicServices?.water?.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Droplet className="h-3.5 w-3.5 text-blue-500" data-testid="service-water-icon" />
                      </TooltipTrigger>
                      <TooltipContent>{t("property.serviceWater") || "Agua"}</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.basicServices?.electricity?.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Zap className="h-3.5 w-3.5 text-yellow-500" data-testid="service-electricity-icon" />
                      </TooltipTrigger>
                      <TooltipContent>{t("property.serviceElectricity") || "Luz"}</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.basicServices?.internet?.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Wifi className="h-3.5 w-3.5 text-purple-500" data-testid="service-internet-icon" />
                      </TooltipTrigger>
                      <TooltipContent>Internet</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.additionalServices?.map((service, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        {service.type === "pool_cleaning" ? (
                          <Waves className="h-3.5 w-3.5 text-cyan-500" />
                        ) : service.type === "garden" ? (
                          <Trees className="h-3.5 w-3.5 text-green-500" />
                        ) : service.type === "gas" ? (
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                        ) : null}
                      </TooltipTrigger>
                      <TooltipContent>
                        {service.type === "pool_cleaning" ? (t("property.poolCleaning") || "Limpieza de alberca") :
                         service.type === "garden" ? (t("property.garden") || "Jardinería") :
                         service.type === "gas" ? (t("property.gas") || "Gas") : service.type}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            
            {/* No Incluido */}
            {(includedServices?.basicServices?.water && !includedServices.basicServices.water.included ||
              includedServices?.basicServices?.electricity && !includedServices.basicServices.electricity.included ||
              includedServices?.basicServices?.internet && !includedServices.basicServices.internet.included) && (
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t("property.notIncluded") || "No incluido"}</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-1.5 opacity-50">
                  {includedServices?.basicServices?.water && !includedServices.basicServices.water.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Droplet className="h-3.5 w-3.5 text-muted-foreground" data-testid="service-water-not-icon" />
                      </TooltipTrigger>
                      <TooltipContent>{t("property.serviceWater") || "Agua"} - {t("property.notIncluded") || "No incluido"}</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.basicServices?.electricity && !includedServices.basicServices.electricity.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" data-testid="service-electricity-not-icon" />
                      </TooltipTrigger>
                      <TooltipContent>{t("property.serviceElectricity") || "Luz"} - {t("property.notIncluded") || "No incluido"}</TooltipContent>
                    </Tooltip>
                  )}
                  {includedServices?.basicServices?.internet && !includedServices.basicServices.internet.included && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Wifi className="h-3.5 w-3.5 text-muted-foreground" data-testid="service-internet-not-icon" />
                      </TooltipTrigger>
                      <TooltipContent>Internet - {t("property.notIncluded") || "No incluido"}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onView}
            data-testid="button-view-property"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("property.viewButton")}
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onEdit}
              data-testid="button-edit-property"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t("property.editButton")}
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              data-testid="button-delete-property"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t("property.deleteButton")}
            </Button>
          )}
          {onSchedule && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onSchedule}
              data-testid="button-schedule-appointment"
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("property.scheduleButton")}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
