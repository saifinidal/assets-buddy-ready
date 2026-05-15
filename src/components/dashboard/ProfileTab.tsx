import { Copy, Shield, LogOut, ChevronRight, User, Mail, Phone, Hash, Crown, Wallet, Calendar, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";
import type { AppUser } from "@/contexts/AuthContext";

export function ProfileTab({ user }: { user: AppUser | null }) {
  const { logout } = useAuth();

  if (!user) return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
      <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium text-muted-foreground">No profile data</p>
    </div>
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${text} copied to clipboard` });
  };

  const initials = user.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground font-display shadow-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email || "No email set"}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                user.kyc === "verified"
                  ? "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))] border-[hsl(var(--live)/.25)]"
                  : "bg-[hsl(var(--highlight)/.1)] text-[hsl(var(--highlight))] border-[hsl(var(--highlight)/.25)]"
              }`}>
                {user.kyc === "verified" ? <CheckCircle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                {user.kyc === "verified" ? "VERIFIED" : "KYC PENDING"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                <Crown className="h-3 w-3" />
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-secondary/40 px-4 py-2.5 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Account Information</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { icon: User, label: "Full Name", value: user.name },
            { icon: Mail, label: "Email", value: user.email || "Not set" },
            { icon: Phone, label: "Phone", value: user.phone || "Not set" },
            { icon: Hash, label: "User ID", value: user.id, copyable: true },
            { icon: Wallet, label: "Balance", value: `₹${user.balance.toLocaleString()}`, highlight: true },
          ].map((field) => (
            <div key={field.label} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60">
                <field.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{field.label}</p>
                <p className={`text-sm font-semibold mt-0.5 truncate ${field.highlight ? "text-primary" : "text-foreground"}`}>{field.value}</p>
              </div>
              {field.copyable && (
                <button onClick={() => handleCopy(field.value)} className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security & Actions */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-secondary/40 px-4 py-2.5 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Security & Settings</p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground">KYC Verification</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
              user.kyc === "verified"
                ? "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))]"
                : "bg-[hsl(var(--highlight)/.1)] text-[hsl(var(--highlight))]"
            }`}>
              {user.kyc === "verified" ? "Verified" : "Pending"}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <button
            onClick={async () => { await logout(); window.location.href = "/"; }}
            className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-destructive/5 text-destructive group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 group-hover:bg-destructive/15 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="flex-1 text-left text-sm font-semibold">Logout</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
