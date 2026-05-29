import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative z-10 flex flex-col items-center px-6 pb-40 pt-32 text-center">
      <div className="flex max-w-7xl flex-col items-center">
        {/* Heading */}
        <h1
          className="animate-fade-rise text-5xl leading-[0.95] tracking-[-2.46px] sm:text-7xl md:text-8xl"
          style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}
        >
          Where{" "}
          <em className="not-italic text-[hsl(var(--muted-foreground))]">dreams</em>{" "}
          rise{" "}
          <em className="not-italic text-[hsl(var(--muted-foreground))]">through the silence.</em>
        </h1>

        {/* Subtext */}
        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
          We&apos;re designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        {/* CTA */}
        <Button
          className="animate-fade-rise-delay-2 liquid-glass mt-12 cursor-pointer rounded-full px-14 py-5 text-base text-[hsl(var(--foreground))] hover:scale-[1.03]"
          style={{ height: "auto" }}
        >
          Begin Journey
        </Button>
      </div>
    </section>
  );
}
