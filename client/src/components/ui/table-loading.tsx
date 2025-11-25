import { cn } from "@/lib/utils"
import logoPath from "@assets/H mes (500 x 300 px)_1759672952263.png"
import { useLanguage } from "@/contexts/LanguageContext"

interface TableLoadingProps {
  className?: string;
  minHeight?: string;
}

export function TableLoading({ className, minHeight = "300px" }: TableLoadingProps) {
  const { t } = useLanguage();
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3 w-full bg-background/50",
        className
      )}
      style={{ minHeight }}
      data-testid="table-loading-container"
    >
      <img 
        src={logoPath} 
        alt="HomesApp" 
        className="h-12 w-auto animate-pulse"
        data-testid="img-table-loading-logo"
      />
      <p className="text-sm text-muted-foreground animate-pulse" data-testid="text-table-loading">
        {t("common.loading")}
      </p>
    </div>
  );
}
