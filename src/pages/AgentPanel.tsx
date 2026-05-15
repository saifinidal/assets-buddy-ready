// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, Percent, GitBranch, FileBarChart,
  LogOut, ChevronLeft, ChevronRight, Search, Bell, Shield,
  Eye, Edit, Ban, Wallet, TrendingUp, TrendingDown,
  UserPlus, ChevronDown, ChevronUp, Minus, Handshake, Check, X, Clock,
  CheckCircle, XCircle, RefreshCw, ArrowUpCircle, Building2, Smartphone, Bitcoin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles, useSettlements, useCommissions, ProfileWithRole } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/loose";

// ============ TYPES ============
type AgentTab = "dashboard" | "downline" | "commission" | "settlement" | "withdrawal" | "hierarchy" | "reports";

interface HierarchyNode {
  id: string;
  displayId: string;
  name: string;
  role: string;
  share: number;
  balance: number;
  status: string;
  children: HierarchyNode[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  super_stockist: "Super Stockist",
  stockist: "Stockist",
  master: "Master",
  agent: "Agent",
  sub_agent: "Sub-Agent",
  user: "User",
};

const CHILD_ROLES: Record<string, string[]> = {
  admin: ["super_stockist", "stockist", "master", "agent", "sub_agent", "user"],
  super_stockist: ["stockist", "master", "agent", "sub_agent", "user"],
  stockist: ["master", "agent", "sub_agent", "user"],
  master: ["agent", "sub_agent", "user"],
  agent: ["sub_agent", "user"],
  sub_agent: ["user"],
};

const sidebarItems: { id: AgentTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "downline", label: "Downline", icon: Users },
  { id: "commission", label: "Commission", icon: Percent },
  { id: "settlement", label: "Settlement", icon: Handshake },
  { id: "withdrawal", label: "Withdrawal", icon: ArrowUpCircle },
  { id: "hierarchy", label: "Hierarchy", icon: GitBranch },
  { id: "reports", label: "Reports", icon: FileBarChart },
];

function getDownlineProfiles(profileId: string, profiles: ProfileWithRole[]): ProfileWithRole[] {
  const direct = profiles.filter((p) => p.parent_id === profileId);
  return direct.reduce<ProfileWithRole[]>((acc, p) => [...acc, p, ...getDownlineProfiles(p.id, profiles)], []);
}

function buildTree(profileId: string, profiles: ProfileWithRole[]): HierarchyNode {
  const p = profiles.find((pr) => pr.id === profileId);
  if (!p) return { id: "", displayId: "", name: "Unknown", role: "user", share: 0, balance: 0, status: "active", children: [] };
  const children = profiles.filter((pr) => pr.parent_id === profileId);
  return {
    id: p.id, displayId: p.display_id, name: p.name, role: p.role,
    share: p.share || 0, balance: p.balance || 0, status: p.status || "active",
    children: children.map((c) => buildTree(c.id, profiles)),
  };
}

// ============ MAIN COMPONENT ============
const AgentPanel = () => {
  const [activeTab, setActiveTab] = useState<AgentTab>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useAuth();
  const { profiles, loading: profilesLoading, fetchProfiles, updateProfileStatus, createProfile } = useProfiles();

  const agentProfile = useMemo(() => {
    if (!currentUser) return null;
    return profiles.find((p) => p.id === currentUser.profileId || p.display_id === currentUser.id) || null;
  }, [profiles, currentUser]);

  const downline = useMemo(() => {
    if (!agentProfile) return [];
    return getDownlineProfiles(agentProfile.id, profiles);
  }, [agentProfile, profiles]);

  const agentProfileId = agentProfile?.id;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200 ${collapsed ? "w-14" : "w-52"}`}>
        <div className="flex items-center gap-2 border-b border-border px-3 h-12">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[hsl(var(--highlight))] shrink-0">
            <span className="font-display text-sm font-bold text-accent-foreground">A</span>
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold text-foreground">
              AGENT<span className="text-[hsl(var(--highlight))]"> PANEL</span>
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-muted-foreground hover:text-foreground hidden md:block">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 py-2 space-y-0.5 px-1.5">
          {sidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                activeTab === item.id ? "bg-[hsl(var(--highlight))] text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <Link to="/" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 h-12">
          <h1 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            {sidebarItems.find((i) => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
              <Shield className="h-3.5 w-3.5 text-[hsl(var(--highlight))]" />
              <span className="text-[11px] font-semibold text-foreground">
                {agentProfile ? ROLE_LABELS[agentProfile.role] || agentProfile.role : "Agent"}
              </span>
            </div>
          </div>
        </header>

        <div className="p-4">
          {profilesLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <>
              {activeTab === "dashboard" && <AgentDashboard agentProfile={agentProfile} downline={downline} agentProfileId={agentProfileId} />}
              {activeTab === "downline" && (
                <DownlineTab
                  downline={downline}
                  agentProfile={agentProfile}
                  onStatusChange={async (id, status) => { await updateProfileStatus(id, status); }}
                  onBalanceAdjust={async (id, amount, type) => {
                    const profile = profiles.find(p => p.id === id);
                    if (!profile) return;
                    const newBal = type === "credit" ? (profile.balance || 0) + amount : (profile.balance || 0) - amount;
                    if (newBal < 0) { toast({ title: "Error", description: "Insufficient balance", variant: "destructive" }); return; }
                    await supabase.from("profiles").update({ balance: newBal }).eq("id", id);
                    await supabase.from("transactions").insert({
                      profile_id: id, type: type === "credit" ? "deposit" : "withdrawal",
                      description: `Agent ${type}: ₹${amount}`, credit: type === "credit" ? amount : 0,
                      debit: type === "debit" ? amount : 0, balance: newBal,
                    });
                    await fetchProfiles();
                    toast({ title: "Balance Updated", description: `₹${amount} ${type}ed. New balance: ₹${newBal}` });
                  }}
                  onCreateUser={async (data) => {
                    const res = await createProfile(data);
                    if (!res.error) toast({ title: "User Created", description: `${data.name} added as ${ROLE_LABELS[data.role]}` });
                    else toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
                  }}
                />
              )}
              {activeTab === "commission" && <CommissionTab agentProfileId={agentProfileId} />}
              {activeTab === "settlement" && <SettlementTab agentProfileId={agentProfileId} downline={downline} />}
              {activeTab === "withdrawal" && <AgentWithdrawalTab agentProfileId={agentProfileId} agentBalance={agentProfile?.balance || 0} />}
              {activeTab === "hierarchy" && <HierarchyTab agentProfile={agentProfile} profiles={profiles} />}
              {activeTab === "reports" && <ReportsTab agentProfile={agentProfile} downline={downline} agentProfileId={agentProfileId} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// ============ AGENT DASHBOARD ============
function AgentDashboard({ agentProfile, downline, agentProfileId }: { agentProfile: ProfileWithRole | null; downline: ProfileWithRole[]; agentProfileId?: string }) {
  const { commissions } = useCommissions(agentProfileId);
  const totalComm = commissions.reduce((s, c) => s + c.amount, 0);
  const activeDownline = downline.filter((d) => d.status === "active").length;

  const statCards = [
    { label: "My Balance", value: `₹${(agentProfile?.balance || 0).toLocaleString()}`, icon: Wallet, color: "text-foreground" },
    { label: "Total Downline", value: downline.length.toString(), icon: Users, color: "text-primary" },
    { label: "Active Downline", value: activeDownline.toString(), icon: Users, color: "text-[hsl(var(--live))]" },
    { label: "My Share", value: `${agentProfile?.share || 0}%`, icon: Percent, color: "text-[hsl(var(--highlight))]" },
    { label: "Commission Rate", value: `${agentProfile?.commission || 0}%`, icon: Percent, color: "text-[hsl(var(--highlight))]" },
    { label: "Total Commission", value: `₹${totalComm.toLocaleString()}`, icon: TrendingUp, color: "text-[hsl(var(--live))]" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Top Downline (by Balance)</h3>
          </div>
          <div className="divide-y divide-border">
            {[...downline].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</p>
                </div>
                <p className="text-xs font-bold text-foreground">₹{(u.balance || 0).toLocaleString()}</p>
              </div>
            ))}
            {downline.length === 0 && <div className="px-3 py-4 text-center text-xs text-muted-foreground">No downline yet</div>}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Recent Commission</h3>
          </div>
          <div className="divide-y divide-border">
            {commissions.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{c.fromName}</p>
                  <p className="text-[10px] text-muted-foreground">{c.match_event}</p>
                </div>
                <p className="text-xs font-bold text-[hsl(var(--live))]">+₹{c.amount.toLocaleString()}</p>
              </div>
            ))}
            {commissions.length === 0 && <div className="px-3 py-4 text-center text-xs text-muted-foreground">No commissions yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ DOWNLINE TAB ============
interface DownlineTabProps {
  downline: ProfileWithRole[];
  agentProfile: ProfileWithRole | null;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onBalanceAdjust: (id: string, amount: number, type: "credit" | "debit") => Promise<void>;
  onCreateUser: (data: { name: string; phone: string; role: string; share: number; commission: number; parentId?: string }) => Promise<void>;
}

function DownlineTab({ downline, agentProfile, onStatusChange, onBalanceAdjust, onCreateUser }: DownlineTabProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewUser, setViewUser] = useState<ProfileWithRole | null>(null);
  const [editUser, setEditUser] = useState<ProfileWithRole | null>(null);
  const [walletUser, setWalletUser] = useState<ProfileWithRole | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState<"credit" | "debit">("credit");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", phone: "", role: "user", share: 0, commission: 0 });
  const [editShare, setEditShare] = useState(0);
  const [editComm, setEditComm] = useState(0);
  const [processing, setProcessing] = useState(false);

  const roles = ["all", "super_stockist", "stockist", "master", "agent", "sub_agent", "user"];
  const allowedChildRoles = agentProfile ? CHILD_ROLES[agentProfile.role] || [] : [];

  const filtered = downline.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.display_id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleWalletSubmit = async () => {
    if (!walletUser || !walletAmount) return;
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" }); return; }
    setProcessing(true);
    await onBalanceAdjust(walletUser.id, amt, walletType);
    setProcessing(false);
    setWalletUser(null);
    setWalletAmount("");
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setProcessing(true);
    await supabase.from("profiles").update({ share: editShare, commission: editComm }).eq("id", editUser.id);
    toast({ title: "Updated", description: `${editUser.name} updated successfully` });
    setProcessing(false);
    setEditUser(null);
  };

  const handleCreateSubmit = async () => {
    if (!newUser.name || !newUser.phone) { toast({ title: "Error", description: "Name and phone required", variant: "destructive" }); return; }
    setProcessing(true);
    await onCreateUser({ ...newUser, parentId: agentProfile?.id });
    setProcessing(false);
    setShowCreate(false);
    setNewUser({ name: "", phone: "", role: "user", share: 0, commission: 0 });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search downline..."
            className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {roles.map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`rounded-md px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors ${
                roleFilter === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              {r === "all" ? "All" : ROLE_LABELS[r] || r}
            </button>
          ))}
        </div>
        {allowedChildRoles.length > 0 && (
          <Button size="sm" className="text-xs h-8 gap-1 ml-auto" onClick={() => setShowCreate(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add User
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
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
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{u.display_id}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{u.name}</td>
                  <td className="px-3 py-2 text-center"><RoleBadge role={ROLE_LABELS[u.role] || u.role} /></td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{u.share || 0}%</td>
                  <td className="px-3 py-2 text-right font-semibold text-[hsl(var(--highlight))]">{u.commission || 0}%</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">₹{(u.balance || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={u.status || "active"} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewUser(u)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setEditUser(u); setEditShare(u.share || 0); setEditComm(u.commission || 0); }} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setWalletUser(u); setWalletAmount(""); setWalletType("credit"); }} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-primary" title="Wallet"><Wallet className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => {
                        const newStatus = u.status === "blocked" ? "active" : "blocked";
                        await onStatusChange(u.id, newStatus);
                        toast({ title: newStatus === "blocked" ? "User Blocked" : "User Unblocked", description: `${u.name} is now ${newStatus}` });
                      }} className={`rounded p-1 hover:bg-secondary ${u.status === "blocked" ? "text-[hsl(var(--live))] hover:text-[hsl(var(--live))]" : "text-muted-foreground hover:text-destructive"}`} title={u.status === "blocked" ? "Unblock" : "Block"}>
                        {u.status === "blocked" ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground text-xs">No downline found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Modal */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{viewUser.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{viewUser.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{viewUser.display_id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Role", ROLE_LABELS[viewUser.role] || viewUser.role],
                  ["Phone", viewUser.phone || "—"],
                  ["Balance", `₹${(viewUser.balance || 0).toLocaleString()}`],
                  ["Share", `${viewUser.share || 0}%`],
                  ["Commission", `${viewUser.commission || 0}%`],
                  ["Status", viewUser.status || "active"],
                  ["KYC", viewUser.kyc || "pending"],
                  ["Joined", viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString() : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-md bg-secondary p-2">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">Edit {editUser?.name}</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Share %</label>
                <input type="number" min="0" max="100" value={editShare} onChange={(e) => setEditShare(Number(e.target.value))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Commission %</label>
                <input type="number" min="0" max="100" step="0.5" value={editComm} onChange={(e) => setEditComm(Number(e.target.value))}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs" onClick={handleEditSave} disabled={processing}>
                  {processing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Adjust Modal */}
      <Dialog open={!!walletUser} onOpenChange={() => setWalletUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">Wallet — {walletUser?.name}</DialogTitle></DialogHeader>
          {walletUser && (
            <div className="space-y-3 pt-2">
              <div className="rounded-md bg-secondary p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Balance</p>
                <p className="font-display text-2xl font-bold text-foreground">₹{(walletUser.balance || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                <div className="mt-1 flex gap-2">
                  {(["credit", "debit"] as const).map((t) => (
                    <button key={t} onClick={() => setWalletType(t)}
                      className={`flex-1 rounded-md py-2 text-xs font-bold uppercase transition-colors ${
                        walletType === t
                          ? t === "credit" ? "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))] border border-[hsl(var(--live)/.4)]"
                            : "bg-[hsl(var(--live-red)/.15)] text-[hsl(var(--live-red))] border border-[hsl(var(--live-red)/.4)]"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}>
                      {t === "credit" ? "↑ Credit" : "↓ Debit"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Amount (₹)</label>
                <input type="number" min="1" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Enter amount"
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setWalletUser(null)}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs" onClick={handleWalletSubmit} disabled={processing}>
                  {processing ? "Processing..." : `${walletType === "credit" ? "Credit" : "Debit"} ₹${walletAmount || "0"}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display text-base">Create New User</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Full Name *</label>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Enter name"
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Phone *</label>
              <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Enter phone"
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Role *</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary">
                {allowedChildRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Share %</label>
                <input type="number" min="0" max="100" value={newUser.share} onChange={(e) => setNewUser({ ...newUser, share: Number(e.target.value) })}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Commission %</label>
                <input type="number" min="0" max="100" step="0.5" value={newUser.commission} onChange={(e) => setNewUser({ ...newUser, commission: Number(e.target.value) })}
                  className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs" onClick={handleCreateSubmit} disabled={processing}>
                {processing ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ COMMISSION TAB ============
function CommissionTab({ agentProfileId }: { agentProfileId?: string }) {
  const { commissions, loading } = useCommissions(agentProfileId);
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = typeFilter === "all" ? commissions : commissions.filter((c) => c.type === typeFilter);
  const totalComm = filtered.reduce((s, c) => s + c.amount, 0);
  const totalTurnover = filtered.reduce((s, c) => s + c.turnover, 0);

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Commission</p>
          <p className="mt-1 font-display text-xl font-bold text-[hsl(var(--live))]">₹{totalComm.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Turnover</p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">₹{(totalTurnover / 100000).toFixed(1)}L</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg Comm Rate</p>
          <p className="mt-1 font-display text-xl font-bold text-[hsl(var(--highlight))]">
            {totalTurnover > 0 ? ((totalComm / totalTurnover) * 100).toFixed(2) : "0"}%
          </p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {["all", "match", "casino"].map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              typeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>{f}</button>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">From</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Match/Event</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Turnover</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Rate</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{c.fromName}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{c.match_event || "-"}</td>
                  <td className="px-3 py-2 text-right text-foreground">₹{c.turnover.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-[hsl(var(--highlight))]">{c.comm_rate}%</td>
                  <td className="px-3 py-2 text-right font-bold text-[hsl(var(--live))]">+₹{c.amount.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-xs">No commissions found</td></tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary/50">
                  <td colSpan={3} className="px-3 py-2 font-bold text-foreground text-sm">Total</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">₹{totalTurnover.toLocaleString()}</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-bold text-[hsl(var(--live))] text-sm">+₹{totalComm.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ HIERARCHY TAB ============
function HierarchyTab({ agentProfile, profiles }: { agentProfile: ProfileWithRole | null; profiles: ProfileWithRole[] }) {
  const tree = useMemo(() => {
    if (!agentProfile) return null;
    return buildTree(agentProfile.id, profiles);
  }, [agentProfile, profiles]);

  if (!tree) return <div className="text-center py-10 text-muted-foreground text-sm">No hierarchy data</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground mb-4">Agent Hierarchy Tree</h3>
        <TreeNode node={tree} level={0} />
      </div>
      <div className="flex flex-wrap gap-3 text-[10px]">
        {[
          { label: "Super Stockist", color: "bg-[hsl(var(--highlight))]" },
          { label: "Stockist", color: "bg-primary" },
          { label: "Master", color: "bg-[hsl(var(--back))]" },
          { label: "Agent", color: "bg-[hsl(var(--live))]" },
          { label: "Sub-Agent", color: "bg-muted-foreground" },
          { label: "User", color: "bg-border" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
            <span className="text-muted-foreground font-medium">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, level }: { node: HierarchyNode; level: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const roleLabel = ROLE_LABELS[node.role] || node.role;
  const roleColorMap: Record<string, string> = {
    "Super Stockist": "border-[hsl(var(--highlight))] bg-[hsl(var(--highlight)/.08)]",
    "Stockist": "border-primary bg-primary/5",
    "Master": "border-[hsl(var(--back))] bg-[hsl(var(--back)/.08)]",
    "Agent": "border-[hsl(var(--live))] bg-[hsl(var(--live)/.08)]",
    "Sub-Agent": "border-muted-foreground bg-muted/30",
    "User": "border-border bg-secondary/30",
  };

  return (
    <div className={`${level > 0 ? "ml-4 md:ml-6 border-l border-border pl-3 md:pl-4" : ""}`}>
      <div className={`flex items-center gap-2 rounded-lg border-l-4 px-3 py-2 mb-1.5 transition-colors cursor-pointer hover:bg-secondary/50 ${roleColorMap[roleLabel] || "border-border"}`}
        onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren && <span className="text-muted-foreground shrink-0">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</span>}
        {!hasChildren && <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{node.name}</span>
          <RoleBadge role={roleLabel} />
          {node.share > 0 && <span className="text-[10px] text-muted-foreground">Share: {node.share}%</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {node.status === "blocked" && <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">BLOCKED</span>}
          <span className="text-xs font-bold text-foreground">₹{(node.balance || 0).toLocaleString()}</span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} />)}
        </div>
      )}
    </div>
  );
}

// ============ REPORTS TAB ============
function ReportsTab({ agentProfile, downline, agentProfileId }: { agentProfile: ProfileWithRole | null; downline: ProfileWithRole[]; agentProfileId?: string }) {
  const { commissions } = useCommissions(agentProfileId);
  const totalComm = commissions.reduce((s, c) => s + c.amount, 0);
  const totalTurnover = commissions.reduce((s, c) => s + c.turnover, 0);
  const totalBalance = downline.reduce((s, d) => s + (d.balance || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total Turnover", value: `₹${(totalTurnover / 100000).toFixed(1)}L`, color: "text-foreground" },
          { label: "Total Commission", value: `₹${totalComm.toLocaleString()}`, color: "text-[hsl(var(--live))]" },
          { label: "Downline Balance", value: `₹${totalBalance.toLocaleString()}`, color: "text-foreground" },
          { label: "Total Downline", value: downline.length.toString(), color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-1 font-display text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Downline Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Agent</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Role</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Share%</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Balance</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {downline.filter((d) => d.role !== "user").map((u) => (
                <tr key={u.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{u.name}</td>
                  <td className="px-3 py-2 text-center"><RoleBadge role={ROLE_LABELS[u.role] || u.role} /></td>
                  <td className="px-3 py-2 text-right text-foreground">{u.share || 0}%</td>
                  <td className="px-3 py-2 text-right text-foreground">₹{(u.balance || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center"><StatusBadge status={u.status || "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ SETTLEMENT TAB ============
function SettlementTab({ agentProfileId, downline }: { agentProfileId?: string; downline: ProfileWithRole[] }) {
  const { settlements, loading, createSettlement } = useSettlements(agentProfileId);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSettlement, setNewSettlement] = useState({ agentId: "", amount: "", type: "credit" as "credit" | "debit", reason: "", note: "" });

  const handleCreateSettlement = async () => {
    if (!newSettlement.agentId || !newSettlement.amount || !newSettlement.reason || !agentProfileId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" }); return;
    }
    const amt = parseFloat(newSettlement.amount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" }); return; }
    await createSettlement({ profile_id: agentProfileId, agent_profile_id: newSettlement.agentId, type: newSettlement.type, amount: amt, reason: newSettlement.reason, note: newSettlement.note || undefined });
    const agent = downline.find((u) => u.id === newSettlement.agentId);
    toast({ title: "Settlement Created", description: `₹${amt.toLocaleString()} ${newSettlement.type} to ${agent?.name || "Agent"}` });
    setNewSettlement({ agentId: "", amount: "", type: "credit", reason: "", note: "" });
    setShowCreateModal(false);
  };

  const filtered = settlements.filter((s) => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch = s.agentName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalCredit = settlements.filter((s) => s.type === "credit" && s.status === "completed").reduce((sum, s) => sum + s.amount, 0);
  const totalDebit = settlements.filter((s) => s.type === "debit" && s.status === "completed").reduce((sum, s) => sum + s.amount, 0);
  const pendingAmount = settlements.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);
  const netSettlement = totalCredit - totalDebit;

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Received</span>
          <p className="font-display text-xl font-bold text-[hsl(var(--live))]">+₹{totalCredit.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Deducted</span>
          <p className="font-display text-xl font-bold text-[hsl(var(--live-red))]">-₹{totalDebit.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Net Settlement</span>
          <p className={`font-display text-xl font-bold ${netSettlement >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]"}`}>
            {netSettlement >= 0 ? "+" : ""}₹{netSettlement.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pending</span>
          <p className="font-display text-xl font-bold text-[hsl(var(--highlight))]">₹{pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search settlements..."
            className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1">
          {(["all", "completed", "pending", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>{f}</button>
          ))}
        </div>
        <Button size="sm" className="text-xs h-8 gap-1 ml-auto" onClick={() => setShowCreateModal(true)}>
          <Handshake className="h-3.5 w-3.5" /> New Settlement
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Agent</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Amount</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">Reason</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{s.agentName}</p>
                    <p className="text-[10px] text-muted-foreground">{s.agentDisplayId}</p>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      s.type === "credit" ? "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))]" : "bg-[hsl(var(--live-red)/.12)] text-[hsl(var(--live-red))]"
                    }`}>
                      {s.type === "credit" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {s.type}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${s.type === "credit" ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]"}`}>
                    {s.type === "credit" ? "+" : "-"}₹{s.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{s.reason}</td>
                  <td className="px-3 py-2 text-center"><SettlementStatusBadge status={s.status as any} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-xs">No settlements found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Settlement Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display text-base">New Settlement</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Agent *</label>
              <select value={newSettlement.agentId} onChange={(e) => setNewSettlement({ ...newSettlement, agentId: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary">
                <option value="">Select Agent</option>
                {downline.filter((d) => d.role !== "user").map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role] || u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type *</label>
              <div className="mt-1 flex gap-2">
                {(["credit", "debit"] as const).map((t) => (
                  <button key={t} onClick={() => setNewSettlement({ ...newSettlement, type: t })}
                    className={`flex-1 rounded-md py-2 text-xs font-bold uppercase transition-colors ${
                      newSettlement.type === t
                        ? t === "credit" ? "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))] border border-[hsl(var(--live)/.4)]"
                          : "bg-[hsl(var(--live-red)/.15)] text-[hsl(var(--live-red))] border border-[hsl(var(--live-red)/.4)]"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}>{t === "credit" ? "↑ Credit" : "↓ Debit"}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Amount (₹) *</label>
              <input type="number" min="1" value={newSettlement.amount} onChange={(e) => setNewSettlement({ ...newSettlement, amount: e.target.value })} placeholder="Enter amount"
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reason *</label>
              <select value={newSettlement.reason} onChange={(e) => setNewSettlement({ ...newSettlement, reason: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none focus:border-primary">
                <option value="">Select Reason</option>
                <option value="Weekly P&L Settlement">Weekly P&L Settlement</option>
                <option value="Commission Payout">Commission Payout</option>
                <option value="Loss Recovery">Loss Recovery</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Bonus">Bonus</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Note (Optional)</label>
              <textarea value={newSettlement.note} onChange={(e) => setNewSettlement({ ...newSettlement, note: e.target.value })} placeholder="Add a note..." rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs" onClick={handleCreateSettlement}>Create Settlement</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettlementStatusBadge({ status }: { status: "completed" | "pending" | "rejected" }) {
  const config = {
    completed: { icon: Check, style: "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))]" },
    pending: { icon: Clock, style: "bg-[hsl(var(--highlight)/.12)] text-[hsl(var(--highlight))]" },
    rejected: { icon: X, style: "bg-destructive/12 text-destructive" },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${c.style}`}>
      <Icon className="h-2.5 w-2.5" />{status}
    </span>
  );
}

// ============ SHARED COMPONENTS ============
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))]",
    blocked: "bg-destructive/12 text-destructive",
    pending: "bg-[hsl(var(--highlight)/.12)] text-[hsl(var(--highlight))]",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] || "bg-secondary text-muted-foreground"}`}>{status}</span>;
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    "Super Stockist": "bg-[hsl(var(--highlight)/.15)] text-[hsl(var(--highlight))]",
    "Stockist": "bg-primary/12 text-primary",
    "Master": "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))]",
    "Agent": "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))]",
    "Sub-Agent": "bg-secondary text-muted-foreground",
    "User": "bg-secondary text-muted-foreground",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[role] || "bg-secondary text-muted-foreground"}`}>{role}</span>;
}


// ============ AGENT WITHDRAWAL TAB ============
function AgentWithdrawalTab({ agentProfileId, agentBalance }: { agentProfileId?: string; agentBalance: number }) {
  type WMethod = "bank" | "upi" | "crypto";
  const [method, setMethod] = useState<WMethod>("bank");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC20");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    if (!agentProfileId) return;
    setLoading(true);
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("profile_id", agentProfileId)
      .order("created_at", { ascending: false });
    setWithdrawals(data || []);
    setLoading(false);
  }, [agentProfileId]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const buildBankInfo = (): string => {
    if (method === "bank") return `Bank: ${bankName} | A/C: ${accountNumber} | Name: ${accountName} | IFSC: ${ifsc}`;
    if (method === "upi") return `UPI: ${upiId}`;
    return `Crypto (${cryptoNetwork}): ${walletAddress}`;
  };

  const validate = (): string | null => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return "Enter a valid amount";
    if (amt > agentBalance) return "Insufficient balance";
    if (method === "bank") {
      if (!bankName.trim()) return "Enter bank name";
      if (!accountName.trim()) return "Enter account holder name";
      if (!accountNumber.trim() || accountNumber.trim().length < 8) return "Enter valid account number";
      if (!ifsc.trim() || ifsc.trim().length < 8) return "Enter valid IFSC code";
    }
    if (method === "upi" && (!upiId.trim() || !upiId.includes("@"))) return "Enter valid UPI ID";
    if (method === "crypto" && (!walletAddress.trim() || walletAddress.trim().length < 20)) return "Enter valid wallet address";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    if (!agentProfileId) return;
    setSubmitting(true);
    const { error } = await supabase.from("withdrawals").insert({
      profile_id: agentProfileId,
      amount: parseFloat(amount),
      method,
      bank_info: buildBankInfo(),
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: "Failed to submit withdrawal", variant: "destructive" });
    } else {
      toast({ title: "Withdrawal Submitted", description: `₹${parseFloat(amount).toLocaleString()} via ${method.toUpperCase()} — pending admin approval` });
      setAmount(""); setBankName(""); setAccountName(""); setAccountNumber(""); setIfsc(""); setUpiId(""); setWalletAddress("");
      fetchWithdrawals();
    }
    setSubmitting(false);
  };

  const statusBadge = (s: string) => {
    const cls = s === "approved" ? "bg-[hsl(var(--live))]/10 text-[hsl(var(--live))]"
      : s === "rejected" ? "bg-destructive/10 text-destructive"
      : "bg-[hsl(var(--highlight))]/10 text-[hsl(var(--highlight))]";
    return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${cls}`}>{s}</span>;
  };

  const methods: { id: WMethod; label: string; icon: typeof Building2 }[] = [
    { id: "bank", label: "Bank Transfer", icon: Building2 },
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "crypto", label: "Crypto", icon: Bitcoin },
  ];

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Available Balance</p>
          <p className="font-display text-2xl font-bold text-foreground">₹{agentBalance.toLocaleString()}</p>
        </div>
        <Wallet className="h-8 w-8 text-primary opacity-50" />
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        {/* Withdrawal Form */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">New Withdrawal</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Method Selector */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-semibold transition-colors ${
                      method === m.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <m.icon className="h-5 w-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="flex gap-1.5 mt-2">
                {[1000, 5000, 10000, 25000].map((v) => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    ₹{v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Fields */}
            {method === "bank" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. State Bank of India"
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary" maxLength={100} />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Account Holder Name</label>
                  <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Full name as on bank account"
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary" maxLength={100} />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Account Number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number"
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary" maxLength={30} />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">IFSC Code</label>
                  <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234"
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary" maxLength={15} />
                </div>
              </div>
            )}

            {/* UPI Fields */}
            {method === "upi" && (
              <div>
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. name@paytm"
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary" maxLength={80} />
              </div>
            )}

            {/* Crypto Fields */}
            {method === "crypto" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Network</label>
                  <div className="flex gap-1.5">
                    {["TRC20", "ERC20", "BEP20"].map((n) => (
                      <button key={n} onClick={() => setCryptoNetwork(n)}
                        className={`rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                          cryptoNetwork === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 block">Wallet Address</label>
                  <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Enter wallet address"
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs font-mono text-foreground outline-none focus:border-primary" maxLength={100} />
                </div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Withdrawal"}
            </Button>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Withdrawal History</h3>
            <button onClick={fetchWithdrawals} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {loading && <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</div>}
            {!loading && withdrawals.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">No withdrawals yet</div>
            )}
            {withdrawals.map((w) => (
              <div key={w.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">₹{(w.amount || 0).toLocaleString()}</span>
                  {statusBadge(w.status || "pending")}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="uppercase font-semibold">{w.method || "—"}</span>
                  <span>{w.created_at ? new Date(w.created_at).toLocaleDateString() : ""}</span>
                </div>
                {w.bank_info && (
                  <p className="text-[10px] text-muted-foreground truncate" title={w.bank_info}>{w.bank_info}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPanel;