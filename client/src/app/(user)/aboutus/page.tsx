import { Crown, Target, Users, Zap, Heart, Shield } from "lucide-react";

const values = [
  {
    icon: Crown,
    title: "Excellence",
    description: "We strive for the highest standards in every match, every feature, and every interaction."
  },
  {
    icon: Target,
    title: "Precision",
    description: "Like a perfectly calculated move, we build with attention to every detail."
  },
  {
    icon: Users,
    title: "Community",
    description: "Chess brings people together. We foster connections across borders and skill levels."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Blending timeless strategy with modern technology for the ultimate chess experience."
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Built by chess lovers, for chess lovers. Our passion drives everything we create."
  },
  {
    icon: Shield,
    title: "Fair Play",
    description: "Integrity is paramount. We ensure a level playing field for all competitors."
  }
];



export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background pt-32">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-serif text-5xl md:text-7xl text-foreground mb-6">
            About <span className="text-accent">Wit.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Where chess meets community. A place where players of all levels come to challenge themselves, connect with others, and grow their game.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
          <div className="space-y-6">
            <h2 className="font-serif text-3xl text-foreground">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              We created Wit with a simple idea: chess should be fun, accessible, and social. That&apos;s why we&apos;ve loaded the platform with features that make it easy to play, learn, and engage.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              At Wit, we believe chess is not just a game — it&apos;s a language, a culture, a community. Whether you&apos;re a seasoned player or just getting started, there&apos;s a seat at the table for you. Let&apos;s play smart. Let&apos;s play with Wit.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center transition-transform hover:scale-105 duration-700">
              <div className="text-center">
                <span className="font-serif text-8xl text-foreground/10 select-none">Wit.</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
          </div>
        </div>

        {/* Values Grid */}
        <div className="mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
          <h2 className="font-serif text-3xl text-foreground text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-accent/20">
                  <value.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>



        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border/50 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-1000 fill-mode-both">
          {[
            { value: "50K+", label: "Active Players" },
            { value: "1M+", label: "Games Played" },
            { value: "120+", label: "Countries" },
            { value: "4.9", label: "App Rating" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="text-center transition-transform hover:scale-105 duration-300"
            >
              <div className="font-serif text-4xl md:text-5xl text-accent mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
