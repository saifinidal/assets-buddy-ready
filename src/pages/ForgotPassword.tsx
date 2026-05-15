import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SiteLogo } from "@/components/SiteLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Email Sent!", description: "Check your inbox for the password reset link." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <SiteLogo />
          <p className="mt-2 text-xs text-muted-foreground">Reset your password</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">Check Your Email</h2>
              <p className="text-xs text-muted-foreground">
                We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. 
                Click the link in the email to reset your password.
              </p>
              <p className="text-[10px] text-muted-foreground">
                Didn't receive? Check spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-primary hover:underline font-semibold">
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-bold text-foreground text-center mb-1">FORGOT PASSWORD</h2>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full font-bold" size="lg" disabled={submitting}>
                  {submitting ? "SENDING..." : "SEND RESET LINK"}
                  {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
