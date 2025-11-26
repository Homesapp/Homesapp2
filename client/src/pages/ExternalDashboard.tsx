import { Card, CardContent } from "@/components/ui/card";
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
      description: language === "es" ? "Gestión de usuarios" : "User management",
      href: "/external/accounts", 
      icon: Users, 
      gradient: "from-indigo-500 to-indigo-600",
      roles: ["master", "admin", "external_agency_admin"]
    },
    { 
      title: language === "es" ? "Accesos" : "Accesses", 
      description: language === "es" ? "Control de accesos" : "Access control",
      href: "/external/accesses", 
      icon: Key, 
      gradient: "from-amber-500 to-amber-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Condominios" : "Condominiums", 
      description: language === "es" ? "Propiedades y unidades" : "Properties and units",
      href: "/external/condominiums", 
      icon: Building2, 
      gradient: "from-blue-500 to-blue-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Contratos" : "Contracts", 
      description: language === "es" ? "Documentos legales" : "Legal documents",
      href: "/external/contracts", 
      icon: ScrollText, 
      gradient: "from-cyan-500 to-cyan-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_staff"]
    },
    { 
      title: language === "es" ? "Rentas" : "Rentals", 
      description: language === "es" ? "Contratos activos" : "Active contracts",
      href: "/external/rentals", 
      icon: FileText, 
      gradient: "from-purple-500 to-purple-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Contabilidad" : "Accounting", 
      description: language === "es" ? "Finanzas y reportes" : "Finances and reports",
      href: "/external/accounting", 
      icon: DollarSign, 
      gradient: "from-emerald-500 to-emerald-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Mantenimiento" : "Maintenance", 
      description: language === "es" ? "Tickets y trabajadores" : "Tickets and workers",
      href: "/external/maintenance", 
      icon: Wrench, 
      gradient: "from-orange-500 to-orange-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_maintenance"]
    },
    { 
      title: language === "es" ? "Calendario" : "Calendar", 
      description: language === "es" ? "Eventos y citas" : "Events and appointments",
      href: "/external/calendar", 
      icon: Calendar, 
      gradient: "from-rose-500 to-rose-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance"]
    },
    { 
      title: language === "es" ? "Propietarios" : "Owners", 
      description: language === "es" ? "Portafolio de dueños" : "Owners portfolio",
      href: "/external/owners/portfolio", 
      icon: Users, 
      gradient: "from-teal-500 to-teal-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_accounting"]
    },
    { 
      title: language === "es" ? "Clientes" : "Clients", 
      description: language === "es" ? "CRM y seguimiento" : "CRM and tracking",
      href: "/external/clients", 
      icon: UserCircle2, 
      gradient: "from-pink-500 to-pink-600",
      roles: ["master", "admin", "external_agency_admin", "external_agency_staff"]
    },
  ];

  const userRole = user?.role || "";
  const filteredLinks = quickLinks.filter(link => 
    link.roles.includes(userRole) || userRole === "master" || userRole === "admin"
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
              {language === "es" ? `Hola, ${userName}` : `Hello, ${userName}`}
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === "es" 
                ? "¿Qué te gustaría hacer hoy?"
                : "What would you like to do today?"}
            </p>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card 
                  className="group cursor-pointer h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 overflow-hidden"
                  data-testid={`card-quick-${link.href.split('/').pop()}`}
                >
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${link.gradient} p-4 flex items-center justify-center`}>
                      <link.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="p-4 bg-card">
                      <h3 className="font-semibold text-sm">{link.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {link.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
