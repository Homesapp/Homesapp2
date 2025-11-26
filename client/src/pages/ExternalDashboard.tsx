import { Button } from "@/components/ui/button";
import { 
  Users, 
  Key, 
  Building2, 
  ScrollText, 
  FileText, 
  DollarSign, 
  Wrench, 
  Calendar, 
  UserCircle2 
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function ExternalDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const userName = user?.firstName || user?.username || (language === "es" ? "Usuario" : "User");

  const quickLinks = [
    { 
      title: language === "es" ? "Cuentas" : "Accounts", 
      href: "/external/accounts", 
      icon: Users, 
      color: "text-indigo-600",
      roles: ["master", "admin", "external_agency_admin"]
    },
    { 
      title: language === "es" ? "Accesos" : "Accesses", 
      href: "/external/accesses", 
      icon: Key, 
      color: "text-amber-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Condominios" : "Condominiums", 
      href: "/external/condominiums", 
      icon: Building2, 
      color: "text-blue-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Contratos" : "Contracts", 
      href: "/external/contracts", 
      icon: ScrollText, 
      color: "text-cyan-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Rentas" : "Rentals", 
      href: "/external/rentals", 
      icon: FileText, 
      color: "text-purple-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Contabilidad" : "Accounting", 
      href: "/external/accounting", 
      icon: DollarSign, 
      color: "text-green-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Mantenimiento" : "Maintenance", 
      href: "/external/maintenance", 
      icon: Wrench, 
      color: "text-orange-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance"]
    },
    { 
      title: language === "es" ? "Calendario" : "Calendar", 
      href: "/external/calendar", 
      icon: Calendar, 
      color: "text-rose-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance"]
    },
    { 
      title: language === "es" ? "Propietarios" : "Owners", 
      href: "/external/owners/portfolio", 
      icon: Users, 
      color: "text-teal-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Clientes" : "Clients", 
      href: "/external/clients", 
      icon: UserCircle2, 
      color: "text-pink-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_staff"]
    },
  ];

  const userRole = user?.role || "";
  const filteredLinks = quickLinks.filter(link => 
    link.roles.includes(userRole) || userRole === "master" || userRole === "admin"
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          {language === "es" ? `¡Bienvenido, ${userName}!` : `Welcome, ${userName}!`}
        </h1>
        <p className="text-muted-foreground">
          {language === "es" 
            ? "Selecciona una sección para comenzar"
            : "Select a section to get started"}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 hover-elevate"
              data-testid={`button-quick-${link.href.split('/').pop()}`}
            >
              <link.icon className={`h-6 w-6 ${link.color}`} />
              <span className="text-sm font-medium">{link.title}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
