import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Calendar, 
  Heart, 
  MessageCircle, 
  Building2, 
  Users, 
  FileText, 
  ClipboardCheck,
  DollarSign,
  Settings,
  Video,
  PlayCircle,
  BookOpen,
  UserCog,
  Package,
  Briefcase,
  Scale,
  Calculator,
  Wrench,
  Home,
  Star,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MapPin,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Palmtree,
  Sun,
  Waves,
  Eye
} from "lucide-react";

type UserRole = "master" | "admin" | "admin_jr" | "seller" | "owner" | "management" | "concierge" | "provider" | "cliente" | "abogado" | "contador" | "agente_servicios_especiales";

interface HelpSection {
  id: string;
  icon: any;
  titleKey: string;
  descKey: string;
  sections: {
    titleKey: string;
    contentKey: string;
    videoId?: string;
    steps?: string[];
  }[];
}

const roleHelpContent: Record<UserRole, HelpSection[]> = {
  cliente: [
    {
      id: "search",
      icon: Search,
      titleKey: "help.cliente.search.title",
      descKey: "help.cliente.search.desc",
      sections: [
        {
          titleKey: "help.cliente.search.howTo.title",
          contentKey: "help.cliente.search.howTo.content",
          videoId: "search-properties-demo",
          steps: [
            "help.cliente.search.step1",
            "help.cliente.search.step2",
            "help.cliente.search.step3",
            "help.cliente.search.step4"
          ]
        },
        {
          titleKey: "help.cliente.search.filters.title",
          contentKey: "help.cliente.search.filters.content",
          steps: [
            "help.cliente.search.filters.step1",
            "help.cliente.search.filters.step2",
            "help.cliente.search.filters.step3"
          ]
        }
      ]
    },
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.cliente.appointments.title",
      descKey: "help.cliente.appointments.desc",
      sections: [
        {
          titleKey: "help.cliente.appointments.schedule.title",
          contentKey: "help.cliente.appointments.schedule.content",
          videoId: "schedule-appointment-demo",
          steps: [
            "help.cliente.appointments.schedule.step1",
            "help.cliente.appointments.schedule.step2",
            "help.cliente.appointments.schedule.step3",
            "help.cliente.appointments.schedule.step4"
          ]
        },
        {
          titleKey: "help.cliente.appointments.manage.title",
          contentKey: "help.cliente.appointments.manage.content"
        }
      ]
    },
    {
      id: "favorites",
      icon: Heart,
      titleKey: "help.cliente.favorites.title",
      descKey: "help.cliente.favorites.desc",
      sections: [
        {
          titleKey: "help.cliente.favorites.add.title",
          contentKey: "help.cliente.favorites.add.content",
          steps: [
            "help.cliente.favorites.add.step1",
            "help.cliente.favorites.add.step2",
            "help.cliente.favorites.add.step3"
          ]
        }
      ]
    },
    {
      id: "cards",
      icon: FileText,
      titleKey: "help.cliente.cards.title",
      descKey: "help.cliente.cards.desc",
      sections: [
        {
          titleKey: "help.cliente.cards.create.title",
          contentKey: "help.cliente.cards.create.content",
          videoId: "presentation-cards-demo",
          steps: [
            "help.cliente.cards.create.step1",
            "help.cliente.cards.create.step2",
            "help.cliente.cards.create.step3"
          ]
        }
      ]
    },
    {
      id: "chat",
      icon: MessageCircle,
      titleKey: "help.cliente.chat.title",
      descKey: "help.cliente.chat.desc",
      sections: [
        {
          titleKey: "help.cliente.chat.howTo.title",
          contentKey: "help.cliente.chat.howTo.content",
          steps: [
            "help.cliente.chat.howTo.step1",
            "help.cliente.chat.howTo.step2",
            "help.cliente.chat.howTo.step3"
          ]
        }
      ]
    }
  ],
  owner: [
    {
      id: "properties",
      icon: Building2,
      titleKey: "help.owner.properties.title",
      descKey: "help.owner.properties.desc",
      sections: [
        {
          titleKey: "help.owner.properties.upload.title",
          contentKey: "help.owner.properties.upload.content",
          videoId: "upload-property-demo",
          steps: [
            "help.owner.properties.upload.step1",
            "help.owner.properties.upload.step2",
            "help.owner.properties.upload.step3",
            "help.owner.properties.upload.step4"
          ]
        },
        {
          titleKey: "help.owner.properties.manage.title",
          contentKey: "help.owner.properties.manage.content"
        },
        {
          titleKey: "help.owner.properties.changeRequests.title",
          contentKey: "help.owner.properties.changeRequests.content"
        }
      ]
    },
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.owner.appointments.title",
      descKey: "help.owner.appointments.desc",
      sections: [
        {
          titleKey: "help.owner.appointments.autoApprove.title",
          contentKey: "help.owner.appointments.autoApprove.content",
          steps: [
            "help.owner.appointments.autoApprove.step1",
            "help.owner.appointments.autoApprove.step2"
          ]
        },
        {
          titleKey: "help.owner.appointments.manage.title",
          contentKey: "help.owner.appointments.manage.content"
        }
      ]
    },
    {
      id: "staff",
      icon: Users,
      titleKey: "help.owner.staff.title",
      descKey: "help.owner.staff.desc",
      sections: [
        {
          titleKey: "help.owner.staff.assign.title",
          contentKey: "help.owner.staff.assign.content",
          steps: [
            "help.owner.staff.assign.step1",
            "help.owner.staff.assign.step2",
            "help.owner.staff.assign.step3"
          ]
        }
      ]
    },
    {
      id: "contracts",
      icon: FileText,
      titleKey: "help.owner.contracts.title",
      descKey: "help.owner.contracts.desc",
      sections: [
        {
          titleKey: "help.owner.contracts.view.title",
          contentKey: "help.owner.contracts.view.content"
        },
        {
          titleKey: "help.owner.contracts.documents.title",
          contentKey: "help.owner.contracts.documents.content"
        },
        {
          titleKey: "help.owner.contracts.payments.title",
          contentKey: "help.owner.contracts.payments.content"
        },
        {
          titleKey: "help.owner.contracts.services.title",
          contentKey: "help.owner.contracts.services.content",
          videoId: "extraordinary-services-demo"
        }
      ]
    },
    {
      id: "directory",
      icon: Wrench,
      titleKey: "help.owner.directory.title",
      descKey: "help.owner.directory.desc",
      sections: [
        {
          titleKey: "help.owner.directory.find.title",
          contentKey: "help.owner.directory.find.content"
        }
      ]
    }
  ],
  seller: [
    {
      id: "leads",
      icon: Users,
      titleKey: "help.seller.leads.title",
      descKey: "help.seller.leads.desc",
      sections: [
        {
          titleKey: "help.seller.leads.manage.title",
          contentKey: "help.seller.leads.manage.content",
          videoId: "leads-management-demo",
          steps: [
            "help.seller.leads.manage.step1",
            "help.seller.leads.manage.step2",
            "help.seller.leads.manage.step3"
          ]
        },
        {
          titleKey: "help.seller.leads.convert.title",
          contentKey: "help.seller.leads.convert.content"
        }
      ]
    },
    {
      id: "rentals",
      icon: Building2,
      titleKey: "help.seller.rentals.title",
      descKey: "help.seller.rentals.desc",
      sections: [
        {
          titleKey: "help.seller.rentals.kanban.title",
          contentKey: "help.seller.rentals.kanban.content",
          videoId: "rentals-kanban-demo"
        },
        {
          titleKey: "help.seller.rentals.process.title",
          contentKey: "help.seller.rentals.process.content"
        }
      ]
    },
    {
      id: "income",
      icon: DollarSign,
      titleKey: "help.seller.income.title",
      descKey: "help.seller.income.desc",
      sections: [
        {
          titleKey: "help.seller.income.view.title",
          contentKey: "help.seller.income.view.content"
        },
        {
          titleKey: "help.seller.income.commissions.title",
          contentKey: "help.seller.income.commissions.content"
        }
      ]
    }
  ],
  concierge: [
    {
      id: "appointments",
      icon: Calendar,
      titleKey: "help.concierge.appointments.title",
      descKey: "help.concierge.appointments.desc",
      sections: [
        {
          titleKey: "help.concierge.appointments.view.title",
          contentKey: "help.concierge.appointments.view.content",
          videoId: "concierge-appointments-demo"
        },
        {
          titleKey: "help.concierge.appointments.report.title",
          contentKey: "help.concierge.appointments.report.content",
          steps: [
            "help.concierge.appointments.report.step1",
            "help.concierge.appointments.report.step2",
            "help.concierge.appointments.report.step3"
          ]
        }
      ]
    },
    {
      id: "reviews",
      icon: Star,
      titleKey: "help.concierge.reviews.title",
      descKey: "help.concierge.reviews.desc",
      sections: [
        {
          titleKey: "help.concierge.reviews.leave.title",
          contentKey: "help.concierge.reviews.leave.content"
        }
      ]
    },
    {
      id: "chat",
      icon: MessageCircle,
      titleKey: "help.concierge.chat.title",
      descKey: "help.concierge.chat.desc",
      sections: [
        {
          titleKey: "help.concierge.chat.clients.title",
          contentKey: "help.concierge.chat.clients.content"
        }
      ]
    }
  ],
  provider: [
    {
      id: "profile",
      icon: UserCog,
      titleKey: "help.provider.profile.title",
      descKey: "help.provider.profile.desc",
      sections: [
        {
          titleKey: "help.provider.profile.setup.title",
          contentKey: "help.provider.profile.setup.content",
          videoId: "provider-profile-demo",
          steps: [
            "help.provider.profile.setup.step1",
            "help.provider.profile.setup.step2",
            "help.provider.profile.setup.step3"
          ]
        }
      ]
    },
    {
      id: "services",
      icon: Package,
      titleKey: "help.provider.services.title",
      descKey: "help.provider.services.desc",
      sections: [
        {
          titleKey: "help.provider.services.add.title",
          contentKey: "help.provider.services.add.content"
        },
        {
          titleKey: "help.provider.services.manage.title",
          contentKey: "help.provider.services.manage.content"
        }
      ]
    },
    {
      id: "bookings",
      icon: CheckCircle,
      titleKey: "help.provider.bookings.title",
      descKey: "help.provider.bookings.desc",
      sections: [
        {
          titleKey: "help.provider.bookings.receive.title",
          contentKey: "help.provider.bookings.receive.content"
        },
        {
          titleKey: "help.provider.bookings.complete.title",
          contentKey: "help.provider.bookings.complete.content"
        }
      ]
    }
  ],
  master: [
    {
      id: "users",
      icon: Users,
      titleKey: "help.admin.users.title",
      descKey: "help.admin.users.desc",
      sections: [
        {
          titleKey: "help.admin.users.manage.title",
          contentKey: "help.admin.users.manage.content",
          videoId: "admin-users-demo"
        },
        {
          titleKey: "help.admin.users.roles.title",
          contentKey: "help.admin.users.roles.content"
        }
      ]
    },
    {
      id: "properties",
      icon: Building2,
      titleKey: "help.admin.properties.title",
      descKey: "help.admin.properties.desc",
      sections: [
        {
          titleKey: "help.admin.properties.approve.title",
          contentKey: "help.admin.properties.approve.content",
          videoId: "admin-approve-properties-demo"
        },
        {
          titleKey: "help.admin.properties.changeRequests.title",
          contentKey: "help.admin.properties.changeRequests.content"
        }
      ]
    },
    {
      id: "contracts",
      icon: FileText,
      titleKey: "help.admin.contracts.title",
      descKey: "help.admin.contracts.desc",
      sections: [
        {
          titleKey: "help.admin.contracts.manage.title",
          contentKey: "help.admin.contracts.manage.content"
        },
        {
          titleKey: "help.admin.contracts.monitoring.title",
          contentKey: "help.admin.contracts.monitoring.content"
        }
      ]
    },
    {
      id: "income",
      icon: DollarSign,
      titleKey: "help.admin.income.title",
      descKey: "help.admin.income.desc",
      sections: [
        {
          titleKey: "help.admin.income.overview.title",
          contentKey: "help.admin.income.overview.content"
        }
      ]
    },
    {
      id: "configuration",
      icon: Settings,
      titleKey: "help.admin.config.title",
      descKey: "help.admin.config.desc",
      sections: [
        {
          titleKey: "help.admin.config.system.title",
          contentKey: "help.admin.config.system.content"
        }
      ]
    }
  ],
  admin: [],
  admin_jr: [],
  abogado: [
    {
      id: "contracts",
      icon: Scale,
      titleKey: "help.abogado.contracts.title",
      descKey: "help.abogado.contracts.desc",
      sections: [
        {
          titleKey: "help.abogado.contracts.review.title",
          contentKey: "help.abogado.contracts.review.content",
          videoId: "lawyer-contracts-demo"
        },
        {
          titleKey: "help.abogado.contracts.templates.title",
          contentKey: "help.abogado.contracts.templates.content"
        },
        {
          titleKey: "help.abogado.contracts.signatures.title",
          contentKey: "help.abogado.contracts.signatures.content"
        }
      ]
    },
    {
      id: "agreements",
      icon: FileText,
      titleKey: "help.abogado.agreements.title",
      descKey: "help.abogado.agreements.desc",
      sections: [
        {
          titleKey: "help.abogado.agreements.manage.title",
          contentKey: "help.abogado.agreements.manage.content"
        }
      ]
    }
  ],
  contador: [
    {
      id: "income",
      icon: Calculator,
      titleKey: "help.contador.income.title",
      descKey: "help.contador.income.desc",
      sections: [
        {
          titleKey: "help.contador.income.transactions.title",
          contentKey: "help.contador.income.transactions.content",
          videoId: "accountant-income-demo"
        },
        {
          titleKey: "help.contador.income.batches.title",
          contentKey: "help.contador.income.batches.content",
          steps: [
            "help.contador.income.batches.step1",
            "help.contador.income.batches.step2",
            "help.contador.income.batches.step3"
          ]
        }
      ]
    },
    {
      id: "reports",
      icon: FileText,
      titleKey: "help.contador.reports.title",
      descKey: "help.contador.reports.desc",
      sections: [
        {
          titleKey: "help.contador.reports.generate.title",
          contentKey: "help.contador.reports.generate.content"
        }
      ]
    }
  ],
  agente_servicios_especiales: [
    {
      id: "requests",
      icon: Briefcase,
      titleKey: "help.agente.requests.title",
      descKey: "help.agente.requests.desc",
      sections: [
        {
          titleKey: "help.agente.requests.receive.title",
          contentKey: "help.agente.requests.receive.content",
          videoId: "service-agent-demo"
        },
        {
          titleKey: "help.agente.requests.process.title",
          contentKey: "help.agente.requests.process.content",
          steps: [
            "help.agente.requests.process.step1",
            "help.agente.requests.process.step2",
            "help.agente.requests.process.step3",
            "help.agente.requests.process.step4",
            "help.agente.requests.process.step5"
          ]
        }
      ]
    },
    {
      id: "providers",
      icon: Users,
      titleKey: "help.agente.providers.title",
      descKey: "help.agente.providers.desc",
      sections: [
        {
          titleKey: "help.agente.providers.coordinate.title",
          contentKey: "help.agente.providers.coordinate.content"
        }
      ]
    },
    {
      id: "quality",
      icon: Star,
      titleKey: "help.agente.quality.title",
      descKey: "help.agente.quality.desc",
      sections: [
        {
          titleKey: "help.agente.quality.ensure.title",
          contentKey: "help.agente.quality.ensure.content"
        }
      ]
    }
  ],
  management: []
};

// Admin and Admin Jr share Master content
roleHelpContent.admin = roleHelpContent.master;
roleHelpContent.admin_jr = roleHelpContent.master;
roleHelpContent.management = roleHelpContent.master;

export default function Help() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userRole = (user?.role || "cliente") as UserRole;

  const helpSections = roleHelpContent[userRole] || roleHelpContent.cliente;

  const VideoPlaceholder = ({ videoId }: { videoId: string }) => (
    <div className="relative w-full aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
      <div className="text-center space-y-2">
        <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("help.video.placeholder")}</p>
        <p className="text-xs text-muted-foreground">Video ID: {videoId}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          {t("help.page.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("help.page.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">{t(`help.${userRole}.overview.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`help.${userRole}.overview.desc`)}</p>
          </div>
        </div>

        {helpSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SectionIcon className="h-5 w-5" />
                  {t(section.titleKey)}
                </CardTitle>
                <CardDescription>{t(section.descKey)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.sections.map((subsection, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          {t(subsection.titleKey)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {t(subsection.contentKey)}
                        </p>
                        
                        {subsection.videoId && (
                          <div className="space-y-2">
                            <Badge variant="secondary" className="gap-1">
                              <Video className="h-3 w-3" />
                              {t("help.video.tutorial")}
                            </Badge>
                            <VideoPlaceholder videoId={subsection.videoId} />
                          </div>
                        )}

                        {subsection.steps && subsection.steps.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-semibold text-sm">{t("help.steps.title")}</p>
                            <ol className="list-decimal list-inside space-y-2">
                              {subsection.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="text-sm text-muted-foreground">
                                  {t(step)}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t("help.support.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("help.support.contactDesc")}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {t("help.support.chat")}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {t("help.support.feedback")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(userRole === "seller" || userRole === "master" || userRole === "admin" || user?.role === "external_agency_seller") && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Propuestas de Diseño - Nuevo Home Page
            </CardTitle>
            <CardDescription>
              Explora 3 diseños diferentes para la nueva página principal. Selecciona el que más te guste.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="modern" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="modern" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Moderno</span>
                </TabsTrigger>
                <TabsTrigger value="elegant" className="gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Elegante</span>
                </TabsTrigger>
                <TabsTrigger value="tropical" className="gap-1">
                  <Palmtree className="h-4 w-4" />
                  <span className="hidden sm:inline">Tropical</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="modern" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <div className="p-4 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-emerald-400" />
                        <span className="font-bold text-lg">HomesApp</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-white border-white/30 text-xs">Iniciar Sesión</Badge>
                        <Badge className="bg-emerald-500 text-xs">Registrarse</Badge>
                      </div>
                    </div>
                    <div className="p-8 text-center space-y-4">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">#1 en Tulum</Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold">Encuentra tu hogar ideal en Tulum</h2>
                      <p className="text-slate-300 text-sm max-w-md mx-auto">Propiedades exclusivas en la Riviera Maya. Renta o compra con los mejores asesores.</p>
                      <div className="flex justify-center gap-2 pt-2">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">Explorar Propiedades</Button>
                        <Button size="sm" variant="outline" className="text-white border-white/30">Contactar</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border mb-4">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Buscar por ubicación, tipo, precio...</span>
                      <Button size="sm" className="ml-auto bg-emerald-500 text-xs h-7">Buscar</Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 text-center text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800">
                    <span className="font-medium">Diseño Moderno:</span> Limpio, profesional, enfocado en búsqueda
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="elegant" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 text-white">
                    <div className="p-4 flex items-center justify-between border-b border-amber-700/30">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                          <Home className="h-4 w-4 text-stone-900" />
                        </div>
                        <span className="font-serif text-xl tracking-wide">HOMES<span className="text-amber-400">APP</span></span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-200/70">Propiedades</span>
                        <span className="text-amber-200/70">Servicios</span>
                        <span className="text-amber-200/70">Contacto</span>
                      </div>
                    </div>
                    <div className="p-8 text-center space-y-4">
                      <div className="flex justify-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif">Propiedades de Lujo</h2>
                      <p className="text-amber-100/70 text-sm max-w-sm mx-auto font-light">Experiencia inmobiliaria premium en los destinos más exclusivos de la Riviera Maya</p>
                      <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 font-medium">
                        Descubrir Colección
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-stone-100 dark:bg-stone-900">
                    <div className="grid grid-cols-3 gap-3">
                      {["Villas", "Penthouses", "Beachfront"].map(type => (
                        <div key={type} className="p-3 text-center bg-white dark:bg-stone-800 rounded-lg border border-amber-200/30 dark:border-amber-700/30">
                          <Building2 className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                          <span className="text-xs font-medium">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 text-center text-xs text-muted-foreground bg-stone-50 dark:bg-stone-800">
                    <span className="font-medium">Diseño Elegante:</span> Lujo, sofisticación, tonos dorados
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tropical" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palmtree className="h-6 w-6" />
                        <span className="font-bold text-lg">HomesApp</span>
                        <Sun className="h-4 w-4 text-yellow-300" />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-white border-white/50 text-xs">ES</Badge>
                        <Badge className="bg-white/20 text-xs">Entrar</Badge>
                      </div>
                    </div>
                    <div className="p-8 text-center space-y-4">
                      <div className="flex justify-center gap-2 text-yellow-200">
                        <Waves className="h-5 w-5" />
                        <Palmtree className="h-5 w-5" />
                        <Sun className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold">Vive el Paraíso en Tulum</h2>
                      <p className="text-white/80 text-sm max-w-md mx-auto">Descubre propiedades frente al mar, en la selva o en el corazón del pueblo mágico</p>
                      <div className="flex justify-center gap-2 pt-2">
                        <Button size="sm" className="bg-white text-teal-600 hover:bg-white/90">Ver Propiedades</Button>
                        <Button size="sm" variant="outline" className="text-white border-white/50">WhatsApp</Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-b from-cyan-50 to-white dark:from-cyan-950 dark:to-slate-900">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Waves, label: "Playa", color: "text-blue-500" },
                        { icon: Palmtree, label: "Selva", color: "text-green-500" },
                        { icon: Building2, label: "Pueblo", color: "text-amber-500" },
                        { icon: Eye, label: "Cenotes", color: "text-cyan-500" }
                      ].map(item => (
                        <div key={item.label} className="p-2 text-center bg-white dark:bg-slate-800 rounded-lg border flex items-center gap-2 justify-center">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 text-center text-xs text-muted-foreground bg-cyan-50/50 dark:bg-cyan-950/50">
                    <span className="font-medium">Diseño Tropical:</span> Vibrante, fresco, inspirado en el Caribe
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-2">¿Te gusta algún diseño? Dinos cuál prefieres para implementarlo.</p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Moderno</Badge>
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Elegante</Badge>
                <Badge variant="secondary" className="cursor-pointer hover-elevate">Tropical</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
