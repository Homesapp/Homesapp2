import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Building2, Home, Loader2, ChevronLeft, ChevronRight, ChevronDown, User, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  es: {
    pageTitle: "Registro de Lead para Brokers",
    pageDescription: "Comparte información básica de tu cliente para verificar disponibilidad",
    smartRealEstate: "Smart Real Estate",
    commissionTermsTitle: "Términos de Comisión para Brokers",
    commissionIntro: "Al registrar un lead, acepto los siguientes términos:",
    commission50: "50% de comisión",
    commission50Desc: "si la propiedad rentada no tiene vendedor referido",
    commission40: "40% de comisión",
    commission40Desc: "si la propiedad rentada tiene un vendedor referido",
    commissionNote: "El 10% de comisión del vendedor referido es cubierto por la agencia, no se descuenta de tu comisión.",
    acceptTerms: "Acepto los términos de comisión y entiendo que mi pago dependerá de si la propiedad tiene referido.",
    referralLink: "Link de referido:",
    step1Title: "Información del Cliente",
    step1Desc: "Datos de contacto",
    step2Title: "Detalles de Búsqueda",
    step2Desc: "Preferencias de propiedad",
    firstName: "Nombre del Cliente",
    lastName: "Apellido del Cliente",
    email: "Correo Electrónico",
    emailPlaceholder: "ejemplo@email.com (opcional)",
    phoneLast4: "Últimos 4 dígitos del teléfono",
    phoneLast4Desc: "Solo los últimos 4 dígitos del teléfono del cliente",
    countryCode: "Lada",
    contractDuration: "Tiempo de Contrato",
    selectDuration: "Seleccionar duración",
    months6: "6 meses",
    year1: "1 año",
    years2: "2 años",
    years3Plus: "3+ años",
    checkInDate: "Fecha de Check-in",
    pets: "Mascotas",
    hasPetsQuestion: "¿Tiene mascotas?",
    petNo: "No",
    pet1Dog: "1 Perro",
    pet2Dogs: "2 Perros",
    pet1Cat: "1 Gato",
    pet2Cats: "2 Gatos",
    petOther: "Otro",
    budget: "Presupuesto de Renta (MXN)",
    budgetMin: "Mín",
    budgetMax: "Máx",
    bedrooms: "Recámaras",
    selectBedrooms: "Seleccionar",
    studio: "Estudio",
    bedroomSingular: "recámara",
    bedroomsPlural: "recámaras",
    bedroomsPlus: "o más",
    propertyType: "Tipo de Propiedad",
    selectTypes: "Seleccionar tipos",
    selectedTypes: "seleccionados",
    zone: "Zona / Colonia",
    selectZones: "Seleccionar zonas",
    selectedZones: "seleccionadas",
    propertyInterest: "Propiedades de Interés",
    selectCondominium: "Seleccionar condominio",
    selectUnits: "Seleccionar unidades",
    loading: "Cargando...",
    noUnits: "Sin unidades",
    addProperty: "Agregar",
    propertiesSelected: "propiedades seleccionadas:",
    brokerName: "Tu Nombre (Broker)",
    brokerNameDesc: "Nombre de quien registra el lead",
    source: "¿Cómo conoció al cliente?",
    sourcePlaceholder: "Ej: Referido, Portal inmobiliario, Redes sociales...",
    notes: "Notas Adicionales",
    notesPlaceholder: "Cualquier información adicional relevante...",
    previous: "Anterior",
    next: "Siguiente",
    submit: "Enviar Registro",
    submitting: "Enviando...",
    acceptTermsFirst: "Debes aceptar los términos de comisión para continuar",
    successTitle: "¡Registro Completado!",
    successDescription: "Gracias por compartir este lead. Lo revisaremos y te contactaremos si hay coincidencias.",
    successToastTitle: "¡Registro Exitoso!",
    successToastDesc: "Gracias por compartir este lead. Lo revisaremos pronto.",
    errorTitle: "Error",
    errorDesc: "Hubo un problema al enviar tu registro",
    validationFirstName: "Nombre requerido",
    validationLastName: "Apellido requerido",
    validationEmail: "Correo electrónico válido",
    validationCountryCode: "Código de país requerido",
    validationPhoneLast4: "Últimos 4 dígitos del teléfono del cliente",
    validationContractDuration: "Tiempo de contrato requerido",
    validationCheckIn: "Fecha de check-in requerida",
    validationPets: "Información sobre mascotas requerida",
    validationBedrooms: "Número de recámaras requerido",
    validationBrokerName: "Nombre del broker requerido",
  },
  en: {
    pageTitle: "Lead Registration for Brokers",
    pageDescription: "Share basic client information to verify availability",
    smartRealEstate: "Smart Real Estate",
    commissionTermsTitle: "Commission Terms for Brokers",
    commissionIntro: "By registering a lead, I accept the following terms:",
    commission50: "50% commission",
    commission50Desc: "if the rented property has no referring seller",
    commission40: "40% commission",
    commission40Desc: "if the rented property has a referring seller",
    commissionNote: "The 10% commission for the referring seller is covered by the agency and is not deducted from your commission.",
    acceptTerms: "I accept the commission terms and understand that my payment will depend on whether the property has a referral.",
    referralLink: "Referral link:",
    step1Title: "Client Information",
    step1Desc: "Contact details",
    step2Title: "Search Details",
    step2Desc: "Property preferences",
    firstName: "Client First Name",
    lastName: "Client Last Name",
    email: "Email Address",
    emailPlaceholder: "example@email.com (optional)",
    phoneLast4: "Last 4 digits of phone",
    phoneLast4Desc: "Only the last 4 digits of the client's phone",
    countryCode: "Code",
    contractDuration: "Contract Duration",
    selectDuration: "Select duration",
    months6: "6 months",
    year1: "1 year",
    years2: "2 years",
    years3Plus: "3+ years",
    checkInDate: "Check-in Date",
    pets: "Pets",
    hasPetsQuestion: "Has pets?",
    petNo: "No",
    pet1Dog: "1 Dog",
    pet2Dogs: "2 Dogs",
    pet1Cat: "1 Cat",
    pet2Cats: "2 Cats",
    petOther: "Other",
    budget: "Rent Budget (MXN)",
    budgetMin: "Min",
    budgetMax: "Max",
    bedrooms: "Bedrooms",
    selectBedrooms: "Select",
    studio: "Studio",
    bedroomSingular: "bedroom",
    bedroomsPlural: "bedrooms",
    bedroomsPlus: "or more",
    propertyType: "Property Type",
    selectTypes: "Select types",
    selectedTypes: "selected",
    zone: "Zone / Neighborhood",
    selectZones: "Select zones",
    selectedZones: "selected",
    propertyInterest: "Properties of Interest",
    selectCondominium: "Select condominium",
    selectUnits: "Select units",
    loading: "Loading...",
    noUnits: "No units",
    addProperty: "Add",
    propertiesSelected: "properties selected:",
    brokerName: "Your Name (Broker)",
    brokerNameDesc: "Name of who is registering the lead",
    source: "How did you meet the client?",
    sourcePlaceholder: "Ex: Referral, Real estate portal, Social media...",
    notes: "Additional Notes",
    notesPlaceholder: "Any additional relevant information...",
    previous: "Previous",
    next: "Next",
    submit: "Submit Registration",
    submitting: "Submitting...",
    acceptTermsFirst: "You must accept the commission terms to continue",
    successTitle: "Registration Complete!",
    successDescription: "Thank you for sharing this lead. We will review it and contact you if there are matches.",
    successToastTitle: "Registration Successful!",
    successToastDesc: "Thank you for sharing this lead. We'll review it soon.",
    errorTitle: "Error",
    errorDesc: "There was a problem submitting your registration",
    validationFirstName: "First name required",
    validationLastName: "Last name required",
    validationEmail: "Valid email address",
    validationCountryCode: "Country code required",
    validationPhoneLast4: "Last 4 digits of client's phone",
    validationContractDuration: "Contract duration required",
    validationCheckIn: "Check-in date required",
    validationPets: "Pet information required",
    validationBedrooms: "Number of bedrooms required",
    validationBrokerName: "Broker name required",
  },
};

interface PropertyInterest {
  condominiumId: string;
  condominiumName: string;
  unitIds: string[];
}

const COUNTRY_CODES = [
  { code: "+52", country: "MX", flag: "MX" },
  { code: "+1", country: "US/CA", flag: "US" },
  { code: "+57", country: "CO", flag: "CO" },
  { code: "+54", country: "AR", flag: "AR" },
  { code: "+56", country: "CL", flag: "CL" },
  { code: "+34", country: "ES", flag: "ES" },
  { code: "+55", country: "BR", flag: "BR" },
  { code: "+51", country: "PE", flag: "PE" },
];

const UNIT_TYPES = [
  "Departamento",
  "Casa",
  "Estudio",
  "PH / Penthouse",
  "Villa",
  "Loft",
];

const NEIGHBORHOODS = [
  "Aldea Zama",
  "Centro",
  "La Veleta",
  "Region 15",
  "Region 8",
  "Holistika",
  "Selva Zama",
  "Otro",
];

const getSteps = (t: typeof translations.es) => [
  { id: 1, title: t.step1Title, description: t.step1Desc, icon: User },
  { id: 2, title: t.step2Title, description: t.step2Desc, icon: Search },
];

const brokerFormSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Correo electrónico válido").optional().or(z.literal("")),
  countryCode: z.string().min(1, "Código de país requerido"),
  phoneLast4: z.string().length(4, "Últimos 4 dígitos del teléfono del cliente"),
  contractDuration: z.string().min(1, "Tiempo de contrato requerido"),
  checkInDate: z.string().min(1, "Fecha de check-in requerida"),
  hasPets: z.string().min(1, "Información sobre mascotas requerida"),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  bedrooms: z.string().min(1, "Número de recámaras requerido"),
  desiredUnitTypes: z.array(z.string()).optional(),
  desiredNeighborhoods: z.array(z.string()).optional(),
  interestedCondominiumId: z.string().optional(),
  interestedUnitIds: z.array(z.string()).optional(),
  sellerName: z.string().min(1, "Nombre del broker requerido"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type BrokerFormData = z.infer<typeof brokerFormSchema>;

export default function LeadRegistrationBroker() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = translations[language];
  const STEPS = getSteps(t);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>("");
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [propertyInterests, setPropertyInterests] = useState<PropertyInterest[]>([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Extract seller name and ID from URL parameters for personalized links
  // Links format: /leads/broker?seller=NombreVendedor&sellerId=userId
  const urlParams = new URLSearchParams(window.location.search);
  const sellerFromUrl = urlParams.get("seller") || "";
  const sellerIdFromUrl = urlParams.get("sellerId") || "";
  const isPersonalizedLink = !!sellerFromUrl || !!sellerIdFromUrl;

  // Fetch agency info for logo
  const { data: agencyData } = useQuery<{ id: string; name: string; logoUrl: string }>({
    queryKey: ["/api/public/agency"],
    queryFn: async () => {
      const response = await fetch("/api/public/agency");
      if (!response.ok) return { id: "", name: "", logoUrl: "" };
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  // Fetch condominiums for property interest selection
  const { data: condominiumsData, isLoading: isLoadingCondos } = useQuery<{ id: string; name: string; neighborhood?: string }[]>({
    queryKey: ["/api/public/condominiums"],
    queryFn: async () => {
      const response = await fetch("/api/public/condominiums");
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
  const condominiums = condominiumsData || [];

  // Fetch units for selected condominium
  const { data: unitsData, isLoading: isLoadingUnits } = useQuery<{ id: string; unitNumber: string; type?: string }[]>({
    queryKey: ["/api/public/condominiums", selectedCondominiumId, "units"],
    queryFn: async () => {
      const response = await fetch(`/api/public/condominiums/${selectedCondominiumId}/units`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedCondominiumId,
    staleTime: 5 * 60 * 1000,
  });
  const units = unitsData || [];

  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+52",
      phoneLast4: "",
      contractDuration: "",
      checkInDate: "",
      hasPets: "",
      budgetMin: undefined,
      budgetMax: undefined,
      bedrooms: "",
      desiredUnitTypes: [],
      desiredNeighborhoods: [],
      interestedCondominiumId: "",
      interestedUnitIds: [],
      sellerName: sellerFromUrl, // Pre-fill from URL parameter if available
      source: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: BrokerFormData) => {
      // Helper: parse bedrooms text to extract numeric value
      const parseBedroomsText = (text?: string): number | undefined => {
        if (!text) return undefined;
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
      };
      
      // Prepare property interests with full structure for backend
      const propertyInterestsPayload = propertyInterests.map(p => ({
        condominiumId: p.condominiumId,
        condominiumName: p.condominiumName,
        unitIds: p.unitIds,
      }));
      
      // Also provide legacy comma-separated format for backward compatibility
      const allCondominiumIds = propertyInterests.map(p => p.condominiumId).join(",");
      const allUnitIds = propertyInterests.flatMap(p => p.unitIds).join(",");
      
      // Parse numeric values from text fields
      const numericBedrooms = parseBedroomsText(data.bedrooms);
      
      const response = await fetch("/api/public/leads/broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          desiredUnitType: data.desiredUnitTypes?.join(", ") || "",
          desiredNeighborhood: data.desiredNeighborhoods?.join(", ") || "",
          // Budget range fields (numeric)
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          // Text fields for display
          bedroomsText: data.bedrooms,
          // Numeric fields for filtering
          bedrooms: numericBedrooms,
          // Full structured property interests
          propertyInterests: propertyInterestsPayload,
          // Legacy fields for backward compatibility
          interestedCondominiumId: allCondominiumIds || "",
          interestedUnitId: allUnitIds || "",
          // Seller referral tracking
          sellerId: sellerIdFromUrl || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error al enviar" }));
        throw new Error(error.message || error.detail);
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t.successToastTitle,
        description: t.successToastDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.errorTitle,
        description: error.message || t.errorDesc,
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      const fieldsToValidate: (keyof BrokerFormData)[] = ["firstName", "lastName", "phoneLast4", "countryCode"];
      const isValid = await form.trigger(fieldsToValidate);
      
      const values = form.getValues();
      const hasRequiredValues = 
        values.firstName?.trim() && 
        values.lastName?.trim() && 
        values.phoneLast4?.trim() && 
        values.phoneLast4.length === 4;
      
      if (!isValid || !hasRequiredValues) {
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: BrokerFormData) => {
    if (currentStep !== STEPS.length) {
      return;
    }
    submitMutation.mutate({
      ...data,
      desiredUnitTypes: selectedUnitTypes,
      desiredNeighborhoods: selectedNeighborhoods,
      interestedUnitIds: selectedUnitIds,
    });
  };

  // Add property interest
  const addPropertyInterest = () => {
    if (!selectedCondominiumId) return;
    
    const condo = condominiums.find(c => c.id === selectedCondominiumId);
    if (!condo) return;
    
    // Check if already exists
    const exists = propertyInterests.some(p => p.condominiumId === selectedCondominiumId);
    if (exists) {
      // Update existing entry
      setPropertyInterests(prev => prev.map(p => 
        p.condominiumId === selectedCondominiumId 
          ? { ...p, unitIds: selectedUnitIds }
          : p
      ));
    } else {
      // Add new entry
      setPropertyInterests(prev => [...prev, {
        condominiumId: selectedCondominiumId,
        condominiumName: condo.name,
        unitIds: selectedUnitIds,
      }]);
    }
    
    // Reset selections
    setSelectedCondominiumId("");
    setSelectedUnitIds([]);
  };

  // Remove property interest
  const removePropertyInterest = (condominiumId: string) => {
    setPropertyInterests(prev => prev.filter(p => p.condominiumId !== condominiumId));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t.successTitle}</CardTitle>
            <CardDescription className="text-base">
              {t.successDescription}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <div className="flex justify-center items-center gap-6 flex-1">
              <div className="flex flex-col items-center">
                <img 
                  src={logoPath} 
                  alt="HomesApp Logo" 
                  className="h-14 w-auto"
                />
                <span className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">{t.smartRealEstate}</span>
              </div>
              {agencyData?.logoUrl && (
                <>
                  <span className="text-muted-foreground text-xl">×</span>
                  <img 
                    src={agencyData.logoUrl} 
                    alt={`${agencyData.name} Logo`} 
                    className="h-14 w-auto object-contain"
                  />
                </>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageToggle />
            </div>
          </div>
          <CardTitle className="text-3xl">{t.pageTitle}</CardTitle>
          <CardDescription className="text-base">
            {t.pageDescription}
            {agencyData?.name && <span className="block mt-1 font-medium">{agencyData.name}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Broker Terms and Conditions */}
          <div className="mb-6 p-4 bg-muted/50 border rounded-lg space-y-3">
            <div className="space-y-2">
              <p className="font-semibold text-sm">{t.commissionTermsTitle}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{t.commissionIntro}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>{t.commission50}</strong> {t.commission50Desc}</li>
                  <li><strong>{t.commission40}</strong> {t.commission40Desc}</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground/80">
                  {t.commissionNote}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t">
              <Checkbox 
                id="terms-accept" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                data-testid="checkbox-terms"
              />
              <label 
                htmlFor="terms-accept" 
                className="text-sm cursor-pointer leading-tight"
              >
                {t.acceptTerms}
              </label>
            </div>
            {isPersonalizedLink && (
              <div className="text-xs text-primary font-medium pt-1">
                {t.referralLink} {sellerFromUrl}
              </div>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center transition-all ${
                    step.id < currentStep
                      ? "text-primary"
                      : step.id === currentStep
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step.id < currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.id === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                  </div>
                  <div className="text-xs">{step.description}</div>
                  <div className="text-sm hidden sm:block">{step.title}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    step.id <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Client Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.firstName} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Juan" data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.lastName} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Pérez" data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.email}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder={t.emailPlaceholder} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>{t.phoneLast4} *</FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="countryCode"
                          render={({ field }) => (
                            <FormItem className="w-28">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-country-code">
                                    <SelectValue placeholder={t.countryCode} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {COUNTRY_CODES.map((cc) => (
                                    <SelectItem key={cc.code} value={cc.code}>
                                      {cc.code} {cc.country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phoneLast4"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="tel" 
                                  placeholder="4567" 
                                  maxLength={4}
                                  data-testid="input-phone-last4" 
                                />
                              </FormControl>
                              <FormDescription>
                                {t.phoneLast4Desc}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Search Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contractDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.contractDuration} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contract-duration">
                                <SelectValue placeholder={t.selectDuration} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="6 meses">{t.months6}</SelectItem>
                              <SelectItem value="1 año">{t.year1}</SelectItem>
                              <SelectItem value="2 años">{t.years2}</SelectItem>
                              <SelectItem value="3+ años">{t.years3Plus}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.checkInDate} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" data-testid="input-check-in-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hasPets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.pets} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-has-pets">
                                <SelectValue placeholder={t.hasPetsQuestion} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="No">{t.petNo}</SelectItem>
                              <SelectItem value="1 Perro">{t.pet1Dog}</SelectItem>
                              <SelectItem value="2 Perros">{t.pet2Dogs}</SelectItem>
                              <SelectItem value="1 Gato">{t.pet1Cat}</SelectItem>
                              <SelectItem value="2 Gatos">{t.pet2Cats}</SelectItem>
                              <SelectItem value="Otro">{t.petOther}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>{t.budget}</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormField
                          control={form.control}
                          name="budgetMin"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Mín"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  data-testid="input-budget-min"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-muted-foreground">-</span>
                        <FormField
                          control={form.control}
                          name="budgetMax"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Máx"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  data-testid="input-budget-max"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.bedrooms} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 1-2, 2+, 3" data-testid="input-bedrooms" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>{t.propertyType}</FormLabel>
                      <Popover open={unitTypeOpen} onOpenChange={setUnitTypeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            data-testid="button-unit-type"
                          >
                            {selectedUnitTypes.length > 0
                              ? `${selectedUnitTypes.length} ${t.selectedTypes}`
                              : t.selectTypes}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2">
                          <div className="space-y-2">
                            {UNIT_TYPES.map((type) => (
                              <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`unit-type-${type}`}
                                  checked={selectedUnitTypes.includes(type)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedUnitTypes([...selectedUnitTypes, type]);
                                    } else {
                                      setSelectedUnitTypes(selectedUnitTypes.filter(t => t !== type));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`unit-type-${type}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>{t.zone}</FormLabel>
                    <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          data-testid="button-neighborhood"
                        >
                          {selectedNeighborhoods.length > 0
                            ? `${selectedNeighborhoods.length} ${t.selectedZones}`
                            : t.selectZones}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2">
                        <div className="space-y-2">
                          {NEIGHBORHOODS.map((zone) => (
                            <div key={zone} className="flex items-center space-x-2">
                              <Checkbox
                                id={`neighborhood-${zone}`}
                                checked={selectedNeighborhoods.includes(zone)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedNeighborhoods([...selectedNeighborhoods, zone]);
                                  } else {
                                    setSelectedNeighborhoods(selectedNeighborhoods.filter(z => z !== zone));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`neighborhood-${zone}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {zone}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Property Interests Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <FormLabel className="text-base">{t.propertyInterest}</FormLabel>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Select
                          value={selectedCondominiumId}
                          onValueChange={(value) => {
                            setSelectedCondominiumId(value);
                            setSelectedUnitIds([]);
                          }}
                        >
                          <SelectTrigger data-testid="select-condominium">
                            <SelectValue placeholder={t.selectCondominium} />
                          </SelectTrigger>
                          <SelectContent>
                            {condominiums.map((condo) => (
                              <SelectItem key={condo.id} value={condo.id}>
                                {condo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Select
                          disabled={!selectedCondominiumId}
                          value=""
                          onValueChange={(value) => {
                            if (!selectedUnitIds.includes(value)) {
                              setSelectedUnitIds([...selectedUnitIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-units">
                            <SelectValue placeholder={t.selectUnits} />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.unitNumber} {unit.type && `(${unit.type})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUnitIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedUnitIds.map((unitId) => {
                              const unit = units.find(u => u.id === unitId);
                              return (
                                <span
                                  key={unitId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                                >
                                  {unit?.unitNumber || unitId}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUnitIds(selectedUnitIds.filter(id => id !== unitId))}
                                    className="hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedCondominiumId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPropertyInterest}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t.addProperty}
                      </Button>
                    )}

                    {/* List of added property interests */}
                    {propertyInterests.length > 0 && (
                      <div className="space-y-2">
                        {propertyInterests.map((interest) => (
                          <div
                            key={interest.condominiumId}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{interest.condominiumName}</span>
                              {interest.unitIds.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  ({interest.unitIds.length} unidad(es))
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePropertyInterest(interest.condominiumId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Broker Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="sellerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.brokerName} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Tu nombre completo" 
                              data-testid="input-seller-name"
                              readOnly={isPersonalizedLink}
                              className={isPersonalizedLink ? "bg-muted cursor-not-allowed" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {isPersonalizedLink 
                              ? `Este lead será asignado a ${sellerFromUrl} como vendedor referido.`
                              : "Escribe tu nombre completo para identificar quién registró este lead."
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.notes}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t.notesPlaceholder}
                              rows={3}
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="gap-2"
                    data-testid="button-previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.previous}
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2"
                    data-testid="button-next"
                  >
                    {t.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || !termsAccepted}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.submitting}
                      </>
                    ) : !termsAccepted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {t.acceptTermsFirst}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {t.submit}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
