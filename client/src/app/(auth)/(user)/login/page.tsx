"use client"

import { useLayoutEffect } from 'react'
import { LoginForm } from "@/components/form/login-form";
import { useRouter } from "next/navigation";
import { useAuthStore } from '@/stores';
import Link from 'next/link';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  useLayoutEffect(() => {
    if(isAuthenticated) {
      router.push('/')
    }
  }, [router])
    
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(224,122,95,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(224,122,95,0.2),transparent_50%)]" />
        
        {/* Floating Chess Pieces */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="text-[200px] text-primary-foreground/10 font-serif select-none">
              ♞
            </div>
            <div className="absolute -top-10 -right-20 text-[80px] text-accent/30 font-serif select-none">
              ♛
            </div>
            <div className="absolute -bottom-5 -left-16 text-[60px] text-primary-foreground/20 font-serif select-none">
              ♜
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="absolute bottom-12 left-12 right-12">
          <div>
            <p className="text-primary-foreground/80 text-xl font-serif italic leading-relaxed">
              &quot;Chess is the gymnasium of the mind.&quot;
            </p>
            <p className="text-primary-foreground/60 mt-2">— Blaise Pascal</p>
          </div>
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            {/* <div className="w-10 h-10 rounded-lg overflow-hidden bg-background/20 flex items-center justify-center">
              <span className="font-serif text-xl font-bold text-primary-foreground">W</span>
            </div> */}
            <span className="font-serif text-6xl font-extrabold text-primary-foreground">Wit.</span>
          </Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
