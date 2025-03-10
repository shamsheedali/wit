"use client"

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/api/admin";

type FormData = {
  email: string;
  password: string;
};

export function AdminLoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {

  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      newErrors.email = "Enter a valid email address.";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setErrors({});
  };

  const { mutate, isPending } = useMutation({
    mutationFn: adminLogin,
    onSuccess: (result) => {
      if(result?.success) {
        router.push("/dashboard")
        resetForm();
      }
    },
    onError: (error) => {
      console.error("Error admin login", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutate(formData);
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Admin Login</h1>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your email" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" name="password" value={formData.password} onChange={handleChange} />
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>

        {isPending ? (
          <Button disabled>
            <Loader2 className="animate-spin" />
            Logging in
          </Button>
        ) : (
          <Button type="submit" className="w-full">
            Log in
          </Button>
        )}
      </div>
    </form>
  );
}
