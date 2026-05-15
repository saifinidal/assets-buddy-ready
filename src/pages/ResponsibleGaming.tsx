import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ShieldCheck, AlertTriangle, Phone, Clock } from "lucide-react";

export default function ResponsibleGaming() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 text-destructive font-display text-xl font-black">
            18+
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Responsible Gaming</h1>
        </div>

        <div className="space-y-6 text-sm text-card-foreground leading-relaxed">
          {/* Warning Banner */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">Gambling involves risk</p>
              <p className="text-xs mt-1">Only gamble with money you can afford to lose. If you feel gambling is becoming a problem, seek help immediately.</p>
            </div>
          </div>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Age Restriction
            </h2>
            <p>{siteName} is strictly for users aged <strong className="text-foreground">18 years and above</strong>. We enforce age verification through our KYC process. Underage gambling is prohibited and any accounts found to belong to minors will be immediately closed.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Our Commitment</h2>
            <p>We are committed to providing a safe and responsible gaming environment. We offer tools and resources to help you stay in control of your gambling activities.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Tips for Responsible Gambling
            </h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Set a budget before you start and stick to it</li>
              <li>Never chase your losses</li>
              <li>Take regular breaks from gambling</li>
              <li>Don't gamble when you're upset, stressed, or under the influence</li>
              <li>Keep track of the time and money you spend gambling</li>
              <li>Balance gambling with other recreational activities</li>
              <li>Never borrow money to gamble</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Signs of Problem Gambling</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Spending more money or time than intended on gambling</li>
              <li>Feeling restless or irritable when trying to stop</li>
              <li>Lying to family or friends about gambling</li>
              <li>Gambling to escape problems or relieve stress</li>
              <li>Neglecting work, studies, or personal relationships</li>
              <li>Borrowing money or selling possessions to gamble</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2">Self-Exclusion</h2>
            <p>If you feel you need a break, you can request a temporary or permanent self-exclusion from our platform by contacting our <a href="/support" className="text-primary hover:underline">Support</a> team. During the exclusion period, you will not be able to access your account or place any bets.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> Get Help
            </h2>
            <p>If you or someone you know has a gambling problem, please reach out to professional help services:</p>
            <div className="mt-3 space-y-2">
              <div className="rounded-md bg-surface p-3 border border-border">
                <p className="font-semibold text-foreground text-xs">Gamblers Anonymous</p>
                <p className="text-[10px] text-muted-foreground">www.gamblersanonymous.org</p>
              </div>
              <div className="rounded-md bg-surface p-3 border border-border">
                <p className="font-semibold text-foreground text-xs">National Council on Problem Gambling</p>
                <p className="text-[10px] text-muted-foreground">www.ncpgambling.org</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
