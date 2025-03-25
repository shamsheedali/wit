"use client";

import PasswordSettingsForm from "@/components/form/password-settings-form";
import { useAuthStore } from "@/stores";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function PasswordSettings() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.googleId) redirect("/settings/profile");
  }, [user]);
  
  return <PasswordSettingsForm />;
}
