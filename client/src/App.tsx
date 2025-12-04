import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { apiRequest } from "@/lib/queryClient";
import { PortalAuthProvider } from "@/contexts/PortalAuthContext";
import { ProtectedRoute, ROLE_GROUPS } from "@/components/ProtectedRoute";

import PublicDashboard from "@/components/PublicDashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const ExternalLogin = lazy(() => import("@/pages/ExternalLogin"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ForcePasswordChange = lazy(() => import("@/pages/ForcePasswordChange"));
const PropertySearch = lazy(() => import("@/pages/PropertySearch"));
const InteractiveMap = lazy(() => import("@/pages/InteractiveMap"));
const PropertyDetails = lazy(() => import("@/pages/PropertyDetails"));
const PropertyFullDetails = lazy(() => import("@/pages/PropertyFullDetails"));
const PublicUnitDetail = lazy(() => import("@/pages/PublicUnitDetail"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const PublicOfferForm = lazy(() => import("@/pages/PublicOfferForm"));
const PublicRentalForm = lazy(() => import("@/pages/PublicRentalForm"));
const PublicOwnerForm = lazy(() => import("@/pages/PublicOwnerForm"));
const PublicOfferBySlug = lazy(() => import("@/pages/PublicOfferBySlug"));
const PublicRentalFormBySlug = lazy(() => import("@/pages/PublicRentalFormBySlug"));
const PublicClientRegistration = lazy(() => import("@/pages/PublicClientRegistration"));
const LeadRegistrationBroker = lazy(() => import("@/pages/LeadRegistrationBroker"));
const PublicLeadRegistration = lazy(() => import("@/pages/PublicLeadRegistration"));
const PublicPropertySubmission = lazy(() => import("@/pages/PublicPropertySubmission"));
const PropertySubmissionSuccess = lazy(() => import("@/pages/PropertySubmissionSuccess"));
const ProviderApplication = lazy(() => import("@/pages/ProviderApplication"));
const Apply = lazy(() => import("@/pages/Apply"));
const PortalLogin = lazy(() => import("@/pages/PortalLogin"));
const TenantPortal = lazy(() => import("@/pages/TenantPortal"));
const OwnerPortal = lazy(() => import("@/pages/OwnerPortal"));

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SellerDashboard = lazy(() => import("@/pages/SellerDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const OwnerDashboard = lazy(() => import("@/pages/OwnerDashboard"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const ExternalDashboard = lazy(() => import("@/pages/ExternalDashboard"));

const LeadsKanban = lazy(() => import("@/pages/LeadsKanban"));
const RentalsKanban = lazy(() => import("@/pages/RentalsKanban"));
const Properties = lazy(() => import("@/pages/Properties"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const AdminCalendar = lazy(() => import("@/pages/AdminCalendar"));
const AdminBusinessHours = lazy(() => import("@/pages/AdminBusinessHours"));
const AdminPropertyAssignment = lazy(() => import("@/pages/AdminPropertyAssignment"));
const AdminAppointmentManagement = lazy(() => import("@/pages/AdminAppointmentManagement"));
const AdminSellerManagement = lazy(() => import("@/pages/AdminSellerManagement"));
const AdminSellerGoals = lazy(() => import("@/pages/AdminSellerGoals"));
const AdminPropertyManagement = lazy(() => import("@/pages/AdminPropertyManagement"));
const AdminContactImport = lazy(() => import("@/pages/AdminContactImport"));
const AdminTaskManagement = lazy(() => import("@/pages/AdminTaskManagement"));
const AdminIntegrationsControl = lazy(() => import("@/pages/AdminIntegrationsControl"));
const AdminContractManagement = lazy(() => import("@/pages/AdminContractManagement"));
const ConciergeSchedule = lazy(() => import("@/pages/ConciergeSchedule"));
const Directory = lazy(() => import("@/pages/Directory"));
const PresentationCards = lazy(() => import("@/pages/PresentationCards"));
const Backoffice = lazy(() => import("@/pages/Backoffice"));
const Users = lazy(() => import("@/pages/Users"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const Clients = lazy(() => import("@/pages/Clients"));
const Budgets = lazy(() => import("@/pages/Budgets"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const MyOpportunities = lazy(() => import("@/pages/MyOpportunities"));
const RentalOfferForm = lazy(() => import("@/pages/RentalOfferForm"));
const MyProperties = lazy(() => import("@/pages/MyProperties"));
const OwnerPropertyDetails = lazy(() => import("@/pages/OwnerPropertyDetails"));
const EditOwnerProperty = lazy(() => import("@/pages/EditOwnerProperty"));
const PropertyDocuments = lazy(() => import("@/pages/PropertyDocuments"));
const OwnerFinancialReport = lazy(() => import("@/pages/OwnerFinancialReport"));
const AdminChangeRequests = lazy(() => import("@/pages/AdminChangeRequests"));
const AdminPropertyLimitRequests = lazy(() => import("@/pages/AdminPropertyLimitRequests"));
const AdminInspectionReports = lazy(() => import("@/pages/AdminInspectionReports"));
const AdminAgreementTemplates = lazy(() => import("@/pages/AdminAgreementTemplates"));
const AdminCondominiums = lazy(() => import("@/pages/AdminCondominiums"));
const CondominiumDetails = lazy(() => import("@/pages/CondominiumDetails"));
const AdminSuggestions = lazy(() => import("@/pages/AdminSuggestions"));
const AdminChatbotConfig = lazy(() => import("@/pages/AdminChatbotConfig"));
const AdminSidebarConfig = lazy(() => import("@/pages/admin/SidebarConfig"));
const PropertyInvitations = lazy(() => import("@/pages/admin/PropertyInvitations"));
const AdminPropertyOwnerTerms = lazy(() => import("@/pages/AdminPropertyOwnerTerms"));
const PropertySubmissionWizard = lazy(() => import("@/pages/PropertySubmissionWizard"));
const OwnerAppointments = lazy(() => import("@/pages/OwnerAppointments"));
const ExternalAppointments = lazy(() => import("@/pages/ExternalAppointments"));
const OwnerOffers = lazy(() => import("@/pages/OwnerOffers"));
const AdminProfile = lazy(() => import("@/pages/AdminProfile"));
const Changelog = lazy(() => import("@/pages/Changelog"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Chat = lazy(() => import("@/pages/Chat"));
const Profile = lazy(() => import("@/pages/Profile"));
const CreateUser = lazy(() => import("@/pages/CreateUser"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const AdminReferrals = lazy(() => import("@/pages/AdminReferrals"));
const ActiveRentals = lazy(() => import("@/pages/ActiveRentals"));
const OwnerActiveRentals = lazy(() => import("@/pages/OwnerActiveRentals"));
const Feedback = lazy(() => import("@/pages/Feedback"));
const AdminFeedback = lazy(() => import("@/pages/AdminFeedback"));
const AccountantIncome = lazy(() => import("@/pages/AccountantIncome"));
const AdminIncome = lazy(() => import("@/pages/AdminIncome"));
const MyIncome = lazy(() => import("@/pages/MyIncome"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const AdminSLAConfig = lazy(() => import("@/pages/AdminSLAConfig"));
const AdminLeadScoring = lazy(() => import("@/pages/AdminLeadScoring"));
const Contracts = lazy(() => import("@/pages/Contracts"));
const RoleRequests = lazy(() => import("@/pages/RoleRequests"));
const Help = lazy(() => import("@/pages/Help"));
const SellerCommissions = lazy(() => import("@/pages/SellerCommissions"));
const SellerReports = lazy(() => import("@/pages/SellerReports"));
const SellerPropertyCatalog = lazy(() => import("@/pages/SellerPropertyCatalog"));
const SellerMessageTemplates = lazy(() => import("@/pages/SellerMessageTemplates"));
const SellerSocialMedia = lazy(() => import("@/pages/SellerSocialMedia"));
const SellerGoals = lazy(() => import("@/pages/SellerGoals"));
const SellerCalendar = lazy(() => import("@/pages/SellerCalendar"));
const SellerAppointmentManagement = lazy(() => import("@/pages/SellerAppointmentManagement"));
const AdminPredictiveAnalytics = lazy(() => import("@/pages/AdminPredictiveAnalytics"));
const AdminLegalDocuments = lazy(() => import("@/pages/AdminLegalDocuments"));
const AdminTenantScreening = lazy(() => import("@/pages/AdminTenantScreening"));
const AdminMarketingCampaigns = lazy(() => import("@/pages/AdminMarketingCampaigns"));
const AdminRentalOpportunityRequests = lazy(() => import("@/pages/AdminRentalOpportunityRequests"));
const ContractView = lazy(() => import("@/pages/ContractView"));
const ContractTenantForm = lazy(() => import("@/pages/ContractTenantForm"));
const ContractOwnerForm = lazy(() => import("@/pages/ContractOwnerForm"));
const LawyerDashboard = lazy(() => import("@/pages/LawyerDashboard"));
const ContractLegalReview = lazy(() => import("@/pages/ContractLegalReview"));
const CheckInManagement = lazy(() => import("@/pages/CheckInManagement"));
const HoaManagement = lazy(() => import("@/pages/HoaManagement"));
const OwnerHoaPortal = lazy(() => import("@/pages/OwnerHoaPortal"));
const AdminOfferManagement = lazy(() => import("@/pages/AdminOfferManagement"));
const AdminRentalFormManagement = lazy(() => import("@/pages/AdminRentalFormManagement"));
const ExternalAgencyConfig = lazy(() => import("@/pages/ExternalAgencyConfig"));
const EmailLeadImport = lazy(() => import("@/pages/EmailLeadImport"));
const ExternalAccounts = lazy(() => import("@/pages/ExternalAccounts"));
const ExternalAccesses = lazy(() => import("@/pages/ExternalAccesses"));
const ExternalProperties = lazy(() => import("@/pages/ExternalProperties"));
const ExternalPayments = lazy(() => import("@/pages/ExternalPayments"));
const ExternalMaintenanceTickets = lazy(() => import("@/pages/ExternalMaintenanceTickets"));
const ExternalCondominiums = lazy(() => import("@/pages/ExternalCondominiums"));
const ExternalUnitDetail = lazy(() => import("@/pages/ExternalUnitDetail"));
const ExternalReferralNetwork = lazy(() => import("@/pages/ExternalReferralNetwork"));
const ExternalPropertyRecruitment = lazy(() => import("@/pages/ExternalPropertyRecruitment"));
const ExternalRentalContractDetail = lazy(() => import("@/pages/ExternalRentalContractDetail"));
const ExternalCheckoutReport = lazy(() => import("@/pages/ExternalCheckoutReport"));
const ExternalRentals = lazy(() => import("@/pages/ExternalRentals"));
const ExternalAccounting = lazy(() => import("@/pages/ExternalAccounting"));
const ExternalMaintenance = lazy(() => import("@/pages/ExternalMaintenance"));
const ExternalMaintenanceDetail = lazy(() => import("@/pages/ExternalMaintenanceDetail"));
const ExternalCalendar = lazy(() => import("@/pages/ExternalCalendar"));
const ExternalConfiguration = lazy(() => import("@/pages/ExternalConfiguration"));
const ExternalOwners = lazy(() => import("@/pages/ExternalOwners"));
const ExternalOwnerPortfolio = lazy(() => import("@/pages/ExternalOwnerPortfolio"));
const ExternalMaintenanceWorkers = lazy(() => import("@/pages/ExternalMaintenanceWorkers"));
const ExternalClients = lazy(() => import("@/pages/ExternalClients"));
const ExternalMessages = lazy(() => import("@/pages/ExternalMessages"));
const ExternalSellersManagement = lazy(() => import("@/pages/ExternalSellersManagement"));
const ExternalLeadDetail = lazy(() => import("@/pages/ExternalLeadDetail"));
const ExternalClientEdit = lazy(() => import("@/pages/ExternalClientEdit"));
const ExternalContracts = lazy(() => import("@/pages/ExternalContracts"));
const ExternalAgencyUsers = lazy(() => import("@/pages/ExternalAgencyUsers"));
const AdminExternalAgencies = lazy(() => import("@/pages/AdminExternalAgencies"));
const AdminExternalPublicationRequests = lazy(() => import("@/pages/AdminExternalPublicationRequests"));
const AdminFeaturedProperties = lazy(() => import("@/pages/AdminFeaturedProperties"));
const OnboardingTour = lazy(() => import("@/components/OnboardingTour").then(m => ({ default: m.OnboardingTour })));

function PageLoader() {
  return <LoadingScreen className="h-full min-h-[200px]" />;
}

function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  
  useGlobalErrorHandler();
  
  const { isAuthenticated, isLoading, user } = useAuth();
  const { adminUser, isAdminAuthenticated, isLoading: isAdminLoading } = useAdminAuth();

  const adminLogoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/admin/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });
  
  useAutoLogout({
    enabled: isAuthenticated || isAdminAuthenticated,
    onLogout: isAdminAuthenticated ? () => adminLogoutMutation.mutate() : undefined,
  });

  const needsPasswordChange = !isAdminAuthenticated && user?.requirePasswordChange;
  
  useEffect(() => {
    if (needsPasswordChange && location !== "/force-password-change") {
      setLocation("/force-password-change");
    }
  }, [needsPasswordChange, location, setLocation]);

  useEffect(() => {
    const isExternalAgencyUser = user?.role && 
      ["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_seller"].includes(user.role);
    
    if (isExternalAgencyUser && location === "/" && !needsPasswordChange) {
      setLocation("/external/dashboard");
    }
  }, [user?.role, location, setLocation, needsPasswordChange]);

  if (isLoading || isAdminLoading) {
    return <LoadingScreen className="h-screen" />;
  }

  if (!isAuthenticated && !isAdminAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/login" component={Login} />
          <Route path="/external-login" component={ExternalLogin} />
          <Route path="/register" component={Register} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/force-password-change" component={ForcePasswordChange} />
          <Route path="/buscar-propiedades" component={PropertySearch} />
          <Route path="/mapa-interactivo" component={InteractiveMap} />
          <Route path="/solicitud-proveedor" component={ProviderApplication} />
          <Route path="/aplicar" component={Apply} />
          <Route path="/p/:slug" component={PropertyFullDetails} />
          <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
          <Route path="/unidad/:id" component={PublicUnitDetail} />
          <Route path="/propiedad-externa/:id" component={PublicUnitDetail} />
          <Route path="/propiedad/:id" component={PropertyDetails} />
          <Route path="/favoritos" component={Favorites} />
          <Route path="/terminos" component={Terms} />
          <Route path="/privacidad" component={Privacy} />
          <Route path="/offer/:token" component={PublicOfferForm} />
          <Route path="/public-rental-form/:token" component={PublicRentalForm} />
          <Route path="/public-owner-form/:token" component={PublicOwnerForm} />
          <Route path="/:agencySlug/oferta/:unitSlug" component={PublicOfferBySlug} />
          <Route path="/:agencySlug/formato-renta/:unitSlug" component={PublicRentalFormBySlug} />
          <Route path="/registro-cliente" component={PublicClientRegistration} />
          <Route path="/leads/broker" component={LeadRegistrationBroker} />
          <Route path="/leads/:token" component={PublicLeadRegistration} />
          <Route path="/submit-property/:token" component={PublicPropertySubmission} />
          <Route path="/property-submission-success" component={PropertySubmissionSuccess} />
          <Route path="/portal">
            {() => (
              <PortalAuthProvider>
                <PortalLogin />
              </PortalAuthProvider>
            )}
          </Route>
          <Route path="/portal/tenant">
            {() => (
              <PortalAuthProvider>
                <TenantPortal />
              </PortalAuthProvider>
            )}
          </Route>
          <Route path="/portal/owner">
            {() => (
              <PortalAuthProvider>
                <OwnerPortal />
              </PortalAuthProvider>
            )}
          </Route>
          <Route path="/:agencySlug/:unitSlug" component={PublicUnitDetail} />
          <Route path="/" component={PublicDashboard} />
          <Route component={PublicDashboard} />
        </Switch>
      </Suspense>
    );
  }

  if (needsPasswordChange || location === "/force-password-change") {
    return (
      <Suspense fallback={<PageLoader />}>
        <div className="min-h-screen">
          <ForcePasswordChange />
        </div>
      </Suspense>
    );
  }

  const currentUser = isAdminAuthenticated ? adminUser : user;
  const userName = currentUser?.firstName && currentUser?.lastName 
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser?.email || (isAdminAuthenticated && adminUser ? adminUser.username : undefined) || "Usuario";
  
  const userRole = isAdminAuthenticated 
    ? (currentUser?.role || "admin") 
    : currentUser?.role;

  const style = {
    "--sidebar-width": "12rem",
    "--sidebar-width-icon": "3rem",
  };

  const getHomeDashboard = () => {
    if (isAdminAuthenticated) {
      return AdminDashboard;
    }
    
    switch (userRole) {
      case "cliente":
        return ClientDashboard;
      case "owner":
        return OwnerDashboard;
      case "master":
      case "admin":
      case "admin_jr":
        return AdminDashboard;
      case "seller":
        return SellerDashboard;
      case "external_agency_admin":
      case "external_agency_accounting":
      case "external_agency_maintenance":
      case "external_agency_staff":
      case "external_agency_seller":
        return ExternalDashboard;
      case "management":
      case "concierge":
      case "provider":
      default:
        return Dashboard;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={userRole}
          userId={currentUser?.id}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ImpersonationBanner />
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1 sm:gap-2">
              {!["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff", "external_agency_seller", "external_agency_concierge", "external_agency_lawyer"].includes(userRole || "") && (
                <NotificationBell />
              )}
              <LanguageToggle />
              {isAdminAuthenticated && adminUser ? (
                <UserProfileMenu
                  user={adminUser as any}
                  isAdmin={true}
                  onLogout={() => adminLogoutMutation.mutate()}
                />
              ) : user ? (
                <UserProfileMenu user={user} />
              ) : null}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/offer/:token" component={PublicOfferForm} />
                <Route path="/public-rental-form/:token" component={PublicRentalForm} />
                <Route path="/submit-property/:token" component={PublicPropertySubmission} />
                <Route path="/property-submission-success" component={PropertySubmissionSuccess} />
                <Route path="/registro-cliente" component={PublicClientRegistration} />
                <Route path="/leads/broker" component={LeadRegistrationBroker} />
                
                <Route path="/" component={getHomeDashboard()} />
                <Route path="/mis-citas" component={Appointments} />
                <Route path="/buscar-propiedades" component={PropertySearch} />
                <Route path="/mapa-interactivo" component={InteractiveMap} />
                <Route path="/aplicar" component={Apply} />
                <Route path="/p/:slug" component={PropertyFullDetails} />
                <Route path="/propiedad/:id/completo" component={PropertyFullDetails} />
                <Route path="/unidad/:id" component={PublicUnitDetail} />
                <Route path="/propiedad-externa/:id" component={PublicUnitDetail} />
                <Route path="/propiedad/:id" component={PropertyDetails} />
                <Route path="/favoritos" component={Favorites} />
                <Route path="/mis-oportunidades" component={MyOpportunities} />
                <Route path="/rental-offer/:propertyId" component={RentalOfferForm} />
                <Route path="/contract/:contractId" component={ContractView} />
                <Route path="/contract-tenant-form/:contractId" component={ContractTenantForm} />
                <Route path="/contract-owner-form/:contractId" component={ContractOwnerForm} />
                <Route path="/contract/:contractId/legal-review" component={ContractLegalReview} />
                <Route path="/lawyer/dashboard" component={LawyerDashboard} />
                <Route path="/admin/check-in" component={CheckInManagement} />
                <Route path="/owner/dashboard" component={OwnerDashboard} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                <Route path="/admin/profile" component={AdminProfile} />
                <Route path="/mis-propiedades" component={MyProperties} />
                <Route path="/my-properties" component={MyProperties} />
                <Route path="/owner/property/new" component={PropertySubmissionWizard} />
                <Route path="/owner/property/:id/edit" component={EditOwnerProperty} />
                <Route path="/owner/property/:id/documents" component={PropertyDocuments} />
                <Route path="/owner/property/:id" component={OwnerPropertyDetails} />
                <Route path="/owner/appointments" component={OwnerAppointments} />
                <Route path="/owner/offers" component={OwnerOffers} />
                <Route path="/owner/financial-report" component={OwnerFinancialReport} />
                <Route path="/owner/hoa" component={OwnerHoaPortal} />
                <Route path="/admin/appointments" component={AdminAppointmentManagement} />
                <Route path="/admin/sellers" component={AdminSellerManagement} />
                <Route path="/admin/seller-goals" component={AdminSellerGoals} />
                <Route path="/admin/properties" component={AdminPropertyManagement} />
                <Route path="/admin/property-invitations" component={PropertyInvitations} />
                <Route path="/admin/import-contacts" component={AdminContactImport} />
                <Route path="/admin/tasks" component={AdminTaskManagement} />
                <Route path="/admin/integrations" component={AdminIntegrationsControl} />
                <Route path="/admin/contracts" component={AdminContractManagement} />
                <Route path="/admin/change-requests" component={AdminChangeRequests} />
                <Route path="/admin/property-limit-requests" component={AdminPropertyLimitRequests} />
                <Route path="/admin/inspection-reports" component={AdminInspectionReports} />
                <Route path="/admin/agreement-templates" component={AdminAgreementTemplates} />
                <Route path="/admin/condominiums/:id" component={CondominiumDetails} />
                <Route path="/admin/condominiums" component={AdminCondominiums} />
                <Route path="/admin/hoa" component={HoaManagement} />
                <Route path="/admin/chatbot-config" component={AdminChatbotConfig} />
                <Route path="/admin/sidebar-config" component={AdminSidebarConfig} />
                <Route path="/admin/create-user" component={CreateUser} />
                <Route path="/admin/income" component={AdminIncome} />
                <Route path="/admin/changelog" component={Changelog} />
                <Route path="/accountant/income" component={AccountantIncome} />
                <Route path="/mis-ingresos" component={MyIncome} />
                <Route path="/leads" component={LeadsKanban} />
                <Route path="/rentas" component={RentalsKanban} />
                <Route path="/properties" component={Properties} />
                <Route path="/appointments" component={Appointments} />
                <Route path="/external-appointments" component={ExternalAppointments} />
                <Route path="/calendario" component={Calendar} />
                <Route path="/admin/calendario" component={AdminCalendar} />
                <Route path="/admin/horarios" component={AdminBusinessHours} />
                <Route path="/admin/asignar-propiedades" component={AdminPropertyAssignment} />
                <Route path="/concierge/horarios" component={ConciergeSchedule} />
                <Route path="/directory" component={Directory} />
                <Route path="/presentation-cards" component={PresentationCards} />
                <Route path="/cards" component={PresentationCards} />
                <Route path="/presupuestos" component={Budgets} />
                <Route path="/tareas" component={Tasks} />
                <Route path="/backoffice" component={Backoffice} />
                <Route path="/admin/users">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.mainAdmins}>
                      <UserManagement />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/users" component={Users} />
                <Route path="/clientes" component={Clients} />
                <Route path="/notificaciones" component={Notifications} />
                <Route path="/chat" component={Chat} />
                <Route path="/perfil" component={Profile} />
                <Route path="/referidos" component={Referrals} />
                <Route path="/admin/referidos" component={AdminReferrals} />
                <Route path="/rentas-activas" component={ActiveRentals} />
                <Route path="/owner/rentas-activas" component={OwnerActiveRentals} />
                <Route path="/feedback" component={Feedback} />
                <Route path="/admin/feedback" component={AdminFeedback} />
                <Route path="/admin/property-owner-terms" component={AdminPropertyOwnerTerms} />
                <Route path="/admin/role-requests" component={RoleRequests} />
                <Route path="/admin/sla-config" component={AdminSLAConfig} />
                <Route path="/admin/lead-scoring" component={AdminLeadScoring} />
                <Route path="/permissions">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.mainAdmins}>
                      <Permissions />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/contratos" component={Contracts} />
                <Route path="/seller/commissions" component={SellerCommissions} />
                <Route path="/seller/appointments" component={SellerAppointmentManagement} />
                <Route path="/external/seller-reports" component={SellerReports} />
                <Route path="/external/seller-commissions" component={SellerCommissions} />
                <Route path="/external/seller-goals" component={SellerGoals} />
                <Route path="/external/seller-catalog" component={SellerPropertyCatalog} />
                <Route path="/external/seller-templates" component={SellerMessageTemplates} />
                <Route path="/external/seller-social-media" component={SellerSocialMedia} />
                <Route path="/external/seller-calendar" component={SellerCalendar} />
                <Route path="/external/seller-help" component={Help} />
                <Route path="/admin/predictive-analytics" component={AdminPredictiveAnalytics} />
                <Route path="/admin/legal-documents" component={AdminLegalDocuments} />
                <Route path="/admin/tenant-screening" component={AdminTenantScreening} />
                <Route path="/admin/marketing-campaigns" component={AdminMarketingCampaigns} />
                <Route path="/admin/rental-opportunity-requests" component={AdminRentalOpportunityRequests} />
                <Route path="/admin/offers" component={AdminOfferManagement} />
                <Route path="/admin/rental-forms" component={AdminRentalFormManagement} />
                <Route path="/admin/external-agencies">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.mainAdmins}>
                      <AdminExternalAgencies />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/admin/external-publication-requests" component={AdminExternalPublicationRequests} />
                <Route path="/admin/featured-properties">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.mainAdmins}>
                      <AdminFeaturedProperties />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/external/dashboard" component={ExternalDashboard} />
                <Route path="/external/agency" component={ExternalAgencyConfig} />
                <Route path="/external/email-import">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.externalAdmins}>
                      <EmailLeadImport />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/external/accounts" component={ExternalAccounts} />
                <Route path="/external/accesses" component={ExternalAccesses} />
                <Route path="/external/properties" component={ExternalProperties} />
                <Route path="/external/payments" component={ExternalPayments} />
                <Route path="/external/tickets" component={ExternalMaintenanceTickets} />
                <Route path="/external/condominiums" component={ExternalCondominiums} />
                <Route path="/external/referral-network" component={ExternalReferralNetwork} />
                <Route path="/external/recruitment" component={ExternalPropertyRecruitment} />
                <Route path="/external/units/:id" component={ExternalUnitDetail} />
                <Route path="/external/contracts/:id" component={ExternalRentalContractDetail} />
                <Route path="/external/checkout/:contractId" component={ExternalCheckoutReport} />
                <Route path="/external/rentals" component={ExternalRentals} />
                <Route path="/external/accounting" component={ExternalAccounting} />
                <Route path="/external/maintenance/:id" component={ExternalMaintenanceDetail} />
                <Route path="/external/maintenance" component={ExternalMaintenance} />
                <Route path="/external/calendar" component={ExternalCalendar} />
                <Route path="/external/configuration">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.externalAdmins}>
                      <ExternalConfiguration />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/external/owners/portfolio" component={ExternalOwnerPortfolio} />
                <Route path="/external/owners" component={ExternalOwners} />
                <Route path="/external/maintenance-workers" component={ExternalMaintenanceWorkers} />
                <Route path="/external/sellers-management">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.externalAdmins}>
                      <ExternalSellersManagement />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/external/leads/:id" component={ExternalLeadDetail} />
                <Route path="/external/clients/:id" component={ExternalClientEdit} />
                <Route path="/external/clients" component={ExternalClients} />
                <Route path="/external/messages" component={ExternalMessages} />
                <Route path="/external/contracts" component={ExternalContracts} />
                <Route path="/external/users">
                  {() => (
                    <ProtectedRoute allowedRoles={ROLE_GROUPS.externalAdmins}>
                      <ExternalAgencyUsers />
                    </ProtectedRoute>
                  )}
                </Route>
                <Route path="/ayuda" component={Help} />
                <Route path="/terminos" component={Terms} />
                <Route path="/privacidad" component={Privacy} />
                <Route path="/:agencySlug/:unitSlug" component={PublicUnitDetail} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </main>
        </div>
      </div>
      {currentUser && currentUser.role !== "admin" && currentUser.role !== "master" && (
        <Suspense fallback={null}>
          <OnboardingTour
            userRole={currentUser.role || "cliente"}
            onboardingCompleted={currentUser.onboardingCompleted || false}
            onboardingSteps={currentUser.onboardingSteps as Record<string, boolean> | undefined}
          />
        </Suspense>
      )}
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AuthenticatedApp />
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
