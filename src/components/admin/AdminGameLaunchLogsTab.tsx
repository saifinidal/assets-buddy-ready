import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LaunchLog {
  id: string;
  profile_id: string | null;
  game_uid: string;
  game_name: string | null;
  provider_name: string | null;
  request_url: string | null;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  launch_success: boolean;
  duration_ms: number | null;
  created_at: string;
  profile_name?: string;
}

export function AdminGameLaunchLogsTab() {
  const [logs, setLogs] = useState<LaunchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [selectedLog, setSelectedLog] = useState<LaunchLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("game_launch_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch profile names for logs that have profile_id
      const profileIds = [...new Set((data || []).map(l => l.profile_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, display_id")
          .in("id", profileIds as string[]);
        (profiles || []).forEach(p => {
          profileMap[p.id] = `${p.name} (${p.display_id})`;
        });
      }

      setLogs((data || []).map(l => ({
        ...l,
        profile_name: l.profile_id ? profileMap[l.profile_id] || l.profile_id : "—",
      })));
    } catch (e) {
      console.error("Failed to fetch launch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    if (filterStatus === "success" && !l.launch_success) return false;
    if (filterStatus === "failed" && l.launch_success) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.game_uid.toLowerCase().includes(s) ||
        (l.game_name || "").toLowerCase().includes(s) ||
        (l.provider_name || "").toLowerCase().includes(s) ||
        (l.error_message || "").toLowerCase().includes(s) ||
        (l.profile_name || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const failedCount = logs.filter(l => !l.launch_success).length;
  const successCount = logs.filter(l => l.launch_success).length;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Launches</p>
          <p className="font-display text-xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Successful</p>
          <p className="font-display text-xl font-bold text-live">{successCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Failed</p>
          <p className="font-display text-xl font-bold text-destructive">{failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search game, provider, error..."
            className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "success", "failed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                filterStatus === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold text-muted-foreground hover:text-foreground bg-surface hover:bg-muted"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Game UID</th>
                   <th className="px-3 py-2 text-left font-semibold text-muted-foreground">HTTP</th>
                   <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Duration</th>
                   <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Error</th>
                   <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Provider Response</th>
                   <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">No logs found</td></tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className={`hover:bg-surface ${!log.launch_success ? "bg-destructive/5" : ""}`}>
                      <td className="px-3 py-2">
                        {log.launch_success ? (
                          <CheckCircle className="h-4 w-4 text-live" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-3 py-2 text-foreground max-w-[120px] truncate">{log.profile_name}</td>
                      <td className="px-3 py-2 font-mono text-foreground max-w-[100px] truncate">{log.game_uid}</td>
                      <td className="px-3 py-2">
                        <span className={`font-mono font-bold ${
                          (log.response_status || 0) >= 400 ? "text-destructive" :
                          (log.response_status || 0) >= 200 ? "text-live" : "text-muted-foreground"
                        }`}>
                          {log.response_status || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{log.duration_ms ? `${log.duration_ms}ms` : "—"}</td>
                       <td className="px-3 py-2 text-destructive max-w-[200px] truncate">{log.error_message || "—"}</td>
                       <td className="px-3 py-2 max-w-[180px]">
                         {log.response_body ? (
                           <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded truncate block max-w-[180px]" title={log.response_body}>
                             {log.response_body.slice(0, 80)}{log.response_body.length > 80 ? "…" : ""}
                           </span>
                         ) : (
                           <span className="text-muted-foreground">—</span>
                         )}
                       </td>
                       <td className="px-3 py-2 text-center">
                         <button
                           onClick={() => setSelectedLog(log)}
                           className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                         >
                           <Eye className="h-3.5 w-3.5" />
                         </button>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {selectedLog?.launch_success ? (
                <CheckCircle className="h-4 w-4 text-live" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              Game Launch Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <InfoField label="Status" value={selectedLog.launch_success ? "✅ Success" : "❌ Failed"} />
                <InfoField label="HTTP Status" value={String(selectedLog.response_status || "N/A")} />
                <InfoField label="Game UID" value={selectedLog.game_uid} />
                <InfoField label="Game Name" value={selectedLog.game_name || "—"} />
                <InfoField label="Provider" value={selectedLog.provider_name || "—"} />
                <InfoField label="Duration" value={selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : "—"} />
                <InfoField label="User" value={selectedLog.profile_name || "—"} />
                <InfoField label="Time" value={new Date(selectedLog.created_at).toLocaleString()} />
              </div>

              {selectedLog.error_message && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-destructive mb-1">Error Message</p>
                  <pre className="rounded bg-destructive/10 border border-destructive/20 p-2 text-[11px] text-destructive whitespace-pre-wrap break-all font-mono">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {selectedLog.request_url && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Request URL</p>
                  <pre className="rounded bg-surface border border-border p-2 text-[11px] text-foreground whitespace-pre-wrap break-all font-mono">
                    {selectedLog.request_url}
                  </pre>
                </div>
              )}

              {selectedLog.response_body && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Response Body</p>
                  <pre className="rounded bg-surface border border-border p-2 text-[11px] text-foreground whitespace-pre-wrap break-all font-mono max-h-48 overflow-y-auto">
                    {tryFormatJson(selectedLog.response_body)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface border border-border p-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground break-all">{value}</p>
    </div>
  );
}

function tryFormatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
