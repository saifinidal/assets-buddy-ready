import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Privacy Policy</h1>

        <div className="space-y-6 text-sm text-card-foreground leading-relaxed">
          <p className="text-[10px] text-muted-foreground">Last Updated: May 2026</p>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect information you provide during registration (name, email, phone number), payment details for deposits/withdrawals, KYC documents for verification, and usage data to improve our services.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To create and manage your account</li>
              <li>To process deposits and withdrawals</li>
              <li>To verify your identity (KYC compliance)</li>
              <li>To provide customer support</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To send important account notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">3. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal data. Your payment information is processed through secure, encrypted channels.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">4. Data Sharing</h2>
            <p>We do not sell your personal information to third parties. We may share data with payment processors for transactions, regulatory authorities as required by law, and service providers who assist in operating our platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">5. Cookies</h2>
            <p>We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze platform usage. You can manage cookie settings through your browser.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">6. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information. You can manage your profile details from your account settings or contact our support team for assistance.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">7. Contact</h2>
            <p>For privacy-related inquiries, please contact us through our <a href="/support" className="text-primary hover:underline">Support</a> page.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
