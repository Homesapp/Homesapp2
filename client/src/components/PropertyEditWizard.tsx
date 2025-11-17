import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "shared/schema";
import EditStep1BasicInfo from "./edit-wizard/EditStep1BasicInfo";
import EditStep2LocationDetails from "./edit-wizard/EditStep2LocationDetails";
import EditStep3Media from "./edit-wizard/EditStep3Media";
import EditStep4Services from "./edit-wizard/EditStep4Services";
import EditStep5AccessInfo from "./edit-wizard/EditStep5AccessInfo";
import EditStep6OwnerData from "./edit-wizard/EditStep6OwnerData";
import EditStep7ReviewChanges from "./edit-wizard/EditStep7ReviewChanges";

const TOTAL_STEPS = 7;

interface PropertyEditWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onSuccess?: () => void;
}

export type EditWizardData = {
  // Step 1: Basic Info
  status?: string;
  description?: string;
  propertyType?: string;
  price?: string;  // stored as string, converted to number on save
  salePrice?: string | null;  // stored as string, null to clear, converted to number on save
  currency?: string;
  
  // Step 2: Location & Details
  location?: string;
  bedrooms?: string;  // stored as string, converted to number on save
  bathrooms?: string;  // stored as string, converted to number on save
  area?: string | null;  // stored as string, null to clear, converted to number on save
  amenities?: string[];
  petFriendly?: boolean;
  allowsSubleasing?: boolean;
  colonyId?: string;
  colonyName?: string;
  condominiumId?: string;
  condoName?: string;
  unitNumber?: string;
  googleMapsUrl?: string;
  latitude?: string;
  longitude?: string;
  
  // Step 3: Media
  primaryImages?: string[];
  coverImageIndex?: number;
  secondaryImages?: string[];
  videos?: string[];
  virtualTourUrl?: string;
  
  // Step 4: Services
  includedServices?: any;
  acceptedLeaseDurations?: string[];
  
  // Step 5: Access Info
  accessInfo?: any;
  
  // Step 6: Owner Data
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  referredByName?: string | null;  // null to clear
  referredByLastName?: string | null;  // null to clear
  referredByPhone?: string | null;  // null to clear
  referredByEmail?: string | null;  // null to clear
  referralPercent?: string | null;  // stored as string, null to clear, converted to number on save
};

export default function PropertyEditWizard({
  open,
  onOpenChange,
  property,
  onSuccess,
}: PropertyEditWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<EditWizardData>({});
  const [isSaving, setIsSaving] = useState(false);

  // Track what fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/properties/${property.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", property.id] });
      toast({
        title: "Propiedad actualizada",
        description: "Los cambios se guardaron exitosamente",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la propiedad",
      });
    },
  });

  const updateWizardData = (stepData: Partial<EditWizardData>, modifiedFieldsList?: string[]) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
    
    // Track which fields were modified
    if (modifiedFieldsList) {
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        modifiedFieldsList.forEach(field => newSet.add(field));
        return newSet;
      });
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Only send modified fields
      const dataToUpdate: any = {};
      
      Object.keys(wizardData).forEach(key => {
        if (modifiedFields.has(key)) {
          let value = wizardData[key as keyof EditWizardData];
          
          // Convert numeric fields from strings to numbers
          // Note: Preserve null to signal field clearing, only convert valid strings
          if (key === 'price' || key === 'salePrice') {
            if (value === null) {
              // Preserve null to clear the field
              value = null;
            } else if (value !== undefined && value !== '') {
              const parsed = parseFloat(value as string);
              if (Number.isNaN(parsed)) {
                throw new Error(`Valor inválido para ${key}: debe ser un número`);
              }
              value = parsed;
            }
          } else if (key === 'bedrooms') {
            if (value === null) {
              value = null;
            } else if (value !== undefined && value !== '') {
              const parsed = parseInt(value as any);
              if (Number.isNaN(parsed)) {
                throw new Error(`Valor inválido para habitaciones: debe ser un número entero`);
              }
              value = parsed;
            }
          } else if (key === 'bathrooms' || key === 'area') {
            if (value === null) {
              value = null;
            } else if (value !== undefined && value !== '') {
              const parsed = parseFloat(value as any);
              if (Number.isNaN(parsed)) {
                throw new Error(`Valor inválido para ${key}: debe ser un número`);
              }
              value = parsed;
            }
          } else if (key === 'referralPercent') {
            if (value === null) {
              value = null;
            } else if (value !== undefined && value !== '') {
              const parsed = parseFloat(value as string);
              if (Number.isNaN(parsed)) {
                throw new Error(`Valor inválido para porcentaje: debe ser un número`);
              }
              value = parsed;
            }
          }
          
          dataToUpdate[key] = value;
        }
      });

      if (Object.keys(dataToUpdate).length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se han realizado cambios",
        });
        onOpenChange(false);
        return;
      }

      await updateMutation.mutateAsync(dataToUpdate);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EditStep1BasicInfo
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <EditStep2LocationDetails
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <EditStep3Media
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <EditStep4Services
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <EditStep5AccessInfo
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <EditStep6OwnerData
            property={property}
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        return (
          <EditStep7ReviewChanges
            property={property}
            data={wizardData}
            modifiedFields={modifiedFields}
            onPrevious={handlePrevious}
            onSave={handleSaveChanges}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Propiedad - Paso {currentStep} de {TOTAL_STEPS}</DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="mt-2 text-sm text-muted-foreground text-center">
            {currentStep === 1 && "Información Básica"}
            {currentStep === 2 && "Ubicación y Detalles"}
            {currentStep === 3 && "Multimedia"}
            {currentStep === 4 && "Servicios"}
            {currentStep === 5 && "Información de Acceso"}
            {currentStep === 6 && "Datos del Propietario"}
            {currentStep === 7 && "Resumen de Cambios"}
          </div>
        </div>

        {/* Step content */}
        <div>
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
