import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function About() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">About {siteName}</h1>

        <div className="space-y-6 text-sm text-card-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Who We Are</h2>
            <p>{siteName} is a premium online betting exchange and casino platform offering a world-class experience for sports betting, live casino games, and more. We provide a secure, fast, and transparent platform for our users.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Our Mission</h2>
            <p>To deliver the most exciting and fair betting experience with cutting-edge technology, real-time odds, and unmatched customer support. We strive to make every user's journey seamless and enjoyable.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">What We Offer</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Live sports betting with real-time odds</li>
              <li>Premium casino games from top providers</li>
              <li>Secure deposits and fast withdrawals</li>
              <li>VIP rewards and referral programs</li>
              <li>24/7 customer support</li>
              <li>Multi-language support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Security & Trust</h2>
            <p>We employ industry-standard security measures including encrypted transactions, secure authentication, and strict KYC verification to ensure the safety of your funds and personal information.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Contact Us</h2>
            <p>For any inquiries or support, please visit our <a href="/support" className="text-primary hover:underline">Support</a> page or reach out through our in-app support system.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
