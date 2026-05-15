import logo from "@/assets/logo-royalbet.png";

export function AppPreloader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Radial glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(0 80% 48% / 0.18) 0%, transparent 60%)",
        }}
      />

      {/* Logo with pulsing glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse-live" />
        <img
          src={logo}
          alt="RoyalBet"
          width={140}
          height={140}
          className="relative h-28 w-28 sm:h-36 sm:w-36 object-contain animate-scale-in drop-shadow-[0_4px_24px_hsl(0_80%_48%/0.45)]"
        />
      </div>

      {/* Brand name */}
      <div className="relative mt-6 font-display text-2xl font-bold tracking-[0.3em] text-foreground animate-fade-in">
        ROYAL BET
      </div>

      {/* Spinner ring */}
      <div className="relative mt-8 h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>

      <div className="relative mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground animate-fade-in">
        Loading…
      </div>
    </div>
  );
}
