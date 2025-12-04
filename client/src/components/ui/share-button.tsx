import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string | null | undefined;
  title?: string;
  text?: string;
  recipientPhone?: string;
  recipientName?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  prominent?: boolean;
}

export function ShareButton({
  url,
  title,
  text,
  recipientPhone,
  recipientName,
  className,
  variant = "default",
  size = "default",
  showLabel = true,
  prominent = false,
}: ShareButtonProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const translations = {
    es: {
      share: "Compartir",
      shareOffer: "Compartir Oferta",
      copied: "Link copiado",
      copiedDesc: "Pégalo en tu app de mensajería",
      copyLink: "Copiar enlace",
      openWhatsApp: "Abrir WhatsApp",
      shareNative: "Compartir...",
      noLink: "Sin enlace disponible",
      noLinkDesc: "Esta oferta no tiene un enlace para compartir",
      shareError: "Error al compartir",
      shareErrorDesc: "No se pudo abrir el menú de compartir",
    },
    en: {
      share: "Share",
      shareOffer: "Share Offer",
      copied: "Link copied",
      copiedDesc: "Paste it in your messaging app",
      copyLink: "Copy link",
      openWhatsApp: "Open WhatsApp",
      shareNative: "Share...",
      noLink: "No link available",
      noLinkDesc: "This offer doesn't have a shareable link",
      shareError: "Share error",
      shareErrorDesc: "Could not open share menu",
    },
  };

  const t = translations[language] || translations.es;

  const isValidUrl = url && url.trim().length > 0;

  const canUseNativeShare = typeof navigator !== "undefined" && navigator.share;

  const handleCopyToClipboard = async () => {
    if (!isValidUrl) {
      toast({
        variant: "destructive",
        title: t.noLink,
        description: t.noLinkDesc,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url!);
      setCopied(true);
      toast({
        title: t.copied,
        description: t.copiedDesc,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: t.shareError,
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (!isValidUrl) {
      toast({
        variant: "destructive",
        title: t.noLink,
        description: t.noLinkDesc,
      });
      return;
    }

    const cleanPhone = recipientPhone?.replace(/\D/g, "") || "";
    const message =
      language === "es"
        ? `Hola${recipientName ? ` ${recipientName}` : ""}, te comparto ${title || "esta oferta"}: ${url}`
        : `Hi${recipientName ? ` ${recipientName}` : ""}, here's ${title || "this offer"}: ${url}`;

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (!isValidUrl) {
      toast({
        variant: "destructive",
        title: t.noLink,
        description: t.noLinkDesc,
      });
      return;
    }

    if (!canUseNativeShare) {
      handleCopyToClipboard();
      return;
    }

    setIsSharing(true);

    try {
      await navigator.share({
        title: title || (language === "es" ? "Oferta de Propiedad" : "Property Offer"),
        text:
          text ||
          (language === "es"
            ? `Te comparto esta oferta de propiedad`
            : `Check out this property offer`),
        url: url!,
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        handleCopyToClipboard();
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!isValidUrl) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className={cn("text-muted-foreground", className)}
        data-testid="button-share-disabled"
      >
        <AlertCircle className="h-4 w-4" />
        {showLabel && <span className="ml-2">{t.noLink}</span>}
      </Button>
    );
  }

  if (prominent) {
    return (
      <div className={cn("flex flex-col gap-2 w-full", className)}>
        <Button
          size="lg"
          className="w-full h-14 text-base font-medium gap-3"
          onClick={handleNativeShare}
          disabled={isSharing}
          data-testid="button-share-prominent"
        >
          <Share2 className="h-5 w-5" />
          {isSharing ? "..." : t.shareOffer}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 gap-2"
            onClick={handleWhatsAppShare}
            data-testid="button-share-whatsapp"
          >
            <SiWhatsapp className="h-5 w-5 text-green-600" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 gap-2"
            onClick={handleCopyToClipboard}
            data-testid="button-share-copy"
          >
            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            {copied ? t.copied : t.copyLink}
          </Button>
        </div>
      </div>
    );
  }

  if (canUseNativeShare) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        disabled={isSharing}
        className={className}
        data-testid="button-share-native"
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="ml-2">{t.share}</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} data-testid="button-share-menu">
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">{t.share}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleWhatsAppShare} data-testid="menu-share-whatsapp">
          <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
          {t.openWhatsApp}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyToClipboard} data-testid="menu-share-copy">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {t.copyLink}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
