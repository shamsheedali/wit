"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { resetPassword } from "@/lib/api/user";

// Schema for password validation
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/^\S+$/, { message: "Password cannot contain spaces" }) // No spaces
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" }) // Uppercase
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" }) // Lowercase
      .regex(/\d/, { message: "Password must contain at least one number" }) // Number
      .refine((val) => val.trim() !== "", { message: "Password cannot be empty" }), // Non-empty
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate as the user types
  });

  const watchPassword = form.watch("password", "");
  const watchConfirmPassword = form.watch("confirmPassword", "");

  const passwordRequirements = [
    { label: "At least 8 characters", met: watchPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(watchPassword) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(watchPassword) },
    { label: "Contains number", met: /\d/.test(watchPassword) },
    { label: "Passwords match", met: watchPassword === watchConfirmPassword && watchConfirmPassword !== "" },
  ];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        toast.error("Email not found. Please start the reset process again.");
        router.push("/forgot-password"); // Redirect if email is missing
        return;
      }
      const result = await resetPassword(email, values.password);
      if (result) {
        localStorage.removeItem("userEmail");
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error resetting password", error);
      toast.error("Failed to reset the password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full relative">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg bg-primary/10 flex items-center justify-center">
          <span className="font-serif text-3xl font-bold text-foreground">W</span>
        </div>
        <span className="font-serif text-3xl font-bold text-foreground">Wit.</span>
      </div>

      {!isSubmitted ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Set new password</h1>
            <p className="text-muted-foreground">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="w-full pl-12 pr-12 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="w-full pl-12 pr-12 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Requirements */}
              {(watchPassword || watchConfirmPassword) && (
                <div className="space-y-1.5 pt-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                          req.met ? "bg-green-500 text-white" : "bg-muted"
                        )}
                      >
                        {req.met && <Check className="w-3 h-3" />}
                      </div>
                      <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !passwordRequirements.every((r) => r.met)}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mt-6",
                  "bg-accent text-accent-foreground hover:bg-accent/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </Form>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Password reset</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully reset.<br />
            Click below to sign in with your new password.
          </p>

          <Link href="/login" className="block">
            <button className="w-full py-3.5 rounded-xl font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all flex items-center justify-center gap-2">
              Continue to Sign In
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}