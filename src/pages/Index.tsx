import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { TickerBar } from "@/components/TickerBar";
import { HeroBanner } from "@/components/HeroBanner";
import { SportIconsStrip } from "@/components/SportIconsStrip";
import { BottomNav } from "@/components/BottomNav";
import { HomeBalanceCard } from "@/components/HomeBalanceCard";
import { HomeBetHistoryCTA } from "@/components/HomeBetHistoryCTA";
import { HomeCricketMatches } from "@/components/HomeCricketMatches";

// Defer heavy below-the-fold sections so the home page paints immediately.
const CasinoGrid = lazy(() => import("@/components/CasinoGrid").then(m => ({ default: m.CasinoGrid })));
const CasinoProviders = lazy(() => import("@/components/CasinoProviders").then(m => ({ default: m.CasinoProviders })));
const UpcomingEvents = lazy(() => import("@/components/UpcomingEvents").then(m => ({ default: m.UpcomingEvents })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const FloatingSupportButtons = lazy(() => import("@/components/FloatingSupportButtons").then(m => ({ default: m.FloatingSupportButtons })));
const WelcomePopup = lazy(() => import("@/components/WelcomePopup").then(m => ({ default: m.WelcomePopup })));

const SectionFallback = () => <div className="h-32 w-full animate-pulse bg-muted/40" />;

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TickerBar />

      <div className="pb-20 md:pb-0">
        <HeroBanner />
        <HomeBalanceCard />
        <HomeBetHistoryCTA />
        <SportIconsStrip />
        <HomeCricketMatches />

        <Suspense fallback={<SectionFallback />}>
          <CasinoGrid />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <CasinoProviders />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <UpcomingEvents />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingSupportButtons />
      </Suspense>
      <BottomNav />
      <Suspense fallback={null}>
        <WelcomePopup />
      </Suspense>
    </div>
  );
};

export default Index;
