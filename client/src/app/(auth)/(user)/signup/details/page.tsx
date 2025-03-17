"use client";

import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkUsername, getOtp, registerUser, verifyOtp } from "@/lib/api/user";
import { useAuthStore } from "@/stores";
import { useMutation, useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FormData = {
  code: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export default function SignupFormDetailsPage() {
  const { setUser } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      setEmail(userEmail);
    } else {
      router.push("/signup/email");
    }
  }, [router]);

  const [formData, setFormData] = useState<FormData>({
    code: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

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

  async function handleResendOtp() {
    const email = localStorage.getItem("userEmail");
    if (email) {
      await getOtp(email);
      setTimer(60);
      setIsResendDisabled(true);
    }
  }

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  //   const [termsError, setTermsError] = useState(false);

  // Password strength validation
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  const validatePassword = (password: string) => {
    setPasswordChecks({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    });
  };

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (formData.code.length < 6) {
      newErrors.code = "Invalid code";
    }
    if (formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters.";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    // if (!termsAccepted) {
    //   setTermsError(true);
    // }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debounced username check
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [hasTyped, setHasTyped] = useState(false);

  const debouncedSetUsername = useCallback(
    debounce((val: string) => {
      setDebouncedUsername(val);
    }, 500),
    []
  );

  useEffect(() => {
    if (formData.username.length > 0) {
      setHasTyped(true);
    }
    debouncedSetUsername(formData.username);
  }, [formData.username, debouncedSetUsername]);

  const { data: isUsernameAvailable, isLoading: checkingUsername } = useQuery({
    queryKey: ["checkUsername", debouncedUsername],
    queryFn: () => checkUsername(debouncedUsername),
    enabled: !!debouncedUsername,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      validatePassword(value);
    }

    if (name === "username") {
      debouncedSetUsername(value);
    }
  };

  const resetForm = () => {
    setFormData({ code: "", username: "", password: "", confirmPassword: "" });
    setErrors({});
    setTermsAccepted(false);
    // setTermsError(false);
  };

  const otpMutation = useMutation({
    mutationFn: ({ code, email }: { code: string; email: string }) =>
      verifyOtp(code, email),
    onSuccess: (result: boolean | undefined) => {
      if (result) {
        registerMutation.mutate({
          username: formData.username,
          email,
          password: formData.password,
        });
      }
    },
    onError: (error: Error) => {
      console.error("OTP verification failed:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: {
      username: string;
      email: string;
      password: string;
    }) => registerUser(userData),
    onSuccess: (response: { success: boolean; data: any } | undefined) => {
      if (response?.success) {
        localStorage.removeItem("userEmail");
        //saving in global state
        setUser(response.data.user);
        router.push("/home");
      }
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !validate() ||
      !isUsernameAvailable ||
      !passwordChecks.minLength ||
      !passwordChecks.hasNumber ||
      !passwordChecks.hasUpper
    )
      return;
    otpMutation.mutate({ code: formData.code, email });
  };

  return (
    <div className="min-h-screen w-full flex justify-center py-10 font-clashDisplay">
      <div className="flex flex-col gap-3 w-[500px]">
        <Link href={"/home"} className="text-2xl font-stardom">
          Wit.
        </Link>
        <h1 className="text-3xl">Just a Few More Moves!</h1>
        <h4>
          We&apos;ve sent a code to <br /> {email}
          <Link href={"/signup/email"} className="underline text-gray-500">
            Edit
          </Link>
        </h4>

        <form action="" onSubmit={handleSubmit}>
          <div className="grid gap-10 mt-3">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="code"
                className="h-[55px]"
              />
              {errors.code && (
                <p className="text-red-500 text-xs">{errors.code}</p>
              )}
              <div className="flex flex-col items-end">
                <Button
                  onClick={handleResendOtp}
                  type="button"
                  disabled={isResendDisabled}
                  variant="outline"
                >
                  Resend OTP
                </Button>
                <span className="text-gray-500 text-sm">
                  {timer > 0 ? `Retry in ${timer}s` : "You can resend now"}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="h-[55px]"
              />
              {/* Username validation UI */}
              {hasTyped &&
                formData.username.length >= 4 &&
                (checkingUsername ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : isUsernameAvailable ? (
                  <p className="text-green-500 text-sm flex items-center gap-1">
                    <CircleCheck className="w-4 h-4 text-green-500" />
                    Username is available
                  </p>
                ) : (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <CircleX className="w-4 h-4 text-red-500" />
                    Username is already taken
                  </p>
                ))}
              {errors.username && (
                <p className="text-red-500 text-xs">{errors.username}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="password"
                className="h-[55px]"
              />
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
              <div className="text-sm flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-1">
                  {passwordChecks.minLength ? (
                    <CircleCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <CircleX className="w-4 h-4 text-red-500" />
                  )}
                  <p>Minimum of 8 characters</p>
                </div>
                <div className="flex items-center gap-1">
                  {passwordChecks.hasUpper ? (
                    <CircleCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <CircleX className="w-4 h-4 text-red-500" />
                  )}
                  <p>At least one uppercase letter</p>
                </div>
                <div className="flex items-center gap-1">
                  {passwordChecks.hasNumber ? (
                    <CircleCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <CircleX className="w-4 h-4 text-red-500" />
                  )}
                  <p>At least one number</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="confirmPassword"
                className="h-[55px]"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* <div className="flex items-center space-x-2 mt-8">
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked)} />
            <label htmlFor="terms" className="text-sm font-medium">
              Accept terms and conditions
            </label>
          </div>
          {termsError && <p className="text-red-500 text-xs">You must accept the terms and conditions.</p>} */}

          <div className="flex justify-end mt-8">
            {otpMutation.isPending || registerMutation.isPending ? (
              <Button disabled>
                <Loader2 className="animate-spin" />
                Creating account
              </Button>
            ) : (
              <Button type="submit" className="w-fit">
                Create account
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
