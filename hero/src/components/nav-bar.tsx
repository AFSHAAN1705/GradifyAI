import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Home", active: true },
  { label: "Studio" },
  { label: "About" },
  { label: "Journal" },
  { label: "Reach Us" },
];

export function NavBar() {
  return (
    <nav className="relative z-10 flex w-full items-center justify-between px-8 py-6">
      {/* Logo */}
      <a href="/" className="text-3xl tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Velorah<sup className="text-xs">®</sup>
      </a>

      {/* Nav Links - Desktop */}
      <ul className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <li key={link.label}>
            <a
              href="/"
              className={`text-sm transition-colors ${
                link.active ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        className="liquid-glass hidden rounded-full px-6 py-2.5 text-sm text-[hsl(var(--foreground))] hover:scale-[1.03] md:inline-flex"
        style={{ height: "auto" }}
      >
        Begin Journey
      </Button>
    </nav>
  );
}
