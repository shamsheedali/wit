"use client"

import { useLayoutEffect } from 'react'
import { LoginForm } from "@/components/form/login-form";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useLayoutEffect(() => {
    const token = localStorage.getItem('userToken');
    if(token) {
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
