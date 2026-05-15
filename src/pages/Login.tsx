import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { SiteLogo } from "@/components/SiteLogo";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      toast({ title: "Login Successful!", description: "Welcome back!" });
      navigate(result.redirectTo || "/");
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <SiteLogo />
          <p className="mt-2 text-xs text-muted-foreground">India's Most Trusted Betting Exchange</p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-foreground text-center mb-4">LOGIN</h2>

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

            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-10 rounded-md border border-border bg-surface pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  required
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

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full font-bold" size="lg" disabled={submitting}>
              {submitting ? "LOGGING IN..." : "LOGIN"}
              {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
