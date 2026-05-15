import { Link } from "react-router-dom";

const sportIcons = [
  { emoji: "🏏", label: "Cricket", to: "/inplay" },
  { emoji: "⚽", label: "Football", to: "/inplay" },
  { emoji: "🎾", label: "Tennis", to: "/inplay" },
  { emoji: "🏀", label: "Basketball", to: "/inplay" },
  { emoji: "🎰", label: "Casino", to: "/casino" },
  { emoji: "🎲", label: "Dice", to: "/casino" },
  { emoji: "🃏", label: "Cards", to: "/casino" },
  { emoji: "🏇", label: "Horse", to: "/inplay" },
];

export function SportIconsStrip() {
  return (
    <div className="bg-sport-strip border-b border-border/30">
      <div className="flex items-center justify-around py-1.5 px-1 overflow-x-auto scrollbar-hide">
        {sportIcons.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="touch-target flex flex-col items-center gap-0.5 shrink-0 px-2 py-1.5 group min-w-[48px]"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:border-primary/40 transition-all">
              <span className="text-lg sm:text-xl">{s.emoji}</span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wide">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
