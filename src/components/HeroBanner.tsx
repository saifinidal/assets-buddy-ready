import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import royalBetBanner from "@/assets/royal-bet-banner.jpg";
import bannerCricket from "@/assets/banner-cricket.jpg";
import bannerFootball from "@/assets/banner-football.jpg";
import casinoBanner from "@/assets/casino-banner.jpg";

const slides = [
  { src: royalBetBanner, alt: "Royal Bet Live Casino" },
  { src: bannerCricket, alt: "Cricket Betting" },
  { src: bannerFootball, alt: "Football Betting" },
  { src: casinoBanner, alt: "Casino Games" },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative aspect-[16/9] sm:aspect-[2.5/1] md:aspect-[3/1] lg:aspect-[3.2/1] xl:aspect-[3.5/1]">
        {slides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.src}
            alt={slide.alt}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== royalBetBanner) img.src = royalBetBanner;
            }}
            onLoad={(e) => {
              // If asset is a tiny placeholder, swap to the RoyalBet banner
              const img = e.currentTarget;
              if ((img.naturalWidth < 200 || img.naturalHeight < 100) && !img.src.endsWith("royal-bet-banner.jpg")) {
                img.src = royalBetBanner;
              }
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <button
          onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-foreground/30 p-1 text-primary-foreground hover:bg-foreground/50 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-foreground/30 p-1 text-primary-foreground hover:bg-foreground/50 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === current ? "w-5 bg-primary" : "w-1.5 bg-primary-foreground/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
