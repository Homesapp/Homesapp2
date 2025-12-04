import { Link, useLocation } from "wouter";
import { Users, DollarSign, User, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface NavItem {
  url: string;
  icon: typeof Users;
  labelKey: string;
}

const navItems: NavItem[] = [
  { url: "/external/clients", icon: Users, labelKey: "sidebar.sellerLeads" },
  { url: "/external/seller-commissions", icon: DollarSign, labelKey: "sidebar.sellerCommissions" },
  { url: "/perfil", icon: User, labelKey: "sidebar.profile" },
  { url: "/external/seller-help", icon: HelpCircle, labelKey: "sidebar.sellerHelp" },
];

export function SellerBottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-bottom"
      data-testid="nav-seller-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.url || location.startsWith(item.url + '/');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.url} 
              href={item.url}
              data-testid={`bottomnav-${item.labelKey.replace('sidebar.', '')}`}
            >
              <div 
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-lg transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-0.5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] font-medium truncate max-w-[60px]",
                  isActive && "text-primary"
                )}>
                  {t(item.labelKey)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
