import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { 
  Download, 
  User, 
  Home, 
  Calendar, 
  DollarSign, 
  Users, 
  PawPrint,
  Briefcase,
  Globe,
  Phone,
  Mail,
  Clock,
  FileText,
  Zap,
  Droplets,
  Wifi,
  Flame,
  CheckCircle2,
  X,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";

interface OfferData {
  nombreCompleto?: string;
  nacionalidad?: string;
  edad?: number;
  tiempoResidenciaTulum?: string;
  trabajoPosicion?: string;
  companiaTrabaja?: string;
  tieneMascotas?: string;
  petPhotos?: string[];
  ingresoMensualPromedio?: string;
  numeroInquilinos?: number;
  tieneGarante?: string;
  usoInmueble?: "vivienda" | "subarrendamiento";
  rentaOfertada?: number;
  rentasAdelantadas?: number;
  fechaIngreso?: string;
  fechaSalida?: string;
  duracionContrato?: string;
  contractCost?: number;
  securityDeposit?: number;
  serviciosIncluidos?: string;
  serviciosNoIncluidos?: string;
  propertyRequiredServices?: string[];
  offeredServices?: string[];
  pedidoEspecial?: string;
  signature?: string;
  submittedAt?: string;
  clientEmail?: string;
  clientPhone?: string;
}

interface ExternalOfferDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: string;
    propertyTitle?: string;
    propertyAddress?: string;
    condominiumName?: string;
    unitNumber?: string;
    monthlyRent?: number;
    currency?: string;
    offerData?: OfferData;
    createdAt?: string;
    createdByName?: string;
    clientName?: string;
    isUsed?: boolean;
    expiresAt?: string;
    agencyName?: string;
    agencyLogoUrl?: string;
  } | null;
}

const translations = {
  es: {
    title: "OFERTA DE RENTA",
    subtitle: "LARGO PLAZO",
    downloadImage: "Descargar Imagen",
    downloading: "Descargando...",
    downloadSuccess: "Imagen descargada",
    downloadError: "Error al descargar",
    
    date: "Fecha",
    propertyLabel: "PROPIEDAD",
    
    clientProfileSection: "PERFIL DEL CLIENTE",
    offerDetailsSection: "DETALLES DE LA OFERTA",
    
    propertySection: "Propiedad",
    clientSection: "Información del Cliente",
    offerSection: "Detalles de la Oferta",
    servicesSection: "Servicios",
    additionalSection: "Información Adicional",
    
    property: "Propiedad",
    address: "Dirección",
    requestedRent: "Renta Solicitada",
    
    fullName: "Nombre completo",
    nationality: "Nacionalidad",
    age: "Edad",
    residenceTime: "Tiempo de residencia en Tulum",
    occupation: "Trabajo/Posición",
    company: "Compañía para la cual trabaja",
    monthlyIncome: "Ingreso mensual promedio",
    email: "Email",
    phone: "Teléfono",
    
    offeredRent: "Renta ofertada",
    usageType: "Uso para el inmueble",
    usageLiving: "Vivienda",
    usageSublet: "Subarrendamiento",
    contractDuration: "Duración del contrato",
    moveInDate: "Fecha de Ingreso",
    moveOutDate: "Fecha de Salida",
    occupants: "Número de inquilinos",
    advanceRents: "Rentas adelantadas",
    contractCost: "Costo de Contrato",
    securityDeposit: "Depósito de Seguridad",
    needsToSublet: "Necesita subarrendar",
    depositInParts: "Depósito en partes",
    hasGuarantor: "Tiene Aval",
    yes: "Sí",
    no: "No",
    
    clientOffersServices: "Servicios que el Cliente Ofrece Pagar",
    ownerRequiresServices: "Servicios que Requiere el Propietario",
    
    hasPets: "Mascotas",
    petDetails: "Detalles de Mascotas",
    specialRequest: "Pedido Especial",
    signature: "Firma Digital",
    
    submittedAt: "Enviado el",
    createdBy: "Creado por",
    offerStatus: "Estado",
    completed: "Completada",
    pending: "Pendiente",
    expired: "Expirada",
    
    perMonth: "/mes",
    months: "meses",
    years: "años",
    person: "persona",
    people: "personas",
    
    serviceWater: "Agua",
    serviceElectricity: "Electricidad",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Limpieza",
    serviceGardening: "Jardinería",
    serviceMaintenance: "Mantenimiento",
    
    servicesIncluded: "Servicios incluidos en la renta",
    servicesNotIncluded: "Servicios no incluidos en la renta",
    
    generatedBy: "Generado por HomesApp",
    formalClosing: "Por medio de la presente, le hago llegar la oferta de mi cliente, con nuestro carácter de asesores inmobiliarios certificados.",
    sincerely: "Atte.",
    contractCostDisclaimer: "Al presentar esta oferta acepto el cargo de los costos del contrato que ascienden a",
    livingContractCost: "$2,500 pesos mexicanos en contrato para vivir",
    subletContractCost: "$3,800 pesos mexicanos en contrato para subarrendamiento",
    
    noDataAvailable: "Datos pendientes",
    awaitingSubmission: "Esta oferta aún no ha sido completada por el cliente.",
    clientSignature: "Firma del cliente",
    yearsOld: "años",
  },
  en: {
    title: "RENTAL OFFER",
    subtitle: "LONG TERM",
    downloadImage: "Download Image",
    downloading: "Downloading...",
    downloadSuccess: "Image downloaded",
    downloadError: "Download error",
    
    date: "Date",
    propertyLabel: "PROPERTY",
    
    clientProfileSection: "CLIENT PROFILE",
    offerDetailsSection: "OFFER DETAILS",
    
    propertySection: "Property",
    clientSection: "Client Information",
    offerSection: "Offer Details",
    servicesSection: "Services",
    additionalSection: "Additional Information",
    
    property: "Property",
    address: "Address",
    requestedRent: "Requested Rent",
    
    fullName: "Full Name",
    nationality: "Nationality",
    age: "Age",
    residenceTime: "Time of residence in Tulum",
    occupation: "Work/Position",
    company: "Company they work for",
    monthlyIncome: "Average monthly income",
    email: "Email",
    phone: "Phone",
    
    offeredRent: "Offered Rent",
    usageType: "Property Use",
    usageLiving: "Living",
    usageSublet: "Subletting",
    contractDuration: "Contract Duration",
    moveInDate: "Move-in Date",
    moveOutDate: "Move-out Date",
    occupants: "Number of tenants",
    advanceRents: "Advance Rents",
    contractCost: "Contract Cost",
    securityDeposit: "Security Deposit",
    needsToSublet: "Needs to sublet",
    depositInParts: "Deposit in parts",
    hasGuarantor: "Has Guarantor",
    yes: "Yes",
    no: "No",
    
    clientOffersServices: "Services Client Offers to Pay",
    ownerRequiresServices: "Services Required by Owner",
    
    hasPets: "Pets",
    petDetails: "Pet Details",
    specialRequest: "Special Request",
    signature: "Digital Signature",
    
    submittedAt: "Submitted on",
    createdBy: "Created by",
    offerStatus: "Status",
    completed: "Completed",
    pending: "Pending",
    expired: "Expired",
    
    perMonth: "/month",
    months: "months",
    years: "years",
    person: "person",
    people: "people",
    
    serviceWater: "Water",
    serviceElectricity: "Electricity",
    serviceInternet: "Internet",
    serviceGas: "Gas",
    serviceCleaning: "Cleaning",
    serviceGardening: "Gardening",
    serviceMaintenance: "Maintenance",
    
    servicesIncluded: "Services included in rent",
    servicesNotIncluded: "Services not included in rent",
    
    generatedBy: "Generated by HomesApp",
    formalClosing: "By means of this letter, I send you my client's offer, with our character as certified real estate advisors.",
    sincerely: "Sincerely,",
    contractCostDisclaimer: "By submitting this offer, I accept the contract costs which amount to",
    livingContractCost: "$2,500 Mexican pesos for living contract",
    subletContractCost: "$3,800 Mexican pesos for subletting contract",
    
    noDataAvailable: "Pending data",
    awaitingSubmission: "This offer has not yet been completed by the client.",
    clientSignature: "Client Signature",
    yearsOld: "years old",
  }
};

export default function ExternalOfferDetailView({ open, onOpenChange, offer }: ExternalOfferDetailViewProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const t = translations[language as keyof typeof translations] || translations.es;
  const dateLocale = language === "es" ? es : enUS;
  
  if (!offer) return null;
  
  const offerData = offer.offerData || {};
  
  const getOfferStatus = () => {
    if (offer.isUsed) return { label: t.completed, variant: "default" as const };
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) return { label: t.expired, variant: "secondary" as const };
    return { label: t.pending, variant: "outline" as const };
  };
  
  const status = getOfferStatus();
  
  const formatCurrency = (amount: number | undefined, currency: string = "MXN") => {
    if (!amount) return "-";
    return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: dateLocale });
    } catch {
      return dateString;
    }
  };
  
  const getServiceIcon = (service: string) => {
    const lowered = service.toLowerCase();
    if (lowered.includes("agua") || lowered.includes("water")) return <Droplets className="h-4 w-4" />;
    if (lowered.includes("luz") || lowered.includes("electric")) return <Zap className="h-4 w-4" />;
    if (lowered.includes("internet") || lowered.includes("wifi")) return <Wifi className="h-4 w-4" />;
    if (lowered.includes("gas")) return <Flame className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };
  
  const handleDownloadImage = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const mainCanvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
      });
      
      const ctx = mainCanvas.getContext('2d');
      
      if (ctx && offerData.signature) {
        const signatureImg = contentRef.current.querySelector('[data-testid="img-signature"]') as HTMLImageElement;
        if (signatureImg) {
          const rect = signatureImg.getBoundingClientRect();
          const containerRect = contentRef.current.getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) * 2;
          const y = (rect.top - containerRect.top) * 2;
          const width = rect.width * 2;
          const height = rect.height * 2;
          
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, width, height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = offerData.signature!;
          });
        }
      }
      
      if (ctx && offer.agencyLogoUrl) {
        const agencyLogoImg = contentRef.current.querySelector('[data-testid="img-agency-logo"]') as HTMLImageElement;
        if (agencyLogoImg) {
          const rect = agencyLogoImg.getBoundingClientRect();
          const containerRect = contentRef.current.getBoundingClientRect();
          
          const x = (rect.left - containerRect.left) * 2;
          const y = (rect.top - containerRect.top) * 2;
          const width = rect.width * 2;
          const height = rect.height * 2;
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, width, height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = offer.agencyLogoUrl!;
          });
        }
      }
      
      const link = document.createElement("a");
      link.download = `oferta-${offer.unitNumber || offer.id}.png`;
      link.href = mainCanvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: t.downloadSuccess,
        description: `oferta-${offer.unitNumber || offer.id}.png`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: t.downloadError,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const propertyTitle = offer.condominiumName && offer.unitNumber 
    ? `${offer.condominiumName} - ${offer.unitNumber}`
    : offer.propertyTitle || "Propiedad";

  const agencyName = offer.agencyName || "Tulum Rental Homes";
  const displayDate = offerData.submittedAt 
    ? formatDate(offerData.submittedAt) 
    : offer.createdAt 
      ? formatDate(offer.createdAt) 
      : formatDate(new Date().toISOString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between gap-2">
          <DialogTitle className="text-lg font-semibold">{t.title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} data-testid="badge-status">{status.label}</Badge>
            <Button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              size="sm"
              data-testid="button-download-offer-image"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? t.downloading : t.downloadImage}
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div ref={contentRef} className="bg-white p-8" data-testid="offer-detail-content">
            {/* PDF-Style Header */}
            <div className="flex items-start justify-between mb-6">
              {/* Left: Logos with names */}
              <div className="flex items-start gap-6">
                {/* HomesApp Logo + Slogan */}
                <div className="flex flex-col items-center">
                  <img src={logoPath} alt="HomesApp" className="h-16 object-contain" crossOrigin="anonymous" />
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Smart Real Estate</p>
                </div>
                
                {/* Agency Logo + Name */}
                <div className="flex flex-col items-center">
                  {offer.agencyLogoUrl ? (
                    <img 
                      src={offer.agencyLogoUrl} 
                      alt={agencyName} 
                      className="h-16 object-contain" 
                      crossOrigin="anonymous"
                      data-testid="img-agency-logo"
                    />
                  ) : (
                    <div className="h-16 flex items-center justify-center px-4 border rounded-lg bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">{agencyName}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{agencyName}</p>
                </div>
              </div>
              
              {/* Right: Date and Property */}
              <div className="text-right border-2 border-gray-300 rounded-lg p-3 min-w-[180px]">
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground uppercase">{t.date}</p>
                  <p className="font-semibold text-sm" data-testid="text-offer-date">{displayDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{t.propertyLabel}</p>
                  <p className="font-bold text-primary text-sm" data-testid="text-property-name">{propertyTitle}</p>
                </div>
              </div>
            </div>

            {/* Title Banner */}
            <div className="text-center mb-6 py-3 border-y-2 border-primary/30">
              <h1 className="text-2xl font-bold text-primary tracking-wide" data-testid="text-title">{t.title}</h1>
              <p className="text-sm text-muted-foreground tracking-widest">{t.subtitle}</p>
            </div>

            {/* Two-Column Layout: Client Profile | Offer Details */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Left Column: Client Profile */}
              <div data-testid="section-client-profile">
                <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.clientProfileSection}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.fullName}:</span>
                    <span className="font-medium text-right" data-testid="text-full-name">{offerData.nombreCompleto || offer.clientName || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.nationality}:</span>
                    <span className="font-medium" data-testid="text-nationality">{offerData.nacionalidad || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.age}:</span>
                    <span className="font-medium" data-testid="text-age">{offerData.edad ? `${offerData.edad} ${t.yearsOld}` : "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.residenceTime}:</span>
                    <span className="font-medium" data-testid="text-residence">{offerData.tiempoResidenciaTulum || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.occupation}:</span>
                    <span className="font-medium" data-testid="text-occupation">{offerData.trabajoPosicion || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.company}:</span>
                    <span className="font-medium text-right max-w-[150px] truncate" data-testid="text-company">{offerData.companiaTrabaja || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.hasPets}:</span>
                    <span className="font-medium" data-testid="text-pets">
                      {offerData.tieneMascotas 
                        ? (offerData.tieneMascotas === "si" || offerData.tieneMascotas === "yes" 
                          ? (offerData.tieneMascotas.length > 2 ? offerData.tieneMascotas : t.yes) 
                          : t.no)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.monthlyIncome}:</span>
                    <span className="font-medium" data-testid="text-income">{offerData.ingresoMensualPromedio || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.occupants}:</span>
                    <span className="font-medium" data-testid="text-occupants">{offerData.numeroInquilinos || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.hasGuarantor}:</span>
                    <span className="font-medium" data-testid="text-guarantor">
                      {offerData.tieneGarante 
                        ? (offerData.tieneGarante === "si" || offerData.tieneGarante === "yes" ? t.yes : t.no)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">{t.usageType}:</span>
                    <span className="font-medium" data-testid="text-usage">
                      {offerData.usoInmueble 
                        ? (offerData.usoInmueble === "vivienda" ? t.usageLiving : t.usageSublet)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Offer Details */}
              <div data-testid="section-offer-details">
                <h2 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide border-b pb-1">{t.offerDetailsSection}</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.offeredRent}:</span>
                    <span className="font-bold text-green-600" data-testid="text-offered-rent">
                      {offerData.rentaOfertada ? formatCurrency(offerData.rentaOfertada, offer.currency) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.advanceRents}:</span>
                    <span className="font-medium" data-testid="text-advance-rents">
                      {offerData.rentasAdelantadas ? `${offerData.rentasAdelantadas} ${t.months}` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.securityDeposit}:</span>
                    <span className="font-medium" data-testid="text-deposit">
                      {offerData.securityDeposit ? `${offerData.securityDeposit} ${t.months}` : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.moveInDate}:</span>
                    <span className="font-medium" data-testid="text-move-in">{offerData.fechaIngreso ? formatDate(offerData.fechaIngreso) : "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.contractDuration}:</span>
                    <span className="font-medium" data-testid="text-duration">{offerData.duracionContrato || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.contractCost}:</span>
                    <span className="font-medium" data-testid="text-contract-cost">
                      {offerData.contractCost ? formatCurrency(offerData.contractCost, "MXN") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span className="text-muted-foreground">{t.needsToSublet}:</span>
                    <span className="font-medium" data-testid="text-sublet">
                      {offerData.usoInmueble === "subarrendamiento" ? t.yes : t.no}
                    </span>
                  </div>
                  
                  {/* Services */}
                  <div className="pt-2">
                    <p className="text-muted-foreground mb-1">{t.servicesIncluded}:</p>
                    <p className="font-medium text-xs" data-testid="text-services-included">
                      {offerData.serviciosIncluidos || 
                       (offerData.offeredServices && offerData.offeredServices.length > 0 
                         ? offerData.offeredServices.join(", ") 
                         : "-")}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-dotted">
                    <p className="text-muted-foreground mb-1">{t.servicesNotIncluded}:</p>
                    <p className="font-medium text-xs" data-testid="text-services-excluded">
                      {offerData.serviciosNoIncluidos || 
                       (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0 
                         ? offerData.propertyRequiredServices.join(", ") 
                         : "-")}
                    </p>
                  </div>
                  
                  {/* Special Request */}
                  {offerData.pedidoEspecial && (
                    <div className="pt-2 border-t border-dotted">
                      <p className="text-muted-foreground mb-1">{t.specialRequest}:</p>
                      <p className="font-medium text-xs bg-gray-50 p-2 rounded" data-testid="text-special-request">
                        {offerData.pedidoEspecial}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Cost Disclaimer */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs text-center text-muted-foreground border">
              <p>*{t.contractCostDisclaimer} {offerData.usoInmueble === "subarrendamiento" ? t.subletContractCost : t.livingContractCost}.</p>
            </div>

            {/* Signature and Closing */}
            <div className="grid grid-cols-2 gap-6 items-end">
              {/* Left: Signature */}
              <div className="text-center" data-testid="section-signature">
                <p className="text-xs text-muted-foreground mb-2">{t.clientSignature}</p>
                {offerData.signature ? (
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white inline-block w-[200px] h-[80px] flex items-center justify-center">
                    <img 
                      src={offerData.signature} 
                      alt="Signature" 
                      className="max-h-[64px] max-w-full object-contain"
                      crossOrigin="anonymous"
                      data-testid="img-signature"
                    />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-400 w-[200px] mx-auto h-[80px]"></div>
                )}
              </div>

              {/* Right: Formal Closing */}
              <div className="text-right text-sm" data-testid="section-closing">
                <p className="italic text-muted-foreground mb-3">{t.formalClosing}</p>
                <p className="font-semibold">{t.sincerely} {agencyName} ™</p>
              </div>
            </div>

            {/* Footer */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-xs text-muted-foreground" data-testid="section-footer">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t.generatedBy}
              </div>
              {offer.createdByName && (
                <div data-testid="text-created-by">
                  {t.createdBy}: {offer.createdByName}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
