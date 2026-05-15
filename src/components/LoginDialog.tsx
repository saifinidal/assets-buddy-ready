import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "@/hooks/use-toast";
import defaultLogo from "@/assets/logo-royalbet.png";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export function LoginDialog({
  open,
  onOpenChange,
  title = "Welcome Back",
  description = "Login to continue playing",
  onSuccess,
}: LoginDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";
  const logoUrl = settings.site_logo_url || defaultLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      toast({ title: "Login Successful!", description: "Welcome back!" });
      setEmail("");
      setPassword("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-primary/20 bg-card shadow-2xl shadow-primary/20 [&>button]:hidden">
        {/* Premium gradient header with logo */}
        <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-primary/30 via-primary/10 to-background overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />

          <DialogClose className="absolute right-3 top-3 z-10 rounded-full p-1.5 bg-background/40 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-background/60 transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>

          <div className="relative flex flex-col items-center text-center">
            {/* Logo with glow ring */}
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl scale-110" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 p-[2px] shadow-lg shadow-primary/40">
                <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt={siteName} className="h-12 w-12 object-contain" />
                </div>
              </div>
            </div>

            <h2 className="font-display text-lg font-extrabold tracking-wider text-foreground uppercase">
              {siteName}
            </h2>
            <div className="mt-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-[260px]">{description}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 pb-5 pt-4 bg-card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-11 rounded-lg border border-border bg-surface pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                onClick={() => onOpenChange(false)}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold text-sm tracking-wide shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              disabled={submitting}
            >
              {submitting ? (
                "LOGGING IN..."
              ) : (
                <>
                  LOGIN & PLAY
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                New to {siteName}?
              </span>
            </div>
          </div>

          <Link
            to="/signup"
            onClick={() => onOpenChange(false)}
            className="block w-full h-10 rounded-lg border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-center text-sm font-bold text-primary leading-[2.25rem] transition-colors"
          >
            CREATE FREE ACCOUNT
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
