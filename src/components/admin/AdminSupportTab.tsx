// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { useTranslation } from "react-i18next";
import {
  MessageCircle, Search, Filter, Send, ArrowLeft, Bot, Shield,
  User as UserIcon, Clock, CheckCircle, AlertCircle, Loader2,
  ChevronDown, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  ticket_id: string;
  profile_id: string;
  subject: string;
  status: string;
  priority: string;
  is_read_admin: boolean;
  created_at: string;
  updated_at: string;
  userName?: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "open", "pending", "replied", "closed"];
const PRIORITY_OPTIONS = ["normal", "high", "urgent"];

export function AdminSupportTab() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("support_tickets" as any).select("*").order("updated_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    
    if (data) {
      // Fetch profile names
      const profileIds = [...new Set((data as any[]).map(t => t.profile_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, display_id").in("id", profileIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      setTickets((data as any[]).map(t => ({
        ...t,
        userName: profileMap.get(t.profile_id)?.name || "Unknown",
      })));
    }
    setLoading(false);
  }, [statusFilter]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_messages" as any)
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at");
    if (data) setMessages(data as any[]);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);
    // Mark as read
    supabase.from("support_tickets" as any).update({ is_read_admin: true } as any).eq("id", activeTicket.id).then(() => {});

    const channel = supabase
      .channel(`admin-ticket-${activeTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${activeTicket.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, fetchMessages]);

  const handleReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    setReplying(true);
    
    await supabase.from("ticket_messages" as any).insert({
      ticket_id: activeTicket.id,
      sender_type: "admin",
      sender_name: "Admin",
      message: replyText.trim(),
    } as any);

    await supabase.from("support_tickets" as any).update({
      status: "replied",
      is_read_user: false,
      updated_at: new Date().toISOString(),
    } as any).eq("id", activeTicket.id);

    setReplyText("");
    setReplying(false);
    toast({ title: "Reply sent" });
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets" as any).update({ status, updated_at: new Date().toISOString() } as any).eq("id", ticketId);
    if (activeTicket?.id === ticketId) setActiveTicket(prev => prev ? { ...prev, status } : null);
    fetchTickets();
  };

  const handlePriorityChange = async (ticketId: string, priority: string) => {
    await supabase.from("support_tickets" as any).update({ priority } as any).eq("id", ticketId);
    if (activeTicket?.id === ticketId) setActiveTicket(prev => prev ? { ...prev, priority } : null);
    fetchTickets();
  };

  const filtered = tickets.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.subject.toLowerCase().includes(s) || t.ticket_id.toLowerCase().includes(s) || (t.userName || "").toLowerCase().includes(s);
  });

  const statusColor = (s: string) => {
    if (s === "open") return "text-blue-500 bg-blue-500/10";
    if (s === "replied") return "text-live bg-live/10";
    if (s === "pending") return "text-highlight bg-highlight/10";
    return "text-muted-foreground bg-muted/50";
  };

  // Conversation view
  if (activeTicket) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => { setActiveTicket(null); fetchTickets(); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{activeTicket.subject}</p>
            <p className="text-[10px] text-muted-foreground">{activeTicket.ticket_id} · {activeTicket.userName}</p>
          </div>
          <select
            value={activeTicket.priority}
            onChange={(e) => handlePriorityChange(activeTicket.id, e.target.value)}
            className="h-7 rounded border border-border bg-surface px-2 text-[10px] text-foreground outline-none"
          >
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select
            value={activeTicket.status}
            onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
            className="h-7 rounded border border-border bg-surface px-2 text-[10px] text-foreground outline-none"
          >
            {STATUS_OPTIONS.filter(s => s !== "all").map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Messages */}
        <div className="rounded-lg border border-border bg-card max-h-[500px] overflow-y-auto p-3 space-y-2">
          {messages.map((msg) => {
            const isUser = msg.sender_type === "user";
            const isAI = msg.sender_type === "ai";
            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  isUser ? "bg-surface border border-border" :
                  isAI ? "bg-accent/15 border border-accent/30" :
                  "bg-primary text-primary-foreground"
                }`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {isAI && <Bot className="h-3 w-3 text-accent" />}
                    {!isUser && !isAI && <Shield className="h-3 w-3 text-primary-foreground/70" />}
                    {isUser && <UserIcon className="h-3 w-3 text-muted-foreground" />}
                    <span className={`text-[9px] font-bold uppercase ${
                      isUser ? "text-muted-foreground" : isAI ? "text-accent" : "text-primary-foreground/70"
                    }`}>
                      {msg.sender_name} ({msg.sender_type})
                    </span>
                  </div>
                  <p className={`text-xs whitespace-pre-wrap ${isUser ? "text-foreground" : isAI ? "text-foreground" : "text-primary-foreground"}`}>
                    {msg.message}
                  </p>
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] underline mt-1 block opacity-70">📎 Attachment</a>
                  )}
                  <p className={`text-[9px] mt-1 ${isUser ? "text-muted-foreground" : isAI ? "text-muted-foreground" : "text-primary-foreground/50"}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply */}
        <div className="flex items-center gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type admin reply..."
            rows={2}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
          />
          <Button size="sm" onClick={handleReply} disabled={replying || !replyText.trim()} className="h-full px-4">
            {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Ticket list
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">No tickets found</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ticket</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground hidden md:table-cell">Subject</th>
                  <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Priority</th>
                  <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`cursor-pointer hover:bg-surface/50 transition-colors ${!ticket.is_read_admin ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {ticket.ticket_id}
                      {!ticket.is_read_admin && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{ticket.userName}</td>
                    <td className="px-3 py-2 text-foreground hidden md:table-cell truncate max-w-[200px]">{ticket.subject}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] font-bold uppercase ${ticket.priority === "urgent" ? "text-live-red" : ticket.priority === "high" ? "text-highlight" : "text-muted-foreground"}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}