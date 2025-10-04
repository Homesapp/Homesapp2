import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSelector } from "@/components/RoleSelector";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import Appointments from "@/pages/Appointments";
import Calendar from "@/pages/Calendar";
import Directory from "@/pages/Directory";
import PresentationCards from "@/pages/PresentationCards";
import Backoffice from "@/pages/Backoffice";
import Users from "@/pages/Users";
import Budgets from "@/pages/Budgets";
import Tasks from "@/pages/Tasks";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "Usuario";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={user?.role || "owner"}
          userName={userName}
          userAvatar={user?.profileImageUrl || undefined}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <RoleSelector />
              <ThemeToggle />
              <a
                href="/api/logout"
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid="link-logout"
              >
                Cerrar Sesión
              </a>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/properties" component={Properties} />
              <Route path="/appointments" component={Appointments} />
              <Route path="/calendario" component={Calendar} />
              <Route path="/directory" component={Directory} />
              <Route path="/presentation-cards" component={PresentationCards} />
              <Route path="/presupuestos" component={Budgets} />
              <Route path="/tareas" component={Tasks} />
              <Route path="/backoffice" component={Backoffice} />
              <Route path="/users" component={Users} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthenticatedApp />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
