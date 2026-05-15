import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, User, Lock, Phone, Mail, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { SiteLogo } from "@/components/SiteLogo";
import { supabase } from "@/integrations/supabase/client";
import { useSystemControls } from "@/hooks/useSystemControls";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get("ref") || "",
    agreeTerms: false,
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const { registrationOpen } = useSystemControls();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationOpen) {
      toast({ title: "Registration Closed", description: "New signups are temporarily disabled by the admin.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match!", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await signup(form.email, form.password, form.fullName, form.mobile);
    if (result.success) {
      // Link referral if code provided
      if (form.referralCode.trim()) {
        try {
          // Find referrer by code
          const { data: referrer } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", form.referralCode.trim().toUpperCase())
            .single();
          
          if (referrer) {
            // Get the new user's profile (wait a moment for trigger)
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                const { data: newProfile } = await supabase
                  .from("profiles")
                  .select("id")
                  .eq("user_id", session.user.id)
                  .single();
                if (newProfile) {
                  await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", newProfile.id);
                }
              }
            }, 2000);
          }
        } catch {}
      }
      toast({ title: "Account Created!", description: "You can now login with your email and password." });
      navigate("/login");
    } else {
      toast({ title: "Signup Failed", description: result.error, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <SiteLogo />
          <p className="mt-2 text-xs text-muted-foreground">Create your account to start betting</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-foreground text-center mb-4">SIGN UP</h2>

          {!registrationOpen && (
            <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive text-center">
              New registrations are temporarily closed.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Enter your full name" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} placeholder="+91 98765 43210" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 6 characters" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter password" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" required minLength={6} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Referral Code (optional)</label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={form.referralCode} onChange={(e) => update("referralCode", e.target.value.toUpperCase())} placeholder="Enter referral code" className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors font-mono tracking-wider" maxLength={10} />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agreeTerms} onChange={(e) => update("agreeTerms", e.target.checked)} className="h-3.5 w-3.5 mt-0.5 rounded border-border accent-primary" required />
              <span className="text-[11px] text-muted-foreground leading-tight">
                I agree to the <span className="text-primary cursor-pointer hover:underline">Terms & Conditions</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
              </span>
            </label>

            <Button type="submit" className="w-full font-bold" size="lg" disabled={submitting || !registrationOpen}>
              {submitting ? "CREATING..." : !registrationOpen ? "CLOSED" : "CREATE ACCOUNT"}
              {!submitting && registrationOpen && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Login Here</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
