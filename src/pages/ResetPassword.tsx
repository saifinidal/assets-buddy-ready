// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/loose";
import { toast } from "@/hooks/use-toast";
import { SiteLogo } from "@/components/SiteLogo";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setIsRecovery(true);
    }

    // Also listen for auth state changes (recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Password Updated!", description: "You can now login with your new password." });
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))] mx-auto">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Password Reset Successful!</h2>
            <p className="text-xs text-muted-foreground">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="font-display text-lg font-bold text-foreground">Invalid Reset Link</h2>
            <p className="text-xs text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full font-bold mt-2">Request New Link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <SiteLogo />
          <p className="mt-2 text-xs text-muted-foreground">Set your new password</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-foreground text-center mb-4">NEW PASSWORD</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold" size="lg" disabled={submitting}>
              {submitting ? "UPDATING..." : "UPDATE PASSWORD"}
              {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;