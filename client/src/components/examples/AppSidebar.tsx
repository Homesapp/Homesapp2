import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole="admin"
          userName="Admin Usuario"
        />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold">Contenido Principal</h1>
        </main>
      </div>
    </SidebarProvider>
  );
}
