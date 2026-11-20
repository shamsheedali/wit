"use client";

import { useState } from "react";
import { Mail, MessageSquare, MapPin, Send, CheckCircle, HelpCircle, Bug, Lightbulb, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const contactReasons = [
  { id: "general", label: "General Inquiry", icon: MessageSquare },
  { id: "support", label: "Support", icon: HelpCircle },
  { id: "bug", label: "Report a Bug", icon: Bug },
  { id: "feature", label: "Feature Request", icon: Lightbulb },
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "Go to Settings > Account > Change Password. You can also use the 'Forgot Password' link on the login screen."
  },
  {
    question: "Can I play offline?",
    answer: "Yes! Wit. offers offline play against AI opponents. Your games will sync when you reconnect."
  },
  {
    question: "How is my rating calculated?",
    answer: "We use the Glicko-2 rating system, which considers your wins, losses, opponent ratings, and rating reliability."
  },
  {
    question: "How do I report a player?",
    answer: "After a game, click the three dots menu and select 'Report Player'. Our team reviews all reports within 24 hours."
  },
];

export default function ContactPage() {
  const [selectedReason, setSelectedReason] = useState("general");
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormState({ name: "", email: "", message: "" });
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-background pt-32">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-serif text-5xl md:text-7xl text-foreground mb-6">
            Get in <span className="text-accent">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or feedback? We&apos;d love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm relative overflow-hidden transition-all duration-300">
              <h2 className="font-serif text-2xl text-foreground mb-6">Send us a message</h2>
              
              {/* Reason Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {contactReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-95",
                      selectedReason === reason.id
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-accent/30 hover:bg-secondary"
                    )}
                  >
                    <reason.icon className="w-5 h-5" />
                    <span className="text-xs">{reason.label}</span>
                  </button>
                ))}
              </div>

              {isSubmitted ? (
                <div className="py-16 text-center animate-in zoom-in-95 fade-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-serif text-xl text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 animate-in fade-in duration-500"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                    <textarea
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-colors hover:bg-accent/20">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Email Us</h3>
              <p className="text-muted-foreground text-sm mb-3">For general inquiries</p>
              <a href="mailto:hello@wit.chess" className="text-accent hover:underline font-medium">hello@wit.chess</a>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-transform hover:-translate-y-1 duration-300 delay-100">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-colors hover:bg-accent/20">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Live Chat</h3>
              <p className="text-muted-foreground text-sm mb-3">Available 9am - 6pm EST</p>
              <button className="text-accent hover:underline font-medium">Start a conversation</button>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-transform hover:-translate-y-1 duration-300 delay-200">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-colors hover:bg-accent/20">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Office</h3>
              <p className="text-muted-foreground text-sm">
                123 Strategy Lane<br />
                San Francisco, CA 94102
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
          <h2 className="font-serif text-3xl text-foreground text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Quick answers to common questions
          </p>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-300",
                      expandedFaq === index ? "rotate-180" : ""
                    )}
                  />
                </button>
                
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    expandedFaq === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="px-6 pb-4 text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
