import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LocationInputProps {
  googleMapsUrl: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  onLocationChange: (data: {
    googleMapsUrl: string | null;
    latitude: string | null;
    longitude: string | null;
    locationConfidence?: string;
  }) => void;
  language?: "es" | "en";
  disabled?: boolean;
}

export function LocationInput({
  googleMapsUrl,
  latitude,
  longitude,
  onLocationChange,
  language = "es",
  disabled = false,
}: LocationInputProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  const t = {
    es: {
      mapsUrlLabel: "Link de Google Maps",
      mapsUrlPlaceholder: "https://maps.google.com/... o pega el link aquí",
      mapsUrlHelper: "Pega un link de Google Maps para extraer las coordenadas automáticamente",
      extractBtn: "Extraer Coordenadas",
      extracting: "Extrayendo...",
      latLabel: "Latitud",
      lngLabel: "Longitud",
      latPlaceholder: "20.2120000",
      lngPlaceholder: "-87.4290000",
      coordinatesLabel: "Coordenadas",
      manualEntry: "O ingresa las coordenadas manualmente:",
      success: "Coordenadas extraídas",
      successDesc: "Las coordenadas se han extraído correctamente del link",
      error: "Error al extraer",
      viewOnMaps: "Ver en Google Maps",
    },
    en: {
      mapsUrlLabel: "Google Maps Link",
      mapsUrlPlaceholder: "https://maps.google.com/... or paste link here",
      mapsUrlHelper: "Paste a Google Maps link to automatically extract coordinates",
      extractBtn: "Extract Coordinates",
      extracting: "Extracting...",
      latLabel: "Latitude",
      lngLabel: "Longitude",
      latPlaceholder: "20.2120000",
      lngPlaceholder: "-87.4290000",
      coordinatesLabel: "Coordinates",
      manualEntry: "Or enter coordinates manually:",
      success: "Coordinates extracted",
      successDesc: "Coordinates were successfully extracted from the link",
      error: "Extraction error",
      viewOnMaps: "View on Google Maps",
    },
  };

  const labels = t[language];

  const handleUrlChange = useCallback(
    (value: string) => {
      onLocationChange({
        googleMapsUrl: value || null,
        latitude: String(latitude ?? ""),
        longitude: String(longitude ?? ""),
      });
      setParseStatus(null);
    },
    [latitude, longitude, onLocationChange]
  );

  const handleLatChange = useCallback(
    (value: string) => {
      onLocationChange({
        googleMapsUrl: googleMapsUrl,
        latitude: value || null,
        longitude: String(longitude ?? ""),
        locationConfidence: "manual",
      });
    },
    [googleMapsUrl, longitude, onLocationChange]
  );

  const handleLngChange = useCallback(
    (value: string) => {
      onLocationChange({
        googleMapsUrl: googleMapsUrl,
        latitude: String(latitude ?? ""),
        longitude: value || null,
        locationConfidence: "manual",
      });
    },
    [googleMapsUrl, latitude, onLocationChange]
  );

  const parseGoogleMapsUrl = async () => {
    if (!googleMapsUrl) return;

    setIsParsing(true);
    setParseStatus(null);

    try {
      const result = await apiRequest("/api/external-units/parse-maps-url", {
        method: "POST",
        body: JSON.stringify({ url: googleMapsUrl }),
        headers: { "Content-Type": "application/json" },
      });

      if (result.success && result.data) {
        onLocationChange({
          googleMapsUrl: googleMapsUrl,
          latitude: String(result.data.latitude),
          longitude: String(result.data.longitude),
          locationConfidence: result.data.confidence,
        });
        setParseStatus("success");
        toast({
          title: labels.success,
          description: labels.successDesc,
        });
      } else {
        setParseStatus("error");
        toast({
          variant: "destructive",
          title: labels.error,
          description: result.error || "Could not extract coordinates",
        });
      }
    } catch (error) {
      setParseStatus("error");
      toast({
        variant: "destructive",
        title: labels.error,
        description: "Error processing request",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const hasValidCoordinates =
    latitude &&
    longitude &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  const googleMapsViewUrl = hasValidCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{labels.mapsUrlLabel}</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="url"
              value={googleMapsUrl || ""}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={labels.mapsUrlPlaceholder}
              disabled={disabled}
              className="pr-10"
              data-testid="input-google-maps-url"
            />
            {parseStatus === "success" && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
            {parseStatus === "error" && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={parseGoogleMapsUrl}
            disabled={disabled || isParsing || !googleMapsUrl}
            data-testid="btn-extract-coordinates"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {labels.extracting}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {labels.extractBtn}
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{labels.mapsUrlHelper}</p>
      </div>

      <div className="space-y-2">
        <Label>{labels.coordinatesLabel}</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {labels.latLabel}
            </Label>
            <Input
              type="number"
              step="0.0000001"
              value={latitude ?? ""}
              onChange={(e) => handleLatChange(e.target.value)}
              placeholder={labels.latPlaceholder}
              disabled={disabled}
              data-testid="input-latitude"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {labels.lngLabel}
            </Label>
            <Input
              type="number"
              step="0.0000001"
              value={longitude ?? ""}
              onChange={(e) => handleLngChange(e.target.value)}
              placeholder={labels.lngPlaceholder}
              disabled={disabled}
              data-testid="input-longitude"
            />
          </div>
        </div>
      </div>

      {hasValidCoordinates && googleMapsViewUrl && (
        <div className="flex justify-end">
          <a
            href={googleMapsViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            data-testid="link-view-on-maps"
          >
            <ExternalLink className="h-3 w-3" />
            {labels.viewOnMaps}
          </a>
        </div>
      )}
    </div>
  );
}
