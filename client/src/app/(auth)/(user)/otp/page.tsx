"use client"

import { OTPForm } from "@/components/form/otp-form";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

export default function OtpPage() {

  const router = useRouter();
    useLayoutEffect(() => {
      const token = localStorage.getItem('userToken');
      if(token) {
        router.push('/homepage')
      }
    }, [router])

  return (
    <div
      style={{
        background: `linear-gradient(20deg, rgb(201, 85, 43) -13%, rgb(0, 0, 0) 10%, rgb(0, 0, 0) 75%, rgb(201, 85, 43) 119%)`,
        width: "100%",
        height: "100vh",
      }}
      className="grid min-h-svh lg:grid-cols-1"
    >
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-[50%] flex justify-center">
            <OTPForm />
          </div>
        </div>
      </div>
    </div>
  );
}
