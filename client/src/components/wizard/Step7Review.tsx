import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Check, AlertCircle, FileText, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTranslation, Language } from "@/lib/wizardTranslations";
import type { PropertyOwnerTerms } from "@shared/schema";

type Step7Props = {
  data: any;
  draftId: string | null;
  onPrevious: () => void;
  language?: Language;
};

export default function Step7Review({ data, draftId, onPrevious, language = "es" }: Step7Props) {
  const t = getTranslation(language);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "terms">("summary");

  // Load terms from database
  const { data: ownerTerms = [], isLoading: termsLoading } = useQuery<PropertyOwnerTerms[]>({
    queryKey: ["/api/property-owner-terms/active"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) {
        throw new Error(t.errors.noDraftToSubmit);
      }
      return await apiRequest("PATCH", `/api/property-submission-drafts/${draftId}`, {
        status: "submitted",
      });
    },
    onSuccess: () => {
      toast({
        title: t.notifications.propertySubmitted,
        description: t.notifications.propertySubmittedDesc,
      });
      setLocation("/mis-propiedades");
    },
    onError: (error: any) => {
      toast({
        title: t.notifications.error,
        description: error.message || t.notifications.submitError,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitMutation.mutateAsync();
  };

  const isComplete = data.basicInfo && data.locationInfo && data.details;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" data-testid="heading-step7-title">
          {t.step7.title}
        </h2>
        <p className="text-muted-foreground" data-testid="text-step7-description">
          {t.step7.subtitle}
        </p>
      </div>

      {/* View Mode Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={viewMode === "summary" ? "default" : "outline"}
          onClick={() => setViewMode("summary")}
          data-testid="button-view-summary"
          className="flex-1"
        >
          <Home className="w-4 h-4 mr-2" />
          {t.step7.propertySummary}
        </Button>
        <Button
          type="button"
          variant={viewMode === "terms" ? "default" : "outline"}
          onClick={() => setViewMode("terms")}
          data-testid="button-view-terms"
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          {t.step7.termsAndConditions}
        </Button>
      </div>

      {!isComplete && (
        <Alert variant="destructive" data-testid="alert-incomplete">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle data-testid="text-alert-title">{t.step7.incompleteTitle}</AlertTitle>
          <AlertDescription data-testid="text-alert-description">
            {t.step7.incompleteDesc}
          </AlertDescription>
        </Alert>
      )}

      {/* Property Summary View */}
      {viewMode === "summary" && (
        <div className="space-y-4">
        {/* Property Type */}
        <Card data-testid="card-review-type">
          <CardHeader>
            <CardTitle>{t.step7.operationType}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              {data.isForRent && (
                <Badge data-testid="badge-rent">{t.step7.rent}</Badge>
              )}
              {data.isForSale && (
                <Badge data-testid="badge-sale">{t.step7.sale}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        {data.basicInfo && (
          <Card data-testid="card-review-basic">
            <CardHeader>
              <CardTitle>{t.step7.basicInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.titleLabel}</span>
                <p className="text-base" data-testid="text-review-title">{data.basicInfo.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.descriptionLabel}</span>
                <p className="text-base" data-testid="text-review-description">{data.basicInfo.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.typeLabel}</span>
                  <p className="text-base" data-testid="text-review-property-type">{data.basicInfo.propertyType}</p>
                </div>
              </div>
              
              {/* Rental Price */}
              {data.isForRent && (data.basicInfo.rentalPrice || data.basicInfo.price) && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-2">{t.step7.rentalPriceLabel}</h4>
                  <p className="text-lg font-bold" data-testid="text-review-rental-price">
                    ${Number(data.basicInfo.rentalPrice || data.basicInfo.price).toLocaleString()} {data.basicInfo.rentalPriceCurrency || data.basicInfo.currency || "MXN"}
                  </p>
                </div>
              )}
              
              {/* Sale Price */}
              {data.isForSale && data.basicInfo.salePrice && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-2">{t.step7.salePriceLabel}</h4>
                  <p className="text-lg font-bold" data-testid="text-review-sale-price">
                    ${Number(data.basicInfo.salePrice).toLocaleString()} {data.basicInfo.salePriceCurrency || "MXN"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location */}
        {data.locationInfo && (
          <Card data-testid="card-review-location">
            <CardHeader>
              <CardTitle>{t.step7.location}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-muted-foreground">{t.step7.addressLabel}</span>
                <p className="text-base" data-testid="text-review-address">{data.locationInfo.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.locationInfo.colony && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.colonyLabel}</span>
                    <p className="text-base" data-testid="text-review-colony">{data.locationInfo.colony}</p>
                  </div>
                )}
                {data.locationInfo.condominium && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.condominiumLabel}</span>
                    <p className="text-base" data-testid="text-review-condominium">{data.locationInfo.condominium}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.cityLabel}:</span>
                  <p className="text-base" data-testid="text-review-city">{data.locationInfo.city}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.stateLabel}:</span>
                  <p className="text-base" data-testid="text-review-state">{data.locationInfo.state}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.zipCodeLabel}:</span>
                  <p className="text-base" data-testid="text-review-zipcode">{data.locationInfo.zipCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        {data.details && (
          <Card data-testid="card-review-details">
            <CardHeader>
              <CardTitle>{t.step7.physicalDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.bedroomsLabel}</span>
                  <p className="text-base" data-testid="text-review-bedrooms">{data.details.bedrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.bathroomsLabel}</span>
                  <p className="text-base" data-testid="text-review-bathrooms">{data.details.bathrooms}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.areaLabel}</span>
                  <p className="text-base" data-testid="text-review-area">{data.details.area} m²</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {data.details.parking && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.parkingLabel}:</span>
                    <p className="text-base" data-testid="text-review-parking">{data.details.parking}</p>
                  </div>
                )}
                {data.details.elevators && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.elevatorsLabel}:</span>
                    <p className="text-base" data-testid="text-review-elevators">{data.details.elevators}</p>
                  </div>
                )}
                {data.details.lotSize && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.lotSizeLabel}:</span>
                    <p className="text-base" data-testid="text-review-lotsize">{data.details.lotSize} m²</p>
                  </div>
                )}
              </div>
              {data.details.yearBuilt && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.yearBuiltLabel}:</span>
                  <p className="text-base" data-testid="text-review-year">{data.details.yearBuilt}</p>
                </div>
              )}
              {data.details.condition && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.conditionLabel}:</span>
                  <p className="text-base" data-testid="text-review-condition">{data.details.condition}</p>
                </div>
              )}
              {data.details.amenities && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.amenitiesLabel}:</span>
                  <p className="text-base" data-testid="text-review-amenities">{data.details.amenities}</p>
                </div>
              )}
              {data.details.features && data.details.features.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.featuresLabel}:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.details.features.map((feature: string, idx: number) => (
                      <Badge key={idx} variant="secondary" data-testid={`badge-feature-${idx}`}>{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Media - Photos */}
        {data.media && (data.media.primaryImages?.length > 0 || data.media.secondaryImages?.length > 0 || data.media.images?.length > 0 || data.media.virtualTourUrl) && (
          <Card data-testid="card-review-media">
            <CardHeader>
              <CardTitle>{t.step7.photosAndMediaLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Images Gallery */}
              {data.media.primaryImages && data.media.primaryImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.primaryImages}:</span>
                    <span className="text-sm text-muted-foreground">
                      {data.media.primaryImages.length} {t.step7.images}
                      {data.media.coverImageIndex !== undefined && ` • ${t.step7.coverImage}: #${data.media.coverImageIndex + 1}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2" data-testid="gallery-primary-images">
                    {data.media.primaryImages.map((image: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-md overflow-hidden border-2 border-muted hover:border-primary transition-colors">
                        <img 
                          src={image} 
                          alt={`Primary ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          data-testid={`img-primary-${idx}`}
                        />
                        {data.media.coverImageIndex === idx && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            {t.step7.cover}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Secondary Images Gallery */}
              {data.media.secondaryImages && data.media.secondaryImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.secondaryImages}:</span>
                    <span className="text-sm text-muted-foreground">{data.media.secondaryImages.length} {t.step7.images}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2" data-testid="gallery-secondary-images">
                    {data.media.secondaryImages.map((image: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-muted hover:border-primary transition-colors">
                        <img 
                          src={image} 
                          alt={`Secondary ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          data-testid={`img-secondary-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Legacy Images */}
              {!data.media.primaryImages && data.media.images && data.media.images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{t.step7.images}:</span>
                    <span className="text-sm text-muted-foreground">{data.media.images.length} {t.step7.images}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2" data-testid="gallery-images">
                    {data.media.images.map((image: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-muted hover:border-primary transition-colors">
                        <img 
                          src={image} 
                          alt={`Image ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          data-testid={`img-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Virtual Tour */}
              {data.media.virtualTourUrl && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.virtualTour}:</span>
                  <a 
                    href={data.media.virtualTourUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base text-primary hover:underline ml-2"
                    data-testid="link-review-tour"
                  >
                    {t.step7.viewVirtualTour}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {data.servicesInfo && Object.keys(data.servicesInfo).some(key => data.servicesInfo[key]) && (
          <Card data-testid="card-review-services">
            <CardHeader>
              <CardTitle>{t.step7.servicesLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.servicesInfo.water && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.waterLabel}:</span>
                  <p className="text-base" data-testid="text-review-water">{data.servicesInfo.water}</p>
                </div>
              )}
              {data.servicesInfo.electricity && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.electricityLabel}:</span>
                  <p className="text-base" data-testid="text-review-electricity">{data.servicesInfo.electricity}</p>
                </div>
              )}
              {data.servicesInfo.gas && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.gasLabel}:</span>
                  <p className="text-base" data-testid="text-review-gas">{data.servicesInfo.gas}</p>
                </div>
              )}
              {data.servicesInfo.internet && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Internet:</span>
                  <p className="text-base" data-testid="text-review-internet">{data.servicesInfo.internet}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access Info */}
        {data.accessInfo && Object.keys(data.accessInfo).some(key => data.accessInfo[key]) && (
          <Card data-testid="card-review-access">
            <CardHeader>
              <CardTitle>{t.step7.accessInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.accessInfo.accessInstructions && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.accessInstructionsLabel}:</span>
                  <p className="text-base whitespace-pre-wrap" data-testid="text-review-access-instructions">{data.accessInfo.accessInstructions}</p>
                </div>
              )}
              {data.accessInfo.securityDetails && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.securityDetailsLabel}:</span>
                  <p className="text-base whitespace-pre-wrap" data-testid="text-review-security">{data.accessInfo.securityDetails}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Owner Information */}
        {data.ownerData && Object.keys(data.ownerData).some(key => data.ownerData[key]) && (
          <Card data-testid="card-review-owner">
            <CardHeader>
              <CardTitle>{t.step7.ownerInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.ownerData.ownerName && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.ownerNameLabel}:</span>
                  <p className="text-base" data-testid="text-review-owner-name">{data.ownerData.ownerName}</p>
                </div>
              )}
              {data.ownerData.ownerEmail && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.ownerEmail}:</span>
                  <p className="text-base" data-testid="text-review-owner-email">{data.ownerData.ownerEmail}</p>
                </div>
              )}
              {data.ownerData.ownerPhone && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.ownerPhoneLabel}:</span>
                  <p className="text-base" data-testid="text-review-owner-phone">{data.ownerData.ownerPhone}</p>
                </div>
              )}
              {data.ownerData.preferredContactMethod && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.contactMethodLabel}:</span>
                  <p className="text-base" data-testid="text-review-contact-method">{data.ownerData.preferredContactMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Commercial Terms */}
        {data.commercialTerms && Object.keys(data.commercialTerms).some(key => data.commercialTerms[key]) && (
          <Card data-testid="card-review-terms">
            <CardHeader>
              <CardTitle>{t.step7.commercialTerms}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.commercialTerms.leaseDuration && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.duration}:</span>
                  <p className="text-base" data-testid="text-review-lease">{data.commercialTerms.leaseDuration}</p>
                </div>
              )}
              {data.commercialTerms.securityDeposit && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.deposit}:</span>
                  <p className="text-base" data-testid="text-review-deposit">{data.commercialTerms.securityDeposit}</p>
                </div>
              )}
              {data.commercialTerms.additionalTerms && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{t.step7.additionalTerms}:</span>
                  <p className="text-base whitespace-pre-wrap" data-testid="text-review-additional">{data.commercialTerms.additionalTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      )}

      {/* Terms and Conditions View */}
      {viewMode === "terms" && (
        <Card data-testid="card-terms-conditions">
          <CardHeader>
            <CardTitle data-testid="heading-terms-title">
              {t.step7.completeTermsAndConditions}
            </CardTitle>
            <CardDescription data-testid="text-terms-description">
              {t.step7.termsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none" data-testid="content-terms">
            {termsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.step7.loadingTerms}
                </p>
              </div>
            ) : ownerTerms.length > 0 ? (
              ownerTerms.map((term, index) => (
                <section key={term.id}>
                  <h3 className="font-semibold text-base">
                    {index + 1}. {language === "es" ? term.title : term.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {language === "es" ? term.content : term.contentEn}
                  </p>
                </section>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {t.step7.noTermsConfigured}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          data-testid="button-previous-step7"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t.previous}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          data-testid="button-submit-property"
        >
          <Check className="w-4 h-4 mr-2" />
          {isSubmitting ? t.step7.submitting : t.step7.submitProperty}
        </Button>
      </div>
    </div>
  );
}
