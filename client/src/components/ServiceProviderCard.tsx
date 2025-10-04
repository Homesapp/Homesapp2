import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Phone } from "lucide-react";

export type Service = {
  name: string;
  price: number;
  description: string;
};

export type ServiceProviderCardProps = {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  services: Service[];
  available?: boolean;
  onMessage?: () => void;
  onCall?: () => void;
  onHire?: () => void;
};

export function ServiceProviderCard({
  name,
  avatar,
  specialty,
  rating,
  reviewCount,
  services,
  available = false,
  onMessage,
  onCall,
  onHire,
}: ServiceProviderCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="relative">
          <Avatar className="h-20 w-20">
            {avatar && <AvatarImage src={avatar} />}
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          {available && (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-status-online border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-lg">{name}</h3>
          <Badge variant="secondary">{specialty}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-sm font-medium">Servicios:</p>
        {services.slice(0, 2).map((service, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium">{service.name}</span>
              <span className="text-primary whitespace-nowrap">
                ${service.price.toLocaleString()} MXN
              </span>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">{service.description}</p>
          </div>
        ))}
        {services.length > 2 && (
          <p className="text-xs text-muted-foreground">+{services.length - 2} servicios más</p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        {onMessage && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onMessage}
            data-testid="button-message-provider"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Mensaje
          </Button>
        )}
        {onCall && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCall}
            data-testid="button-call-provider"
          >
            <Phone className="h-4 w-4 mr-1" />
            Llamar
          </Button>
        )}
        {onHire && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onHire}
            data-testid="button-hire-provider"
          >
            Contratar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
