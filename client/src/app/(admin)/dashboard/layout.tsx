import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        {/* Persistent Sidebar */}
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
