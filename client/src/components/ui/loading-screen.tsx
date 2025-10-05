import { cn } from "@/lib/utils"
import logoPath from "@assets/loho homesapp negro_1759672544955.png"

interface LoadingScreenProps {
  className?: string;
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[200px]", className)}>
      <img 
        src={logoPath} 
        alt="HomesApp" 
        className="h-24 w-auto animate-pulse-color"
        data-testid="img-loading-logo"
      />
    </div>
  );
}
