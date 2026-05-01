import ForgotPasswordForm from "@/components/form/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,var(--accent)_0%,transparent_50%)] opacity-[0.08]" />
      
      <div className="w-full max-w-md relative z-10">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
