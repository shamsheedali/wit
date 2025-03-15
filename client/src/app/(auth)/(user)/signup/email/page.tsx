"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOtp } from "@/lib/api/user";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormData = {
  email: string;
};

export default function SignupFormEmailPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      newErrors.email = "Enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({ email: "" });
    setErrors({});
  };

  const { mutate, isPending } = useMutation({
    mutationFn: getOtp,
    onSuccess: async (result) => {
      if (result) {
        localStorage.setItem("userEmail", formData.email);
        router.push("/signup/details");
        resetForm();
      }
    },
    onError: (err) => {
      console.error("Error user registration", err);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutate(formData.email);
  };

  const handleGoogleSignUp = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen w-full flex justify-center pt-10 font-clashDisplay">
      <div className="flex flex-col gap-3 w-[500px]">
        <Link href={"/home"} className="text-2xl font-stardom">
          Wit.
        </Link>
        <h1 className="text-3xl">Let’s Get Started!</h1>
        <h4>
          Enter your email to create your Wit account and <br /> start making
          smarter moves.
        </h4>

        <form action="" onSubmit={handleSubmit}>
          <div className="grid gap-2 mt-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email"
              className="h-[55px]"
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>

          <p className="text-gray-500 mt-5 text-sm">
            By continuing, I agree to Wit’s{" "}
            <span className="underline">Privacy Policy</span> <br /> and{" "}
            <span className="underline">Terms of Use</span>.
          </p>

          <div className="flex justify-end">
            {isPending ? (
              <Button disabled>
                <Loader2 className="animate-spin" />
              </Button>
            ) : (
              <Button type="submit" className="w-fit">
                Continue
              </Button>
            )}
          </div>
        </form>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border mt-3">
          <span className="relative z-10 bg-[#09090b] px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <Button
          variant="outline"
          type="button"
          className="w-full mt-3"
          onClick={handleGoogleSignUp}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center text-sm mt-3">
          Already a user?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
