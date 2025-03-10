"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyOtp, getOtp } from "@/lib/api/user";
import { useRouter } from "next/navigation";

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export function OTPForm() {
  const router = useRouter();
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false);
    }
  }, [timer]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const email = localStorage.getItem("userEmail");
    const response = await verifyOtp(data.pin, email as string);
    if (response) {
      localStorage.removeItem("userEmail");
      router.push("/homepage");
    }
  }

  async function handleResendOtp() {
    const email = localStorage.getItem("userEmail");
    if (email) {
      await getOtp(email);
      setTimer(60);
      setIsResendDisabled(true);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-Time Password</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>
                Please enter the one-time password sent to your phone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <Button type="submit">Submit</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleResendOtp} disabled={isResendDisabled} variant="outline">
              Resend OTP
            </Button>
            <span className="text-gray-500 text-sm">{timer > 0 ? `Retry in ${timer}s` : "You can resend now"}</span>
          </div>
        </div>
      </form>
    </Form>
  );
}