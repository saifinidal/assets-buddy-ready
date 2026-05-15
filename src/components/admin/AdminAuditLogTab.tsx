import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { Loader2, Search, RefreshCw, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLogRow } from "@/hooks/useAuditLog";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  super_stockist: "bg-[hsl(var(--highlight)/.15)] text-[hsl(var(--highlight))]",
  stockist: "bg-primary/12 text-primary",
  master: "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))]",
  agent: "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))]",
  sub_agent: "bg-secondary text-muted-foreground",
};

const ACTION_COLORS: Record<string, string> = {
  settle: "text-[hsl(var(--live))]",
  void: "text-live-red",
  cancel: "text-live-red",
  delete: "text-live-red",
  block: "text-live-red",
  update: "text-primary",
  create: "text-[hsl(var(--back))]",
  approve: "text-[hsl(var(--live))]",
  reject: "text-live-red",
  role_change: "text-[hsl(var(--highlight))]",
  password_reset: "text-[hsl(var(--highlight))]",
  login: "text-muted-foreground",
};

function actionTone(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "text-foreground";
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "2-digit", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function AdminAuditLogTab() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as AuditLogRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actions = useMemo(() => {
    const set = new Set(rows.map((r) => r.action));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (!q) return true;
      return (
        r.summary.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        (r.actor_name || "").toLowerCase().includes(q) ||
        (r.target_id || "").toLowerCase().includes(q) ||
        (r.target_type || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, actionFilter]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Audit Log</h3>
          <span className="text-[11px] text-muted-foreground">({filtered.length} of {rows.length})</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search action, actor, target…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-md border border-border bg-surface pl-7 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary"
          >
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8 gap-1.5 text-xs">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No audit log entries yet. Admin actions will appear here.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => {
              const isOpen = expanded.has(r.id);
              const hasMeta = r.metadata && Object.keys(r.metadata).length > 0;
              return (
                <div key={r.id} className="text-xs">
                  <button
                    onClick={() => hasMeta && toggle(r.id)}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-surface/50 transition-colors ${hasMeta ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {hasMeta ? (isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />) : <span className="inline-block w-3" />}
                    </div>
                    <div className="shrink-0 w-32 text-[10px] font-mono text-muted-foreground">{formatTime(r.created_at)}</div>
                    <div className="shrink-0 w-24">
                      <span className={`font-bold ${actionTone(r.action)}`}>{r.action}</span>
                    </div>
                    <div className="shrink-0">
                      {r.actor_role && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${ROLE_COLORS[r.actor_role] || "bg-secondary text-muted-foreground"}`}>
                          {r.actor_role}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 w-32 truncate font-medium text-foreground">{r.actor_name || "—"}</div>
                    <div className="flex-1 min-w-0 text-foreground/90 truncate">{r.summary}</div>
                    {r.target_type && (
                      <div className="shrink-0 text-[10px] text-muted-foreground">
                        {r.target_type}{r.target_id ? `:${r.target_id.slice(0, 8)}` : ""}
                      </div>
                    )}
                  </button>
                  {hasMeta && isOpen && (
                    <div className="px-3 pb-3 pl-[180px]">
                      <pre className="rounded bg-surface border border-border p-2 text-[10px] overflow-x-auto text-foreground/80">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
