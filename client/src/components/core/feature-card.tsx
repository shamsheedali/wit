import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function FeatureCard({ title, description, icon: Icon, href, color }: FeatureCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          "relative h-[360px] rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl hover:border-accent/30"
        )}
      >
        {/* Background Gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", color)} />
        
        {/* Chess Piece Illustration */}
        <div className="relative h-[240px] flex items-center justify-center overflow-hidden">
          <div className="relative transition-transform duration-500 group-hover:scale-110">
            {/* Decorative circles */}
            <div className="absolute inset-0 -m-8 rounded-full bg-accent/20 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 -m-16 rounded-full bg-accent/10 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            
            {/* Icon Container */}
            <div className="relative w-28 h-28 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors duration-300">
              <Icon className="w-14 h-14 text-foreground/70 group-hover:text-accent transition-colors duration-300" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-card via-card to-transparent z-10">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold mb-1 group-hover:text-accent transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <div
              className="p-2 rounded-full bg-accent text-accent-foreground opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300"
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Hover Border Effect */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, transparent 40%, var(--accent) 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      </div>
    </Link>
  );
}
