"use client"

import { useLayoutEffect } from 'react'
import { LoginForm } from "@/components/form/login-form";
import { useRouter } from "next/navigation";
import { useAuthStore } from '@/stores';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  useLayoutEffect(() => {
    if(isAuthenticated) {
      router.push('/home')
    }
  }, [router])
    
  return (
    <div
      className="grid min-h-svh lg:grid-cols-1"
    >
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
