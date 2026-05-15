import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function TermsConditions() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Terms & Conditions</h1>

        <div className="space-y-6 text-sm text-card-foreground leading-relaxed">
          <p className="text-[10px] text-muted-foreground">Last Updated: May 2026</p>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using {siteName}, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">2. Eligibility</h2>
            <p>You must be at least 18 years of age to use this platform. By registering, you confirm that you meet this age requirement. We reserve the right to request proof of age at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">3. Account Responsibility</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>Only one account per person is allowed</li>
              <li>You must provide accurate and truthful information during registration</li>
              <li>You are responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">4. Betting Rules</h2>
            <p>All bets are subject to the rules of the specific market. Once a bet is confirmed, it cannot be cancelled unless the market is voided. Settlement of bets is final and at the discretion of {siteName}.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">5. Deposits & Withdrawals</h2>
            <p>Minimum and maximum limits apply to deposits and withdrawals. Processing times may vary by payment method. We reserve the right to request KYC documents before processing withdrawals.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">6. Prohibited Activities</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Using bots, scripts, or automated tools</li>
              <li>Money laundering or fraudulent activities</li>
              <li>Exploiting platform bugs or vulnerabilities</li>
              <li>Creating multiple accounts</li>
              <li>Abusing promotions or bonuses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">7. Account Suspension</h2>
            <p>We reserve the right to suspend or terminate any account that violates these terms, engages in suspicious activity, or fails KYC verification.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">8. Limitation of Liability</h2>
            <p>{siteName} is not liable for any losses incurred through betting. Users participate at their own risk. We are not responsible for service interruptions due to technical issues beyond our control.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">9. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
