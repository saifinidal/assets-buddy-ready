// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import {
  Plus, Send, Paperclip, ArrowLeft, MessageCircle,
  Clock, CheckCircle, AlertCircle, Loader2, Bot, Shield, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

interface Ticket {
  id: string;
  ticket_id: string;
  subject: string;
  status: string;
  priority: string;
  is_read_user: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  open: { icon: AlertCircle, color: "text-blue-500 bg-blue-500/10", label: "Open" },
  pending: { icon: Clock, color: "text-highlight bg-highlight/10", label: "Pending" },
  replied: { icon: CheckCircle, color: "text-live bg-live/10", label: "Replied" },
  closed: { icon: CheckCircle, color: "text-muted-foreground bg-muted/50", label: "Closed" },
};

const Support = () => {
  const { t } = useTranslation();
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [creating, setCreating] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .eq("profile_id", currentUser.profileId)
      .order("updated_at", { ascending: false });
    if (data) setTickets(data as any[]);
    setLoadingTickets(false);
  }, [currentUser]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("support_categories" as any)
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setCategories(data as any[]);
  }, []);

  const fetchMessages = useCallback(async (ticketUuid: string) => {
    const { data } = await supabase
      .from("ticket_messages" as any)
      .select("*")
      .eq("ticket_id", ticketUuid)
      .order("created_at");
    if (data) setMessages(data as any[]);
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, [fetchTickets, fetchCategories]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);

    const channel = supabase
      .channel(`ticket-${activeTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${activeTicket.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateTicket = async () => {
    if (!currentUser || !formSubject.trim() || !formMessage.trim()) return;
    setSubmitting(true);

    const { data: ticket, error } = await supabase
      .from("support_tickets" as any)
      .insert({
        profile_id: currentUser.profileId,
        subject: formSubject.trim(),
        category_id: formCategory || null,
      } as any)
      .select()
      .single();

    if (error || !ticket) {
      toast({ title: t("common.error"), description: error?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    let attachmentUrl: string | null = null;
    if (file) {
      const path = `${currentUser.profileId}/${(ticket as any).id}/${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("ticket-attachments").upload(path, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }
    }

    await supabase.from("ticket_messages" as any).insert({
      ticket_id: (ticket as any).id,
      sender_type: "user",
      sender_name: currentUser.name,
      sender_profile_id: currentUser.profileId,
      message: formMessage.trim(),
      attachment_url: attachmentUrl,
    } as any);

    // Trigger AI auto-reply
    supabase.functions.invoke("ai-support-reply", {
      body: { ticket_id: (ticket as any).id, message: formMessage.trim(), subject: formSubject.trim() },
    }).catch(() => {});

    toast({ title: t("support.ticketCreated") });
    setFormSubject("");
    setFormCategory("");
    setFormMessage("");
    setFile(null);
    setCreating(false);
    setSubmitting(false);
    fetchTickets();
  };

  const handleSendMessage = async () => {
    if (!currentUser || !activeTicket || !newMessage.trim()) return;
    setSending(true);

    let attachmentUrl: string | null = null;
    if (file) {
      const path = `${currentUser.profileId}/${activeTicket.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("ticket-attachments").upload(path, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }
    }

    await supabase.from("ticket_messages" as any).insert({
      ticket_id: activeTicket.id,
      sender_type: "user",
      sender_name: currentUser.name,
      sender_profile_id: currentUser.profileId,
      message: newMessage.trim(),
      attachment_url: attachmentUrl,
    } as any);

    // Update ticket status
    await supabase.from("support_tickets" as any).update({ status: "open", updated_at: new Date().toISOString(), is_read_admin: false } as any).eq("id", activeTicket.id);

    // Trigger AI
    supabase.functions.invoke("ai-support-reply", {
      body: { ticket_id: activeTicket.id, message: newMessage.trim(), subject: activeTicket.subject },
    }).catch(() => {});

    setNewMessage("");
    setFile(null);
    setSending(false);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // Ticket conversation view
  if (activeTicket) {
    const statusConf = STATUS_CONFIG[activeTicket.status] || STATUS_CONFIG.open;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        {/* Header */}
        <div className="sticky top-12 z-20 border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <button onClick={() => { setActiveTicket(null); fetchTickets(); }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{activeTicket.subject}</p>
              <p className="text-[10px] text-muted-foreground">{activeTicket.ticket_id}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConf.color}`}>
              <statusConf.icon className="h-3 w-3" />
              {statusConf.label}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {messages.map((msg) => {
            const isUser = msg.sender_type === "user";
            const isAI = msg.sender_type === "ai";
            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  isUser ? "bg-primary text-primary-foreground" :
                  isAI ? "bg-accent/15 border border-accent/30" :
                  "bg-card border border-border"
                }`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {isAI && <Bot className="h-3 w-3 text-accent" />}
                    {!isUser && !isAI && <Shield className="h-3 w-3 text-primary" />}
                    <span className={`text-[9px] font-bold uppercase ${isUser ? "text-primary-foreground/70" : isAI ? "text-accent" : "text-primary"}`}>
                      {isAI ? t("support.aiReply") : isUser ? t("support.you") : t("support.adminReply")}
                    </span>
                  </div>
                  <p className={`text-xs whitespace-pre-wrap ${isUser ? "text-primary-foreground" : "text-foreground"}`}>{msg.message}</p>
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-[10px] underline mt-1 block opacity-70">📎 Attachment</a>
                  )}
                  <p className={`text-[9px] mt-1 ${isUser ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        {activeTicket.status !== "closed" && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-3 md:relative md:border-0 z-30">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf,.doc,.docx" />
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={t("support.typeMessage")}
                className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <Button size="sm" onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="h-9 px-3">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {file && <p className="text-[10px] text-muted-foreground mt-1">📎 {file.name}</p>}
          </div>
        )}
        <BottomNav />
      </div>
    );
  }

  // Ticket list / create form
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-lg font-bold text-foreground">{t("support.title")}</h1>
          <Button size="sm" onClick={() => setCreating(true)} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t("support.newTicket")}
          </Button>
        </div>

        {/* Create ticket form */}
        {creating && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3 animate-fade-in">
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">{t("support.selectCategory")}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder={t("support.subject")}
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              maxLength={200}
            />
            <textarea
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder={t("support.message")}
              rows={4}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
              maxLength={2000}
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                {file ? file.name : t("support.attachFile")}
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf,.doc,.docx" />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCreating(false); setFile(null); }} className="flex-1 text-xs">
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={handleCreateTicket} disabled={submitting || !formSubject.trim() || !formMessage.trim()} className="flex-1 text-xs">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("support.submit")}
              </Button>
            </div>
          </div>
        )}

        {/* Tickets list */}
        {loadingTickets ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t("support.noTickets")}</p>
            <p className="text-xs text-muted-foreground/70">{t("support.createFirst")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket)}
                  className="w-full rounded-xl border border-border bg-card p-3 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{ticket.subject}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ticket.ticket_id} · {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConf.color}`}>
                      <statusConf.icon className="h-3 w-3" />
                      {statusConf.label}
                    </span>
                  </div>
                  {!ticket.is_read_user && <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Support;