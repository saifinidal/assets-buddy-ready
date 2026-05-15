// @ts-nocheck
import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext"; // kept for potential use
import { useAuth, ROLE_LABELS, ROLE_HIERARCHY, UserRole } from "@/contexts/AuthContext";
import { useProfiles, useDeposits, useWithdrawals, useAgentRequests, type ProfileWithRole } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/loose";
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle, Trophy,
  Settings, LogOut, ChevronLeft, ChevronRight, Search, Bell,
  Ban, Check, X, Edit, Eye, Wallet, TrendingUp, TrendingDown,
  Shield, ToggleLeft, ToggleRight, Save, Globe, MessageSquare,
  CreditCard, Image, Moon, UserCog, ExternalLink, UserPlus, Percent,
  Volume2, GitBranch, Crown, UserCheck, UserX, ChevronDown, KeyRound, Gavel, FileSearch, Loader2, AlertTriangle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { NotificationPanel } from "@/components/admin/NotificationPanel";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { PaymentAccountsTab } from "@/components/admin/PaymentAccountsTab";
import { AdminSupportTab } from "@/components/admin/AdminSupportTab";
import { AdminPopupSettings } from "@/components/admin/AdminPopupSettings";
import { AdminKycTab } from "@/components/admin/AdminKycTab";
import { AdminVipReferralTab } from "@/components/admin/AdminVipReferralTab";
import { AdminMatchesTab } from "@/components/admin/AdminMatchesTab";
import { AdminSettlementTab } from "@/components/admin/AdminSettlementTab";
import { AdminApiOddsTab } from "@/components/admin/AdminApiOddsTab";
import { AdminAuditLogTab } from "@/components/admin/AdminAuditLogTab";
import { useAuditLog } from "@/hooks/useAuditLog";
import { AdminCasinoIconsTab } from "@/components/admin/AdminCasinoIconsTab";
import { AdminGameLaunchLogsTab } from "@/components/admin/AdminGameLaunchLogsTab";
// ============ TYPES ============
type AdminTab = "dashboard" | "users" | "agents" | "roles" | "deposits" | "withdrawals" | "matches" | "apiodds" | "settlement" | "payments" | "kyc" | "vip" | "commissions" | "support" | "popup" | "settings" | "audit" | "casinoicons" | "gamelaunchlogs";

// ============ MOCK DATA (only for tabs not yet on DB) ============


const sidebarItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "agents", label: "Agents", icon: UserCog },
  { id: "roles", label: "Role Mgmt", icon: Crown },
  { id: "deposits", label: "Deposits", icon: ArrowDownCircle },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpCircle },
  { id: "matches", label: "Matches", icon: Trophy },
  { id: "apiodds", label: "API Markets", icon: Globe },
  { id: "settlement", label: "Settlement", icon: Gavel },
  { id: "payments", label: "Pay Accounts", icon: CreditCard },
  { id: "kyc", label: "KYC", icon: Shield },
  { id: "vip", label: "VIP & Referral", icon: Crown },
  { id: "commissions", label: "Commissions", icon: Percent },
  { id: "support", label: "Support", icon: MessageSquare },
  { id: "popup", label: "Popup", icon: Image },
  { id: "casinoicons", label: "Casino Icons", icon: Image },
  { id: "gamelaunchlogs", label: "Game Launches", icon: AlertTriangle },
  { id: "audit", label: "Audit Log", icon: FileSearch },
  { id: "settings", label: "Settings", icon: Settings },
];

// ============ MAIN COMPONENT ============
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("admin-sound-enabled");
    return stored !== null ? stored === "true" : true;
  });
  const handleCountChange = useCallback((count: number) => setUnreadCount(count), []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200 ${collapsed ? "w-14" : "w-52"}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-border px-3 h-12">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary shrink-0">
            <span className="font-display text-sm font-bold text-primary-foreground">A</span>
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold text-foreground">
              ADMIN<span className="text-primary"> PANEL</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-muted-foreground hover:text-foreground hidden md:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 space-y-0.5 px-1.5">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2">
          <button
            onClick={() => {
              // Will be handled by auth context logout
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 h-12">
          <h1 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            {sidebarItems.find((i) => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-live-red text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                onCountChange={handleCountChange}
                soundEnabled={soundEnabled}
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-surface px-2 py-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Super Admin</span>
            </div>
          </div>
        </header>

        <div className="p-4">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "agents" && <AgentsTab />}
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "deposits" && <DepositsTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "matches" && <AdminMatchesTab />}
          {activeTab === "apiodds" && <AdminApiOddsTab />}
          {activeTab === "settlement" && <AdminSettlementTab />}
          {activeTab === "payments" && <PaymentAccountsTab />}
          {activeTab === "kyc" && <AdminKycTab />}
          {activeTab === "vip" && <AdminVipReferralTab />}
          {activeTab === "commissions" && <CommissionHistoryTab />}
          {activeTab === "support" && <AdminSupportTab />}
          {activeTab === "popup" && <AdminPopupSettings />}
          {activeTab === "casinoicons" && <AdminCasinoIconsTab />}
          {activeTab === "gamelaunchlogs" && <AdminGameLaunchLogsTab />}
          {activeTab === "audit" && <AdminAuditLogTab />}
          {activeTab === "settings" && <AdminSettingsTab onSwitchTab={(tab) => setActiveTab(tab as AdminTab)} />}
        </div>
      </main>
    </div>
  );
};

// ============ DASHBOARD TAB ============
function DashboardTab() {
  const { profiles, loading: profilesLoading } = useProfiles();
  const { deposits, loading: depositsLoading } = useDeposits();
  const { withdrawals, loading: withdrawalsLoading } = useWithdrawals();

  const totalUsers = profiles.length;
  const activeUsers = profiles.filter((p) => p.status === "active").length;
  const totalDepositsAmt = deposits.filter((d) => d.status === "approved").reduce((s, d) => s + d.amount, 0);
  const totalWithdrawalsAmt = withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const pendingDeps = deposits.filter((d) => d.status === "pending").length;
  const pendingWths = withdrawals.filter((w) => w.status === "pending").length;

  const statCards = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Active Users", value: activeUsers.toLocaleString(), icon: Users, color: "text-live" },
    { label: "Total Deposits", value: `₹${(totalDepositsAmt / 100000).toFixed(1)}L`, icon: ArrowDownCircle, color: "text-live" },
    { label: "Total Withdrawals", value: `₹${(totalWithdrawalsAmt / 100000).toFixed(1)}L`, icon: ArrowUpCircle, color: "text-live-red" },
    { label: "Pending Deposits", value: pendingDeps.toString(), icon: ArrowDownCircle, color: "text-highlight" },
    { label: "Pending Withdrawals", value: pendingWths.toString(), icon: ArrowUpCircle, color: "text-highlight" },
    { label: "Live Matches", value: "—", icon: Trophy, color: "text-live-red" },
    { label: "Total Bets", value: "—", icon: TrendingUp, color: "text-primary" },
  ];

  if (profilesLoading || depositsLoading || withdrawalsLoading) {
    return <div className="text-center py-8 text-muted-foreground text-xs">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Deposits</h3>
          </div>
          <div className="divide-y divide-border">
            {deposits.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{d.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleString() : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-live">+₹{d.amount.toLocaleString()}</p>
                  <StatusBadge status={d.status || "pending"} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Withdrawals</h3>
          </div>
          <div className="divide-y divide-border">
            {withdrawals.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{w.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{w.created_at ? new Date(w.created_at).toLocaleString() : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-live-red">-₹{w.amount.toLocaleString()}</p>
                  <StatusBadge status={w.status || "pending"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ USERS TAB ============
function UsersTab() {
  const [search, setSearch] = useState("");
  const { profiles, loading, updateProfileStatus } = useProfiles();
  const audit = useAuditLog();
  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: string; authUserId: string; userName: string }>({ open: false, userId: "", authUserId: "", userName: "" });
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [viewUser, setViewUser] = useState<ProfileWithRole | null>(null);
  const [editUser, setEditUser] = useState<ProfileWithRole | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", balance: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Only show "user" role profiles
  const userProfiles = profiles.filter((p) => p.role === "user");
  const filtered = userProfiles.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.display_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { user_id: resetDialog.authUserId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Password Reset!", description: `Password updated for ${resetDialog.userName}` });
        audit("password_reset", `Reset password for ${resetDialog.userName}`, {
          targetType: "user", targetId: resetDialog.userId, metadata: { user_name: resetDialog.userName },
        });
        setResetDialog({ open: false, userId: "", authUserId: "", userName: "" });
        setNewPassword("");
      } else {
        toast({ title: "Failed", description: data?.error || "Could not reset password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reset password", variant: "destructive" });
    }
    setResetting(false);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const updates: { name?: string; phone?: string; balance?: number } = {};
      if (editForm.name !== editUser.name) updates.name = editForm.name;
      if (editForm.phone !== (editUser.phone || "")) updates.phone = editForm.phone;
      if (editForm.balance !== String(editUser.balance || 0)) updates.balance = parseFloat(editForm.balance) || 0;
      
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", editUser.id);
        toast({ title: "Updated!", description: `${editForm.name} profile updated` });
      }
      setEditUser(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setEditSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading users...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <Button size="sm" className="text-xs h-8">+ Add User</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Balance</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">KYC</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{user.display_id}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{user.name}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{user.phone}</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">₹{(user.balance || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center"><KycBadge status={user.kyc || "pending"} /></td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={user.status || "active"} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewUser(user)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setEditUser(user); setEditForm({ name: user.name, phone: user.phone || "", balance: String(user.balance || 0) }); }} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-primary" title="Wallet"><Wallet className="h-3.5 w-3.5" /></button>
                      <button
                        onClick={() => setResetDialog({ open: true, userId: user.id, authUserId: user.user_id || "", userName: user.name })}
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-highlight" title="Reset Password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = user.status === "active" ? "blocked" : "active";
                          updateProfileStatus(user.id, newStatus);
                          toast({ title: newStatus === "blocked" ? "User Blocked" : "User Unblocked", description: user.name });
                          audit(newStatus === "blocked" ? "block_user" : "unblock_user",
                            `${newStatus === "blocked" ? "Blocked" : "Unblocked"} user ${user.name}`,
                            { targetType: "user", targetId: user.id, metadata: { user_name: user.name } });
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-live-red" title="Block"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialog.open} onOpenChange={(o) => { if (!o) { setResetDialog({ open: false, userId: "", authUserId: "", userName: "" }); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-primary" />
              Reset Password — {resetDialog.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">New Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
                  setNewPassword(Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
                }}
              >
                Generate Random
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={handleResetPassword} disabled={resetting || !newPassword}>
                {resetting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">User will need to login with this new password. Share it securely.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(o) => { if (!o) setViewUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-primary" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-2 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono font-semibold text-foreground">{viewUser.display_id}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={viewUser.status || "active"} /></div>
                <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold text-foreground">{viewUser.name}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{viewUser.phone || "—"}</span></div>
                <div><span className="text-muted-foreground">Balance:</span> <span className="font-bold text-foreground">₹{(viewUser.balance || 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">KYC:</span> <KycBadge status={viewUser.kyc || "pending"} /></div>
                <div><span className="text-muted-foreground">Role:</span> <span className="font-semibold text-foreground capitalize">{viewUser.role}</span></div>
                <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString() : "—"}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Edit className="h-4 w-4 text-primary" />
              Edit User — {editUser?.name}
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3 py-2">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Phone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Balance (₹)</label>
                <input type="number" value={editForm.balance} onChange={(e) => setEditForm(f => ({ ...f, balance: e.target.value }))}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ AGENTS TAB ============
function AgentsTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<ProfileWithRole | null>(null);
  const [editComm, setEditComm] = useState("");
  const [editShare, setEditShare] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const roles = ["all", "Super Stockist", "Stockist", "Master", "Agent"];
  const { profiles, loading, createProfile, updateProfileStatus, fetchProfiles } = useProfiles();

  const ROLE_TO_LABEL: Record<string, string> = {
    super_stockist: "Super Stockist", stockist: "Stockist", master: "Master", agent: "Agent", sub_agent: "Sub-Agent",
  };
  const LABEL_TO_ROLE: Record<string, string> = {
    "Super Stockist": "super_stockist", "Stockist": "stockist", "Master": "master", "Agent": "agent",
  };

  // Filter agent-level profiles from DB
  const agentProfiles = profiles.filter((p) => ["super_stockist", "stockist", "master", "agent", "sub_agent"].includes(p.role));

  // Create Agent form state
  const [form, setForm] = useState({ name: "", phone: "", role: "", share: "", comm: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = "Name must be at least 3 characters";
    if (!form.name.trim() || form.name.trim().length > 50) errs.name = errs.name || "Name must be under 50 characters";
    if (!/^\+?\d[\d\s-]{7,15}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Enter a valid phone number";
    if (!form.role) errs.role = "Select a role";
    const share = parseFloat(form.share);
    if (isNaN(share) || share < 0 || share > 100) errs.share = "Share must be 0-100%";
    const comm = parseFloat(form.comm);
    if (isNaN(comm) || comm < 0 || comm > 10) errs.comm = "Commission must be 0-10%";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    const roleKey = LABEL_TO_ROLE[form.role] || "agent";
    await createProfile({
      name: form.name,
      phone: form.phone,
      role: roleKey,
      share: parseFloat(form.share),
      commission: parseFloat(form.comm),
    });
    toast({
      title: "Agent Created!",
      description: `${form.name} added as ${form.role} with ${form.share}% share & ${form.comm}% commission`,
    });
    setForm({ name: "", phone: "", role: "", share: "", comm: "", password: "" });
    setErrors({});
    setCreateOpen(false);
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", role: "", share: "", comm: "", password: "" });
    setErrors({});
    setCreateOpen(false);
  };

  const filtered = agentProfiles.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.display_id.toLowerCase().includes(search.toLowerCase());
    const roleLabel = ROLE_TO_LABEL[a.role] || a.role;
    const matchRole = roleFilter === "all" || roleLabel === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAgents = agentProfiles.length;
  const activeAgents = agentProfiles.filter((a) => a.status === "active").length;
  const totalBalance = agentProfiles.reduce((s, a) => s + (a.balance || 0), 0);

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading agents...</div>;

  const inputClass = (field: string) =>
    `w-full h-9 rounded-md border ${errors[field] ? "border-destructive" : "border-border"} bg-surface px-3 text-xs text-foreground outline-none focus:border-primary transition-colors`;

  return (
    <div className="space-y-3">
      {/* Create Agent Modal */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetForm(); else setCreateOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Create New Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {/* Name */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter agent name"
                className={inputClass("name")}
                maxLength={50}
              />
              {errors.name && <p className="text-[10px] text-destructive mt-0.5">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={inputClass("phone")}
                maxLength={16}
              />
              {errors.phone && <p className="text-[10px] text-destructive mt-0.5">{errors.phone}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Role *</label>
              <div className="grid grid-cols-2 gap-1.5">
                {["Super Stockist", "Stockist", "Master", "Agent"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`rounded-md border px-3 py-2 text-[11px] font-semibold transition-colors ${
                      form.role === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-[10px] text-destructive mt-0.5">{errors.role}</p>}
            </div>

            {/* Share & Commission */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Share % *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.share}
                    onChange={(e) => setForm({ ...form, share: e.target.value })}
                    placeholder="0-100"
                    className={inputClass("share")}
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                {errors.share && <p className="text-[10px] text-destructive mt-0.5">{errors.share}</p>}
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Commission % *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.comm}
                    onChange={(e) => setForm({ ...form, comm: e.target.value })}
                    placeholder="0-10"
                    className={inputClass("comm")}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
                {errors.comm && <p className="text-[10px] text-destructive mt-0.5">{errors.comm}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className={inputClass("password")}
                maxLength={50}
              />
              {errors.password && <p className="text-[10px] text-destructive mt-0.5">{errors.password}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={resetForm}>
                Cancel
              </Button>
              <Button className="flex-1 text-xs gap-1" onClick={handleCreate}>
                <UserPlus className="h-3.5 w-3.5" />
                Create Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Agents</span>
          <p className="font-display text-xl font-bold text-primary">{totalAgents}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active</span>
          <p className="font-display text-xl font-bold text-live">{activeAgents}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Balance</span>
          <p className="font-display text-xl font-bold text-foreground">₹{(totalBalance / 100000).toFixed(1)}L</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total P&L</span>
          <p className="font-display text-xl font-bold text-muted-foreground">—</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                roleFilter === r ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <Link
            to="/agent"
            className="flex items-center gap-1 rounded-md bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Agent Panel
          </Link>
          <Button size="sm" className="text-xs h-8 gap-1" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Agent Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Role</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Share%</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Comm%</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Balance</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const roleLabel = ROLE_TO_LABEL[a.role] || a.role;
                return (
                <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{a.display_id}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.phone}</p>
                  </td>
                  <td className="px-3 py-2 text-center"><AgentRoleBadge role={roleLabel} /></td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{a.share}%</td>
                  <td className="px-3 py-2 text-right font-semibold text-highlight">{a.commission}%</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">₹{(a.balance || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={a.status || "active"} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setEditAgent(a); setEditComm(String(a.commission || 0)); setEditShare(String(a.share || 0)); }} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit Share/Comm"><Percent className="h-3.5 w-3.5" /></button>
                      <button className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-primary" title="Wallet"><Wallet className="h-3.5 w-3.5" /></button>
                      <button onClick={() => updateProfileStatus(a.id, a.status === "active" ? "blocked" : "active")} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-live-red" title="Block"><Ban className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Commission/Share Dialog */}
      <Dialog open={!!editAgent} onOpenChange={(open) => { if (!open) setEditAgent(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Edit Commission & Share
            </DialogTitle>
          </DialogHeader>
          {editAgent && (
            <div className="space-y-3 pt-2">
              <div className="rounded-md bg-surface p-2 text-xs">
                <p className="font-semibold text-foreground">{editAgent.name}</p>
                <p className="text-[10px] text-muted-foreground">{editAgent.display_id} • {ROLE_TO_LABEL[editAgent.role] || editAgent.role}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Commission Rate (%)</label>
                <div className="flex gap-1.5 mb-2">
                  {["2", "5", "7", "10"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditComm(v)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                        editComm === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editComm}
                  onChange={(e) => setEditComm(e.target.value)}
                  placeholder="Custom value"
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Share (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editShare}
                  onChange={(e) => setEditShare(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditAgent(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs" disabled={editSaving} onClick={async () => {
                  setEditSaving(true);
                  await supabase.from("profiles").update({
                    commission: parseFloat(editComm) || 0,
                    share: parseFloat(editShare) || 0,
                  }).eq("id", editAgent.id);
                  toast({ title: "Updated!", description: `${editAgent.name}: Commission ${editComm}%, Share ${editShare}%` });
                  setEditAgent(null);
                  setEditSaving(false);
                  fetchProfiles();
                }}>
                  {editSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ COMMISSION HISTORY TAB ============
const PAGE_SIZE = 50;

function CommissionHistoryTab() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
   const [page, setPage] = useState(0);
   const [sortCol, setSortCol] = useState<"created_at" | "turnover" | "amount">("created_at");
   const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [depositMeta, setDepositMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
   const [uniqueAgents, setUniqueAgents] = useState<[string, string][]>([]);
   const agentCacheRef = useRef<{ key: string; data: [string, string][] } | null>(null);

   // Cache agents dropdown — refresh only when date/amount filters change
   const agentCacheKey = `${dateFrom}|${dateTo}|${minAmount}|${maxAmount}`;
   useEffect(() => {
     if (agentCacheRef.current?.key === agentCacheKey) {
       setUniqueAgents(agentCacheRef.current.data);
       return;
     }
     (async () => {
       let q = supabase.from("commissions").select("profile_id").eq("type", "deposit");
       if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
       if (dateTo) q = q.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
       if (minAmount) q = q.gte("turnover", parseFloat(minAmount));
       if (maxAmount) q = q.lte("turnover", parseFloat(maxAmount));
       const { data } = await q;
       if (data && data.length > 0) {
         const ids = [...new Set(data.map(c => c.profile_id))];
         const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", ids);
         if (profiles) {
           const sorted = profiles.map(p => [p.id, p.name] as [string, string]).sort((a, b) => a[1].localeCompare(b[1]));
           agentCacheRef.current = { key: agentCacheKey, data: sorted };
           setUniqueAgents(sorted);
         }
       } else {
         agentCacheRef.current = { key: agentCacheKey, data: [] };
         setUniqueAgents([]);
       }
     })();
   }, [agentCacheKey]);

  // Debounced search to avoid firing on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, dateFrom, dateTo, agentFilter, minAmount, maxAmount, sortCol, sortAsc]);

  // Fetch with server-side filters + pagination
  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("commissions")
      .select("*", { count: "exact" })
       .eq("type", "deposit")
       .order(sortCol, { ascending: sortAsc })
       .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte("created_at", new Date(`${dateTo}T23:59:59`).toISOString());
    if (agentFilter !== "all") query = query.eq("profile_id", agentFilter);
    if (minAmount) query = query.gte("turnover", parseFloat(minAmount));
    if (maxAmount) query = query.lte("turnover", parseFloat(maxAmount));

    const { data: comms, count } = await query;
    setTotalCount(count || 0);

    if (comms && comms.length > 0) {
      const profileIds = [...new Set(comms.flatMap(c => [c.profile_id, c.from_profile_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, display_id")
        .in("id", profileIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p]));

      const mapped = comms.map(c => ({
        ...c,
        agentName: pMap.get(c.profile_id)?.name || "—",
        agentDisplayId: pMap.get(c.profile_id)?.display_id || "",
        userName: pMap.get(c.from_profile_id)?.name || "—",
        userDisplayId: pMap.get(c.from_profile_id)?.display_id || "",
        depositId: c.match_event?.replace("deposit:", "") || "—",
      }));

      // Client-side text search (name/depositId not filterable server-side easily)
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        setCommissions(mapped.filter(c =>
          c.agentName?.toLowerCase().includes(s) || c.userName?.toLowerCase().includes(s) || c.depositId?.includes(s)
        ));
      } else {
        setCommissions(mapped);
      }
    } else {
      setCommissions([]);
    }
    setLoading(false);
  }, [page, dateFrom, dateTo, agentFilter, minAmount, maxAmount, debouncedSearch, sortCol, sortAsc]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  const openDetail = async (c: any) => {
    setSelected(c);
    setDepositMeta(null);
    if (c.depositId && c.depositId !== "—") {
      setLoadingMeta(true);
      const { data: dep } = await supabase.from("deposits").select("*").eq("id", c.depositId).single();
      setDepositMeta(dep || null);
      setLoadingMeta(false);
    }
  };

  const totalComm = commissions.reduce((s: number, c: any) => s + (c.amount || 0), 0);
  const totalTurnover = commissions.reduce((s: number, c: any) => s + (c.turnover || 0), 0);
  const hasFilters = search || dateFrom || dateTo || agentFilter !== "all" || minAmount || maxAmount;
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); setAgentFilter("all"); setMinAmount(""); setMaxAmount(""); setPage(0); };
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // removed full-page loading gate — inline spinner shown in pagination footer instead

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Records</p>
          <p className="font-display text-xl font-bold text-foreground mt-0.5">{totalCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Paid</p>
          <p className="font-display text-xl font-bold text-primary mt-0.5">₹{totalComm.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Deposit Volume</p>
          <p className="font-display text-xl font-bold text-foreground mt-0.5">₹{totalTurnover.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Unique Agents</p>
          <p className="font-display text-xl font-bold text-foreground mt-0.5">{uniqueAgents.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-[10px] font-semibold text-primary hover:underline">Clear All</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
          </div>
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary">
            <option value="all">All Agents</option>
            {uniqueAgents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          <div>
            <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">Min Deposit ₹</label>
            <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="0" min="0"
              className="w-full h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">Max Deposit ₹</label>
            <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="∞" min="0"
              className="w-full h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
             <thead>
               <tr className="border-b border-border bg-surface">
                 <th className="px-3 py-2 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground"
                   onClick={() => { if (sortCol === "created_at") setSortAsc(a => !a); else { setSortCol("created_at"); setSortAsc(false); } }}>
                   Date {sortCol === "created_at" ? (sortAsc ? "↑" : "↓") : ""}
                 </th>
                 <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Deposit ID</th>
                 <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Agent</th>
                 <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                 <th className="px-3 py-2 text-right font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground"
                   onClick={() => { if (sortCol === "turnover") setSortAsc(a => !a); else { setSortCol("turnover"); setSortAsc(false); } }}>
                   Deposit Amt {sortCol === "turnover" ? (sortAsc ? "↑" : "↓") : ""}
                 </th>
                 <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Rate</th>
                 <th className="px-3 py-2 text-right font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground"
                   onClick={() => { if (sortCol === "amount") setSortAsc(a => !a); else { setSortCol("amount"); setSortAsc(false); } }}>
                   Commission {sortCol === "amount" ? (sortAsc ? "↑" : "↓") : ""}
                 </th>
               </tr>
             </thead>
            <tbody className="divide-y divide-border">
              {commissions.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No deposit commissions found</td></tr>
              )}
              {commissions.map(c => (
                <tr key={c.id} onClick={() => openDetail(c)} className="hover:bg-surface/50 transition-colors cursor-pointer">
                  <td className="px-3 py-2 text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{c.depositId.slice(0, 8)}…</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{c.agentName}</p>
                    <p className="text-[10px] text-muted-foreground">{c.agentDisplayId}</p>
                  </td>
                  <td className="px-3 py-2 text-foreground">{c.userName}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">₹{(c.turnover || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center font-bold text-primary">{c.comm_rate}%</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">₹{(c.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          <p className="text-[10px] text-muted-foreground">
            Page {page + 1} of {totalPages || 1} · {totalCount} matching record{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}
            className="h-7 px-2.5 rounded-md border border-border bg-surface text-xs font-medium text-foreground disabled:opacity-40 hover:bg-card">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button disabled={page >= totalPages - 1 || loading} onClick={() => setPage(p => p + 1)}
            className="h-7 px-2.5 rounded-md border border-border bg-surface text-xs font-medium text-foreground disabled:opacity-40 hover:bg-card">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
              <h3 className="text-sm font-bold text-foreground">Commission Details</h3>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-card text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Commission Calculation */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Commission Calculation</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="font-semibold text-foreground">₹{(selected.turnover || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Commission Rate</span>
                  <span className="font-semibold text-foreground">{selected.comm_rate}%</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Formula</span>
                    <span className="font-mono text-[10px] text-foreground">₹{(selected.turnover || 0).toLocaleString()} × {selected.comm_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="font-bold text-primary">Commission Earned</span>
                    <span className="font-bold text-primary">₹{(selected.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Agent & User Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface p-2.5 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Agent</p>
                  <p className="text-xs font-semibold text-foreground">{selected.agentName}</p>
                  <p className="text-[10px] text-muted-foreground">{selected.agentDisplayId}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2.5 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Depositor</p>
                  <p className="text-xs font-semibold text-foreground">{selected.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{selected.userDisplayId}</p>
                </div>
              </div>

              {/* Deposit Metadata */}
              <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deposit Metadata</p>
                {loadingMeta ? (
                  <p className="text-xs text-muted-foreground">Loading deposit info…</p>
                ) : depositMeta ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deposit ID</span><span className="font-mono text-[10px] text-foreground">{depositMeta.id}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">₹{Number(depositMeta.amount).toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Method</span><span className="text-foreground capitalize">{depositMeta.method || "—"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">UTR</span><span className="font-mono text-[10px] text-foreground">{depositMeta.utr || "—"}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span>
                      <span className={`font-semibold ${depositMeta.status === "approved" ? "text-green-500" : depositMeta.status === "rejected" ? "text-destructive" : "text-yellow-500"}`}>
                        {depositMeta.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Date</span><span className="text-foreground">{new Date(depositMeta.created_at).toLocaleString()}</span></div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Deposit record not found</p>
                )}
              </div>

              {/* Commission Record */}
              <div className="rounded-lg border border-border bg-surface p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Commission Record</p>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Commission ID</span><span className="font-mono text-[10px] text-foreground">{selected.id}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Type</span><span className="text-foreground capitalize">{selected.type}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Created</span><span className="text-foreground">{selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentRoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    "Super Stockist": "bg-highlight/15 text-highlight",
    "Stockist": "bg-primary/12 text-primary",
    "Master": "bg-back/15 text-back",
    "Agent": "bg-live/15 text-live",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[role] || "bg-surface text-muted-foreground"}`}>
      {role}
    </span>
  );
}


// ============ ROLES TAB ============
function RolesTab() {
  const { profiles, loading, updateProfileRole, updateProfileStatus } = useProfiles();
  const { requests: agentReqs, loading: reqLoading, updateRequestStatus } = useAgentRequests();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [promoteRole, setPromoteRole] = useState<UserRole>("agent");
  const [promoteShare, setPromoteShare] = useState("50");
  const [promoteComm, setPromoteComm] = useState("1.5");
  const [promoteParent, setPromoteParent] = useState("");
  const [requestTab, setRequestTab] = useState<"users" | "requests">("users");

  const agentRoles: UserRole[] = ["super_stockist", "stockist", "master", "agent", "sub_agent"];
  const allRoles: UserRole[] = [...ROLE_HIERARCHY];

  const filteredUsers = profiles.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.display_id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const pendingRequests = agentReqs.filter((r) => r.status === "pending");

  const handlePromote = async () => {
    if (!selectedUser || !promoteParent) {
      toast({ title: "Error", description: "Select parent agent", variant: "destructive" });
      return;
    }
    await updateProfileRole(selectedUser, promoteRole, promoteParent, parseFloat(promoteShare), parseFloat(promoteComm));
    toast({ title: "Role Updated!", description: `User promoted to ${ROLE_LABELS[promoteRole]}` });
    setShowPromoteModal(false);
    setSelectedUser(null);
  };

  const handleApproveRequest = async (reqId: string) => {
    const req = agentReqs.find((r) => r.id === reqId);
    if (!req) return;
    await updateRequestStatus(reqId, "approved");
    // Update the user's role
    const parentRole = ROLE_HIERARCHY[ROLE_HIERARCHY.indexOf(req.requested_role as UserRole) - 1];
    const parent = profiles.find((u) => u.role === parentRole && u.status === "active");
    await updateProfileRole(req.profile_id, req.requested_role, parent?.id, 40, 1.0);
    toast({ title: "Request Approved!", description: `${req.userName} is now a ${ROLE_LABELS[req.requested_role as UserRole]}` });
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    super_stockist: "bg-[hsl(var(--highlight)/.15)] text-[hsl(var(--highlight))]",
    stockist: "bg-primary/12 text-primary",
    master: "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))]",
    agent: "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))]",
    sub_agent: "bg-secondary text-muted-foreground",
    user: "bg-secondary text-foreground",
  };

  if (loading || reqLoading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setRequestTab("users")}
          className={`rounded-md px-4 py-2 text-xs font-bold transition-colors ${
            requestTab === "users" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="inline h-3.5 w-3.5 mr-1" />
          All Users ({profiles.length})
        </button>
        <button
          onClick={() => setRequestTab("requests")}
          className={`relative rounded-md px-4 py-2 text-xs font-bold transition-colors ${
            requestTab === "requests" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="inline h-3.5 w-3.5 mr-1" />
          Agent Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {requestTab === "users" ? (
        <>
          {/* Hierarchy Summary */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
            {allRoles.map((role) => {
              const count = profiles.filter((u) => u.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
                  className={`rounded-lg border p-2 text-center transition-colors ${
                    roleFilter === role ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <p className="font-display text-lg font-bold text-foreground">{count}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{ROLE_LABELS[role]}</p>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>
            {roleFilter !== "all" && (
              <button onClick={() => setRoleFilter("all")} className="text-[10px] text-primary hover:underline">
                Clear Filter
              </button>
            )}
          </div>

          {/* Users Table with role management */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ID</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Current Role</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Parent</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Share%</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Comm%</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-3 py-2 font-mono text-muted-foreground">{user.display_id}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{user.phone}</p>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${roleColors[user.role] || ""}`}>
                            {ROLE_LABELS[user.role as UserRole] || user.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground hidden sm:table-cell">
                          {user.parentName || "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">{user.share}%</td>
                        <td className="px-3 py-2 text-right font-semibold text-[hsl(var(--highlight))]">{user.commission}%</td>
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={user.status || "active"} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {user.role !== "admin" && (
                              <>
                                <button
                                  onClick={() => { setSelectedUser(user.id); setPromoteRole(user.role === "user" ? "sub_agent" : user.role as UserRole); setShowPromoteModal(true); }}
                                  className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-primary" title="Change Role"
                                >
                                  <Crown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateProfileStatus(user.id, user.status === "active" ? "blocked" : "active");
                                    toast({ title: user.status === "active" ? "User Blocked" : "User Unblocked", description: user.name });
                                  }}
                                  className={`rounded p-1 ${user.status === "active" ? "text-muted-foreground hover:text-destructive" : "text-destructive hover:text-live"}`}
                                  title={user.status === "active" ? "Block" : "Unblock"}
                                >
                                  {user.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Agent Requests */
        <div className="space-y-3">
          {agentReqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No agent requests yet</div>
          ) : (
            <div className="space-y-2">
              {agentReqs.map((req) => (
                <div key={req.id} className={`rounded-lg border p-4 transition-colors ${
                  req.status === "pending" ? "border-[hsl(var(--highlight))] bg-[hsl(var(--highlight)/.04)]" : "border-border bg-card"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{req.userName}</p>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          req.status === "pending" ? "bg-[hsl(var(--highlight)/.15)] text-[hsl(var(--highlight))]"
                            : req.status === "approved" ? "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))]"
                            : "bg-destructive/12 text-destructive"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Wants to become: <span className="font-semibold text-foreground">{ROLE_LABELS[req.requested_role as UserRole] || req.requested_role}</span>
                      </p>
                      <p className="text-xs text-muted-foreground italic">"{req.message}"</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Requested: {req.created_at ? new Date(req.created_at).toLocaleDateString() : ""}</p>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" className="text-xs h-7 gap-1 bg-[hsl(var(--live))] hover:bg-[hsl(var(--live))]/90" onClick={() => handleApproveRequest(req.id)}>
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={async () => {
                          await updateRequestStatus(req.id, "rejected");
                          toast({ title: "Request Rejected", description: req.userName });
                        }}>
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promote/Change Role Modal */}
      <Dialog open={showPromoteModal} onOpenChange={setShowPromoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Change User Role
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (() => {
            const user = profiles.find((u) => u.id === selectedUser);
            if (!user) return null;
            const possibleParents = profiles.filter((u) => {
              const parentIdx = ROLE_HIERARCHY.indexOf(promoteRole) - 1;
              if (parentIdx < 0) return false;
              return u.role === ROLE_HIERARCHY[parentIdx] && u.status === "active";
            });
            return (
              <div className="space-y-3 pt-2">
                <div className="rounded-md bg-surface p-3">
                  <p className="text-xs font-semibold text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">Current: {ROLE_LABELS[user.role as UserRole] || user.role}</p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">New Role *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {agentRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => setPromoteRole(r)}
                        className={`rounded-md border px-2 py-2 text-[10px] font-bold transition-colors ${
                          promoteRole === r ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Assign Under (Parent) *</label>
                  <select
                    value={promoteParent}
                    onChange={(e) => setPromoteParent(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value="">Select Parent</option>
                    {profiles.filter((p) => p.role === "admin").map((p) => (
                      <option key={p.id} value={p.id}>Admin (Direct)</option>
                    ))}
                    {possibleParents.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({ROLE_LABELS[p.role as UserRole] || p.role})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Share %</label>
                    <input
                      type="number"
                      value={promoteShare}
                      onChange={(e) => setPromoteShare(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
                      min={0} max={100}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Commission %</label>
                    <input
                      type="number"
                      value={promoteComm}
                      onChange={(e) => setPromoteComm(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
                      min={0} max={10} step={0.1}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowPromoteModal(false)}>Cancel</Button>
                  <Button className="flex-1 text-xs gap-1" onClick={handlePromote}>
                    <Crown className="h-3.5 w-3.5" /> Update Role
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ DEPOSITS TAB ============
function DepositsTab() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "upi" | "bank" | "crypto">("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { deposits, loading, updateDepositStatus } = useDeposits();
  const audit = useAuditLog();

  // Confirm-approve dialog state
  const [confirmDep, setConfirmDep] = useState<(typeof deposits)[number] | null>(null);
  const [commPreview, setCommPreview] = useState<{ agentName: string; rate: number; amount: number } | null>(null);
  const [commLoading, setCommLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const filtered = deposits.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (methodFilter !== "all" && (d.method || "").toLowerCase() !== methodFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${d.userName || ""} ${d.utr || ""} ${d.id}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (dateFrom && d.created_at && new Date(d.created_at) < new Date(dateFrom)) return false;
    if (dateTo && d.created_at && new Date(d.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  });

  // Stats (on currently filtered set)
  const stats = {
    total: filtered.length,
    pending: filtered.filter((d) => d.status === "pending").length,
    approved: filtered.filter((d) => d.status === "approved").length,
    rejected: filtered.filter((d) => d.status === "rejected").length,
    approvedAmt: filtered.filter((d) => d.status === "approved").reduce((s, d) => s + d.amount, 0),
    pendingAmt: filtered.filter((d) => d.status === "pending").reduce((s, d) => s + d.amount, 0),
  };

  // Open confirm dialog and fetch commission preview
  const openApproveConfirm = async (dep: (typeof deposits)[number]) => {
    setConfirmDep(dep);
    setCommPreview(null);
    setCommLoading(true);
    try {
      // Fetch user's parent agent and their commission rate
      const { data: profile } = await supabase.from("profiles").select("parent_id").eq("id", dep.profile_id).single();
      if (profile?.parent_id) {
        const { data: agent } = await supabase.from("profiles").select("name, commission").eq("id", profile.parent_id).single();
        if (agent && (agent.commission || 0) > 0) {
          const rate = agent.commission || 0;
          const amount = Math.round(dep.amount * rate) / 100;
          setCommPreview({ agentName: agent.name, rate, amount });
        }
      }
    } catch { /* no preview available */ }
    setCommLoading(false);
  };

  const confirmApprove = async () => {
    if (!confirmDep) return;
    setApproving(true);
    const dep = confirmDep;
    await updateDepositStatus(dep.id, "approved");
    try {
      const { data: commResult } = await supabase.rpc("credit_agent_commission", { _deposit_id: dep.id });
      const cr = commResult as any;
      if (cr?.success) {
        toast({ title: "Deposit Approved", description: `Agent commission ₹${cr.commission} (${cr.rate}%) credited to ${cr.agent}` });
      } else {
        toast({ title: "Deposit Approved" });
      }
    } catch {
      toast({ title: "Deposit Approved" });
    }
    audit("approve_deposit", `Approved deposit ₹${dep.amount.toLocaleString()} for ${dep.userName}`, {
      targetType: "deposit", targetId: dep.id, metadata: { amount: dep.amount, method: dep.method, user: dep.userName },
    });
    setConfirmDep(null);
    setApproving(false);
  };

  const handleReject = async (dep: typeof deposits[number]) => {
    await updateDepositStatus(dep.id, "rejected");
    toast({ title: "Deposit Rejected" });
    audit("reject_deposit", `Rejected deposit ₹${dep.amount.toLocaleString()} from ${dep.userName}`, {
      targetType: "deposit", targetId: dep.id, metadata: { amount: dep.amount, method: dep.method, user: dep.userName },
    });
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Date", "User", "Amount", "Method", "UTR/TXID", "Status"],
      ...filtered.map((d) => [
        d.id,
        d.created_at ? new Date(d.created_at).toISOString() : "",
        d.userName || "",
        d.amount,
        d.method || "",
        d.utr || "",
        d.status || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deposits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} rows downloaded` });
  };

  const methodBadge = (m: string | null) => {
    const k = (m || "").toLowerCase();
    const cls =
      k === "crypto" ? "bg-[hsl(var(--live))]/10 text-[hsl(var(--live))]"
      : k === "bank" ? "bg-accent/10 text-accent"
      : "bg-primary/10 text-primary";
    return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${cls}`}>{m || "—"}</span>;
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading deposits...</div>;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-base font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-base font-bold text-highlight">{stats.pending} <span className="text-[10px] font-normal text-muted-foreground">· ₹{stats.pendingAmt.toLocaleString()}</span></p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Approved</p>
          <p className="text-base font-bold text-live">{stats.approved} <span className="text-[10px] font-normal text-muted-foreground">· ₹{stats.approvedAmt.toLocaleString()}</span></p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rejected</p>
          <p className="text-base font-bold text-live-red">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} {f === "pending" && `(${deposits.filter((d) => d.status === "pending").length})`}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {(["all", "upi", "bank", "crypto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase transition-colors ${
                methodFilter === m ? "bg-foreground text-background" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user / UTR / TXID / ID…"
            className="flex-1 min-w-[160px] h-8 rounded-md border border-border bg-background px-2 text-xs"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          />
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-8 text-xs">Export CSV</Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User / Date</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Method</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">UTR / TXID</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((dep) => (
                <tr key={dep.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{dep.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{dep.userName}</p>
                    <p className="text-[10px] text-muted-foreground">{dep.created_at ? new Date(dep.created_at).toLocaleString() : ""}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-live">₹{dep.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">{methodBadge(dep.method)}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground hidden md:table-cell max-w-[180px] truncate" title={dep.utr || ""}>{dep.utr}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={dep.status || "pending"} /></td>
                  <td className="px-3 py-2">
                    {dep.status === "pending" ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openApproveConfirm(dep)} className="rounded bg-live/10 p-1 text-live hover:bg-live/20" title="Approve"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleReject(dep)} className="rounded bg-live-red/10 p-1 text-live-red hover:bg-live-red/20" title="Reject"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground text-xs">No deposits match filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={!!confirmDep} onOpenChange={(open) => { if (!open) setConfirmDep(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-live" />
              Confirm Deposit Approval
            </DialogTitle>
          </DialogHeader>
          {confirmDep && (
            <div className="space-y-3 pt-1">
              {/* Deposit Info */}
              <div className="rounded-md bg-surface p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-semibold text-foreground">{confirmDep.userName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-live">₹{confirmDep.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium text-foreground uppercase">{confirmDep.method || "—"}</span>
                </div>
                {confirmDep.utr && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">UTR/TXID</span>
                    <span className="font-mono text-[10px] text-foreground">{confirmDep.utr}</span>
                  </div>
                )}
              </div>

              {/* Commission Preview */}
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Agent Commission Preview</p>
                {commLoading ? (
                  <p className="text-xs text-muted-foreground">Calculating...</p>
                ) : commPreview ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Agent</span>
                      <span className="font-semibold text-foreground">{commPreview.agentName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-bold text-primary">{commPreview.rate}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="font-bold text-primary">₹{commPreview.amount.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-destructive">⚠ Cannot approve — user has no parent agent or agent commission rate is 0%</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setConfirmDep(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs gap-1 bg-[hsl(var(--live))] hover:bg-[hsl(var(--live))]/90" disabled={approving || commLoading || !commPreview} onClick={confirmApprove}>
                  <Check className="h-3.5 w-3.5" />
                  {approving ? "Approving..." : !commPreview && !commLoading ? "Blocked" : "Approve Deposit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ WITHDRAWALS TAB ============
function WithdrawalsTab() {
  const [filter, setFilter] = useState("all");
  const { withdrawals, loading, updateWithdrawalStatus } = useWithdrawals();
  const audit = useAuditLog();
  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const handleApprove = async (wth: typeof withdrawals[number]) => {
    await updateWithdrawalStatus(wth.id, "approved");
    toast({ title: "Withdrawal Approved" });
    audit("approve_withdrawal", `Approved withdrawal ₹${wth.amount.toLocaleString()} for ${wth.userName}`, {
      targetType: "withdrawal", targetId: wth.id, metadata: { amount: wth.amount, bank_info: wth.bank_info, user: wth.userName },
    });
  };
  const handleReject = async (wth: typeof withdrawals[number]) => {
    await updateWithdrawalStatus(wth.id, "rejected");
    toast({ title: "Withdrawal Rejected" });
    audit("reject_withdrawal", `Rejected withdrawal ₹${wth.amount.toLocaleString()} from ${wth.userName}`, {
      targetType: "withdrawal", targetId: wth.id, metadata: { amount: wth.amount, bank_info: wth.bank_info, user: wth.userName },
    });
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading withdrawals...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {f} {f === "pending" && `(${withdrawals.filter((w) => w.status === "pending").length})`}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Bank/UPI</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((wth) => (
                <tr key={wth.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{wth.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{wth.userName}</p>
                    <p className="text-[10px] text-muted-foreground">{wth.created_at ? new Date(wth.created_at).toLocaleString() : ""}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-live-red">₹{wth.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-[10px] text-muted-foreground hidden sm:table-cell">{wth.bank_info}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={wth.status || "pending"} /></td>
                  <td className="px-3 py-2">
                    {wth.status === "pending" ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleApprove(wth)} className="rounded bg-live/10 p-1 text-live hover:bg-live/20" title="Approve"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleReject(wth)} className="rounded bg-live-red/10 p-1 text-live-red hover:bg-live-red/20" title="Reject"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// MatchesTab moved to src/components/admin/AdminMatchesTab.tsx


// Settings tab moved to src/components/admin/AdminSettingsTab.tsx

// ============ HELPER COMPONENTS ============
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-live/10 text-live",
    approved: "bg-live/10 text-live",
    pending: "bg-highlight/10 text-highlight",
    rejected: "bg-live-red/10 text-live-red",
    blocked: "bg-live-red/10 text-live-red",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] || "bg-surface text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function KycBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: "bg-live/10 text-live",
    pending: "bg-highlight/10 text-highlight",
    rejected: "bg-live-red/10 text-live-red",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

function MatchStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-live-red/10 text-live-red",
    upcoming: "bg-highlight/10 text-highlight",
    completed: "bg-live/10 text-live",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] || ""}`}>
      {status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />}
      {status}
    </span>
  );
}

export default AdminPanel;