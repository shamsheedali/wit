"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import withAuth from "@/hoc/withAuth";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        {/* Persistent Sidebar */}
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(DashboardLayout);