import { Navbar } from "@/components/Navbar";
import { TickerBar } from "@/components/TickerBar";
import { HeroBanner } from "@/components/HeroBanner";
import { SportIconsStrip } from "@/components/SportIconsStrip";
import { CasinoGrid } from "@/components/CasinoGrid";
import { CasinoProviders } from "@/components/CasinoProviders";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { WelcomePopup } from "@/components/WelcomePopup";
import { FloatingSupportButtons } from "@/components/FloatingSupportButtons";
import { HomeBetHistoryCTA } from "@/components/HomeBetHistoryCTA";
import { HomeBalanceCard } from "@/components/HomeBalanceCard";
import { HomeCricketMatches } from "@/components/HomeCricketMatches";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <WelcomePopup />
      <Navbar />
      <TickerBar />

      {/* Main content */}
      <div className="pb-20 md:pb-0">
        <HeroBanner />
        <HomeBalanceCard />
        <HomeBetHistoryCTA />
        <SportIconsStrip />
        <HomeCricketMatches />
        <CasinoGrid />
        <CasinoProviders />
        <UpcomingEvents />
      </div>

      <Footer />
      <FloatingSupportButtons />
      <BottomNav />
    </div>
  );
};

export default Index;
