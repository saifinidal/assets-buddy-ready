import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Ban, Plus, RefreshCw } from "lucide-react";

interface LiveMatch {
  id: string;
  sport: string;
  sport_icon: string;
  league: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  status: string;
  team1_back: number;
  team1_lay: number;
  team2_back: number;
  team2_lay: number;
  draw_back: number | null;
  draw_lay: number | null;
  is_live: boolean;
  match_time: string;
  has_tv: boolean;
  has_bm: boolean;
  has_fancy: boolean;
  is_suspended: boolean;
  sort_order: number;
}

const sportOptions = [
  { value: "cricket", icon: "🏏", label: "Cricket" },
  { value: "football", icon: "⚽", label: "Football" },
  { value: "tennis", icon: "🎾", label: "Tennis" },
  { value: "kabaddi", icon: "🤼", label: "Kabaddi" },
  { value: "basketball", icon: "🏀", label: "Basketball" },
];

const emptyMatch: Omit<LiveMatch, "id"> = {
  sport: "cricket",
  sport_icon: "🏏",
  league: "",
  team1: "",
  team2: "",
  score1: "—",
  score2: "—",
  status: "",
  team1_back: 1.50,
  team1_lay: 1.52,
  team2_back: 2.50,
  team2_lay: 2.52,
  draw_back: null,
  draw_lay: null,
  is_live: false,
  match_time: "",
  has_tv: false,
  has_bm: false,
  has_fancy: false,
  is_suspended: false,
  sort_order: 0,
};

export function AdminMatchesTab() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Partial<LiveMatch> & Omit<LiveMatch, "id"> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("live_matches")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMatches((data || []) as unknown as LiveMatch[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const filtered = filter === "all" ? matches
    : filter === "live" ? matches.filter(m => m.is_live && !m.is_suspended)
    : filter === "upcoming" ? matches.filter(m => !m.is_live)
    : matches.filter(m => m.is_suspended);

  const openAdd = () => {
    setEditMatch({ ...emptyMatch });
    setDialogOpen(true);
  };

  const openEdit = (m: LiveMatch) => {
    setEditMatch({ ...m });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editMatch) return;
    if (!editMatch.league || !editMatch.team1 || !editMatch.team2) {
      toast({ title: "Error", description: "League, Team1, Team2 required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sportOpt = sportOptions.find(s => s.value === editMatch.sport);
    const payload = {
      sport: editMatch.sport,
      sport_icon: sportOpt?.icon || "🏏",
      league: editMatch.league,
      team1: editMatch.team1,
      team2: editMatch.team2,
      score1: editMatch.score1 || "—",
      score2: editMatch.score2 || "—",
      status: editMatch.status || "",
      team1_back: editMatch.team1_back,
      team1_lay: editMatch.team1_lay,
      team2_back: editMatch.team2_back,
      team2_lay: editMatch.team2_lay,
      draw_back: editMatch.draw_back,
      draw_lay: editMatch.draw_lay,
      is_live: editMatch.is_live,
      match_time: editMatch.match_time || "",
      has_tv: editMatch.has_tv,
      has_bm: editMatch.has_bm,
      has_fancy: editMatch.has_fancy,
      is_suspended: editMatch.is_suspended,
      sort_order: editMatch.sort_order || 0,
    };

    let error;
    if ("id" in editMatch && editMatch.id) {
      ({ error } = await supabase.from("live_matches").update(payload).eq("id", editMatch.id));
    } else {
      ({ error } = await supabase.from("live_matches").insert(payload));
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "id" in editMatch && editMatch.id ? "Match updated" : "Match added" });
      setDialogOpen(false);
      fetchMatches();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    const { error } = await supabase.from("live_matches").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Match deleted" });
      fetchMatches();
    }
  };

  const toggleSuspend = async (m: LiveMatch) => {
    const { error } = await supabase.from("live_matches").update({ is_suspended: !m.is_suspended }).eq("id", m.id);
    if (!error) { fetchMatches(); }
  };

  const updateField = (key: string, val: unknown) => {
    if (!editMatch) return;
    setEditMatch({ ...editMatch, [key]: val });
  };

  const inputCls = "w-full h-8 rounded-md bg-input px-2 text-xs text-foreground border border-border focus:border-primary outline-none";
  const labelCls = "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 block";
  const checkCls = "h-4 w-4 rounded border-border accent-primary";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {["all", "live", "upcoming", "suspended"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={fetchMatches}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="text-xs h-8" onClick={openAdd}>
            <Plus className="h-3 w-3 mr-1" /> Add Match
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Match</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden sm:table-cell">Sport</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Odds (B/L)</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No matches found</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className={`hover:bg-surface/50 transition-colors ${m.is_suspended ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{m.sport_icon} {m.team1} vs {m.team2}</p>
                    <p className="text-[10px] text-muted-foreground">{m.league} {m.match_time && `• ${m.match_time}`}</p>
                    {m.is_live && m.score1 !== "—" && (
                      <p className="text-[10px] text-highlight">{m.score1} — {m.score2}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell capitalize">{m.sport}</td>
                  <td className="px-3 py-2 text-center">
                    {m.is_suspended ? (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-live-red/10 text-live-red">Suspended</span>
                    ) : m.is_live ? (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-live-red/10 text-live-red">
                        <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />Live
                      </span>
                    ) : (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-highlight/10 text-highlight">Upcoming</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-back font-bold">{m.team1_back.toFixed(2)}</span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-lay font-bold">{m.team1_lay.toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(m)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleSuspend(m)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-highlight" title={m.is_suspended ? "Resume" : "Suspend"}>
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-live-red" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editMatch && "id" in editMatch && editMatch.id ? "Edit Match" : "Add Match"}
            </DialogTitle>
          </DialogHeader>
          {editMatch && (
            <div className="space-y-3">
              {/* Sport & League */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Sport</label>
                  <select value={editMatch.sport} onChange={e => { updateField("sport", e.target.value); updateField("sport_icon", sportOptions.find(s => s.value === e.target.value)?.icon || "🏏"); }} className={inputCls}>
                    {sportOptions.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>League</label>
                  <input value={editMatch.league} onChange={e => updateField("league", e.target.value)} className={inputCls} placeholder="IPL 2026" />
                </div>
              </div>

              {/* Teams */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Team 1</label><input value={editMatch.team1} onChange={e => updateField("team1", e.target.value)} className={inputCls} placeholder="India" /></div>
                <div><label className={labelCls}>Team 2</label><input value={editMatch.team2} onChange={e => updateField("team2", e.target.value)} className={inputCls} placeholder="Australia" /></div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Score 1</label><input value={editMatch.score1} onChange={e => updateField("score1", e.target.value)} className={inputCls} placeholder="185/4 (18.2)" /></div>
                <div><label className={labelCls}>Score 2</label><input value={editMatch.score2} onChange={e => updateField("score2", e.target.value)} className={inputCls} placeholder="142/3 (16.0)" /></div>
              </div>

              {/* Status & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Match Status Text</label><input value={editMatch.status} onChange={e => updateField("status", e.target.value)} className={inputCls} placeholder="India need 44 from 10" /></div>
                <div><label className={labelCls}>Match Time</label><input value={editMatch.match_time} onChange={e => updateField("match_time", e.target.value)} className={inputCls} placeholder="Today 7:30 PM" /></div>
              </div>

              {/* Team 1 Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Team1 Back</label><input type="number" step="0.01" value={editMatch.team1_back} onChange={e => updateField("team1_back", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
                <div><label className={labelCls}>Team1 Lay</label><input type="number" step="0.01" value={editMatch.team1_lay} onChange={e => updateField("team1_lay", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              </div>

              {/* Team 2 Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Team2 Back</label><input type="number" step="0.01" value={editMatch.team2_back} onChange={e => updateField("team2_back", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
                <div><label className={labelCls}>Team2 Lay</label><input type="number" step="0.01" value={editMatch.team2_lay} onChange={e => updateField("team2_lay", parseFloat(e.target.value) || 0)} className={inputCls} /></div>
              </div>

              {/* Draw Odds */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Draw Back (optional)</label><input type="number" step="0.01" value={editMatch.draw_back ?? ""} onChange={e => updateField("draw_back", e.target.value ? parseFloat(e.target.value) : null)} className={inputCls} /></div>
                <div><label className={labelCls}>Draw Lay (optional)</label><input type="number" step="0.01" value={editMatch.draw_lay ?? ""} onChange={e => updateField("draw_lay", e.target.value ? parseFloat(e.target.value) : null)} className={inputCls} /></div>
              </div>

              {/* Sort Order */}
              <div className="w-1/2">
                <label className={labelCls}>Sort Order</label>
                <input type="number" value={editMatch.sort_order} onChange={e => updateField("sort_order", parseInt(e.target.value) || 0)} className={inputCls} />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "is_live", label: "Live" },
                  { key: "has_tv", label: "TV" },
                  { key: "has_bm", label: "BM" },
                  { key: "has_fancy", label: "Fancy" },
                  { key: "is_suspended", label: "Suspended" },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                    <input type="checkbox" checked={!!(editMatch as Record<string, unknown>)[t.key]} onChange={e => updateField(t.key, e.target.checked)} className={checkCls} />
                    {t.label}
                  </label>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "id" in editMatch && editMatch.id ? "Update Match" : "Add Match"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
