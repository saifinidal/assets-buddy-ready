import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const providers = [
  { name: "Spribe", img: "https://veltrix.cricbet99.me.uk/images/providers/provider8.webp" },
  { name: "JILI", img: "https://veltrix.cricbet99.me.uk/images/providers/provider2.webp" },
];

export function CasinoProviders() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 bg-green-bar px-3 py-1.5">
        <span className="text-xs">🎰</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
          Casino Provider
        </span>
        <button
          onClick={() => navigate("/casino")}
          className="ml-auto text-[10px] font-bold text-primary-foreground/80 hover:text-primary-foreground"
        >
          View All →
        </button>
      </div>

      <div className="relative bg-card">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-r bg-foreground/40 p-1 text-primary-foreground hover:bg-foreground/60"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-hide p-2"
        >
          {providers.map((p) => (
            <button
              key={p.name}
              onClick={() => navigate("/casino")}
              className="shrink-0 w-[110px] md:w-[130px] rounded-lg overflow-hidden border border-border/30 hover:border-primary/40 hover:scale-105 transition-all bg-surface"
            >
              <img
                src={p.img}
                alt={p.name}
                className="h-full w-full object-cover aspect-[3/2]"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="aspect-[3/2] flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5"><span class="text-xs font-bold text-foreground">${p.name}</span></div>`;
                  }
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-l bg-foreground/40 p-1 text-primary-foreground hover:bg-foreground/60"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
