// @ts-nocheck
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Clock, Eye, Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/loose";
import { toast } from "@/hooks/use-toast";

interface KycSubmission {
  id: string;
  profile_id: string;
  document_type: string;
  document_number: string;
  front_image_url: string | null;
  back_image_url: string | null;
  selfie_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  profileName?: string;
  profileDisplayId?: string;
}

export function AdminKycTab() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [viewSubmission, setViewSubmission] = useState<KycSubmission | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyc_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profile names
      const profileIds = [...new Set((data as any[]).map((d: any) => d.profile_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, display_id")
        .in("id", profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      
      setSubmissions((data as any[]).map((d: any) => ({
        ...d,
        profileName: profileMap.get(d.profile_id)?.name || "Unknown",
        profileDisplayId: profileMap.get(d.profile_id)?.display_id || "",
      })));
    }
    setLoading(false);
  };

  const handleAction = async (id: string, profileId: string, action: "verified" | "rejected") => {
    setProcessing(true);
    try {
      // Update submission
      await supabase
        .from("kyc_submissions" as any)
        .update({ 
          status: action, 
          admin_note: adminNote || null, 
          reviewed_at: new Date().toISOString() 
        } as any)
        .eq("id", id);

      // Update profile kyc status
      await supabase
        .from("profiles")
        .update({ kyc: action })
        .eq("id", profileId);

      toast({ title: action === "verified" ? "KYC Approved!" : "KYC Rejected", description: `User KYC has been ${action}` });
      setViewSubmission(null);
      setAdminNote("");
      fetchSubmissions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const filtered = submissions.filter((s) => {
    const matchesFilter = filter === "all" || s.status === filter;
    const matchesSearch = !search || 
      s.profileName?.toLowerCase().includes(search.toLowerCase()) || 
      s.profileDisplayId?.toLowerCase().includes(search.toLowerCase()) ||
      s.document_number?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    verified: submissions.filter(s => s.status === "verified").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading KYC submissions...</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "all" as const, label: "Total", count: counts.all, color: "text-foreground" },
          { id: "pending" as const, label: "Pending", count: counts.pending, color: "text-highlight" },
          { id: "verified" as const, label: "Verified", count: counts.verified, color: "text-live" },
          { id: "rejected" as const, label: "Rejected", count: counts.rejected, color: "text-live-red" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`rounded-lg border p-3 text-left transition-all ${
              filter === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`font-display text-xl font-bold mt-0.5 ${s.color}`}>{s.count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, doc number..."
          className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Document</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Doc Number</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No KYC submissions found</td></tr>
              )}
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{sub.profileName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{sub.profileDisplayId}</p>
                  </td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{sub.document_type.replace("_", " ")}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground hidden sm:table-cell">{sub.document_number}</td>
                  <td className="px-3 py-2 text-center">
                    <KycStatusBadge status={sub.status} />
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => { setViewSubmission(sub); setAdminNote(sub.admin_note || ""); }}
                      className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      title="Review"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!viewSubmission} onOpenChange={(o) => { if (!o) { setViewSubmission(null); setAdminNote(""); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              KYC Review — {viewSubmission?.profileName}
            </DialogTitle>
          </DialogHeader>
          {viewSubmission && (
            <div className="space-y-4 py-2">
              {/* User Info */}
              <div className="rounded-lg bg-surface p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">User ID</span>
                  <span className="text-xs font-mono font-medium">{viewSubmission.profileDisplayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Document Type</span>
                  <span className="text-xs font-medium capitalize">{viewSubmission.document_type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Document Number</span>
                  <span className="text-xs font-mono font-medium">{viewSubmission.document_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground">Submitted</span>
                  <span className="text-xs font-medium">{new Date(viewSubmission.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Document Images */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uploaded Documents</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Front", url: viewSubmission.front_image_url },
                    { label: "Back", url: viewSubmission.back_image_url },
                    { label: "Selfie", url: viewSubmission.selfie_url },
                  ].map((doc) => (
                    <div key={doc.label}>
                      {doc.url ? (
                        <button
                          onClick={() => setImagePreview(doc.url)}
                          className="w-full aspect-[4/3] rounded-lg border border-border bg-surface overflow-hidden hover:border-primary transition-colors"
                        >
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-full aspect-[4/3] rounded-lg border border-dashed border-border bg-surface flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">N/A</span>
                        </div>
                      )}
                      <p className="text-[10px] text-center text-muted-foreground mt-1">{doc.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Note */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Note (optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note (visible to user if rejected)"
                  className="w-full h-16 rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleAction(viewSubmission.id, viewSubmission.profile_id, "verified")}
                  disabled={processing}
                  className="flex-1 gap-1.5 bg-[hsl(var(--live))] hover:bg-[hsl(var(--live))]/90 text-white"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction(viewSubmission.id, viewSubmission.profile_id, "rejected")}
                  disabled={processing}
                  className="flex-1 gap-1.5"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(o) => { if (!o) setImagePreview(null); }}>
        <DialogContent className="max-w-2xl p-2">
          {imagePreview && (
            <img src={imagePreview} alt="Document preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KycStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: "bg-live/10 text-live",
    pending: "bg-highlight/10 text-highlight",
    rejected: "bg-live-red/10 text-live-red",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${styles[status] || "bg-surface text-muted-foreground"}`}>
      {status}
    </span>
  );
}