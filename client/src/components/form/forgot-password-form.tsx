'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { forgotPassword } from '@/lib/api/user'

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
})

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const result = await forgotPassword(values.email);
      if(result) {
        localStorage.setItem('userEmail', values.email);
        setSubmittedEmail(values.email)
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Error sending password reset email', error)
      toast.error('Failed to send password reset email. Please try again.')
    } finally {
      setIsLoading(false)
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
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                          required
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
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

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a password reset link to<br />
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </p>

          <button
            onClick={() => window.open('mailto:', '_blank')}
            className="w-full py-3.5 rounded-xl font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all"
          >
            Open email app
          </button>

          <p className="mt-6 text-sm text-muted-foreground">
            Didn&apos;t receive the email?{" "}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Click to resend
            </button>
          </p>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  )
}
