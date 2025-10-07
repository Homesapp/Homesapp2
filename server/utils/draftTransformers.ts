/**
 * Utility functions to transform property submission draft data
 * into property records for admin approval workflow
 */

import type { PropertySubmissionDraft } from "@shared/schema";

type DraftServicesInfo = {
  wizardMode?: "simple" | "extended";
  waterIncluded?: boolean;
  waterType?: "capa" | "well";
  waterProvider?: string;
  waterAccountNumber?: string;
  waterEstimatedCost?: string;
  electricityIncluded?: boolean;
  electricityType?: "cfe" | "solar";
  electricityPaymentFrequency?: "monthly" | "bimonthly";
  electricityProvider?: string;
  electricityAccountNumber?: string;
  electricityEstimatedCost?: string;
  internetIncluded?: boolean;
  internetProvider?: string;
  internetAccountNumber?: string;
  internetEstimatedCost?: string;
  acceptedLeaseDurations?: string[];
};

type PropertyIncludedServices = {
  water?: {
    included: boolean;
    type?: "capa" | "well";
    provider?: string;
    accountNumber?: string;
    estimatedCost?: string;
  };
  electricity?: {
    included: boolean;
    type?: "cfe" | "solar";
    paymentFrequency?: "monthly" | "bimonthly";
    provider?: string;
    accountNumber?: string;
    estimatedCost?: string;
  };
  internet?: {
    included: boolean;
    provider?: string;
    accountNumber?: string;
    estimatedCost?: string;
  };
};

/**
 * Transform servicesInfo from draft format to includedServices for property
 */
export function transformServicesInfo(servicesInfo?: any): PropertyIncludedServices | null {
  if (!servicesInfo) return null;
  
  const draftServices = servicesInfo as DraftServicesInfo;
  const includedServices: PropertyIncludedServices = {};

  // Transform water service
  if (draftServices.waterIncluded) {
    includedServices.water = {
      included: true,
      type: draftServices.waterType,
      provider: draftServices.waterProvider,
      accountNumber: draftServices.waterAccountNumber,
      estimatedCost: draftServices.waterEstimatedCost,
    };
  }

  // Transform electricity service
  if (draftServices.electricityIncluded) {
    includedServices.electricity = {
      included: true,
      type: draftServices.electricityType,
      paymentFrequency: draftServices.electricityPaymentFrequency,
      provider: draftServices.electricityProvider,
      accountNumber: draftServices.electricityAccountNumber,
      estimatedCost: draftServices.electricityEstimatedCost,
    };
  }

  // Transform internet service
  if (draftServices.internetIncluded) {
    includedServices.internet = {
      included: true,
      provider: draftServices.internetProvider,
      accountNumber: draftServices.internetAccountNumber,
      estimatedCost: draftServices.internetEstimatedCost,
    };
  }

  // Return null if no services are included
  return Object.keys(includedServices).length > 0 ? includedServices : null;
}

/**
 * Transform complete draft into property insert data
 */
export function draftToPropertyData(draft: PropertySubmissionDraft, adminId: string) {
  const basicInfo = draft.basicInfo as any || {};
  const locationInfo = draft.locationInfo as any || {};
  const details = draft.details as any || {};
  const media = draft.media as any || {};
  const commercialTerms = draft.commercialTerms as any || {};
  const servicesInfo = draft.servicesInfo as any || {};

  // Transform included services
  const includedServices = transformServicesInfo(servicesInfo);

  // Map operation type to status
  let status = "available";
  if (draft.isForRent && !draft.isForSale) {
    status = "rent";
  } else if (draft.isForSale && !draft.isForRent) {
    status = "sale";
  } else if (draft.isForRent && draft.isForSale) {
    status = "both";
  }

  // Build property data
  const propertyData = {
    title: basicInfo.title || "Sin título",
    description: basicInfo.description,
    customListingTitle: basicInfo.customListingTitle,
    propertyType: basicInfo.propertyType || "house",
    price: basicInfo.price || "0",
    salePrice: basicInfo.salePrice,
    currency: basicInfo.currency || "MXN",
    
    // Location
    location: locationInfo.location || "Tulum, Quintana Roo",
    colonyId: locationInfo.colonyId,
    colonyName: locationInfo.colonyName,
    condominiumId: locationInfo.condominiumId,
    condoName: locationInfo.condoName,
    unitType: locationInfo.unitType || "private",
    unitNumber: locationInfo.unitNumber,
    showCondoInListing: locationInfo.showCondoInListing !== false,
    showUnitNumberInListing: locationInfo.showUnitNumberInListing !== false,
    googleMapsUrl: locationInfo.googleMapsUrl,
    latitude: locationInfo.latitude,
    longitude: locationInfo.longitude,
    
    // Details
    bedrooms: details.bedrooms || 0,
    bathrooms: details.bathrooms || "0",
    area: details.area || "0",
    amenities: details.amenities || [],
    specifications: details.specifications,
    
    // Media
    primaryImages: media.primaryImages || [],
    secondaryImages: media.secondaryImages || [],
    coverImageIndex: media.coverImageIndex || 0,
    videos: media.videos || [],
    virtualTourUrl: media.virtualTourUrl,
    
    // Services and lease info
    wizardMode: servicesInfo.wizardMode || "simple",
    includedServices: includedServices,
    acceptedLeaseDurations: servicesInfo.acceptedLeaseDurations || [],
    
    // Owner and status
    ownerId: draft.userId,
    managementId: adminId,
    status: status as any,
    approvalStatus: "approved" as const,
    active: true,
    published: true,
    
    // Commercial terms
    allowsSubleasing: commercialTerms.allowsSubleasing || false,
  };

  return propertyData;
}
