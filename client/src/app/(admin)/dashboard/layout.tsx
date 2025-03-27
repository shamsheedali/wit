"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import withAuth from "@/hoc/withAuth";
import { useAuthStore } from "@/stores";
import { useEffect } from "react";
import { initSocket } from "@/lib/socket"; 

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { admin } = useAuthStore();

  useEffect(() => {
    if (admin?._id) {
      console.log("Initializing socket for admin:", admin._id);
      initSocket(admin._id); // socket with admin._id
    }
  }, [admin?._id]); 

  return (
    <SidebarProvider>
      {/* Persistent Sidebar */}
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(DashboardLayout);