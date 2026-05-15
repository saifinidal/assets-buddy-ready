import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, X, Clock } from "lucide-react";

export interface AdminNotification {
  id: string;
  type: "deposit" | "withdrawal" | "high_bet";
  title: string;
  message: string;
  amount: number;
  time: string;
  read: boolean;
}

const initialNotifications: AdminNotification[] = [
  { id: "n1", type: "deposit", title: "New Deposit", message: "Rahul Sharma deposited ₹5,000 via UPI", amount: 5000, time: "Just now", read: false },
  { id: "n2", type: "high_bet", title: "High-Value Bet", message: "Karan Mehta placed ₹50,000 on IND vs AUS", amount: 50000, time: "2 min ago", read: false },
  { id: "n3", type: "withdrawal", title: "Withdrawal Request", message: "Priya Patel requested ₹15,000 withdrawal", amount: 15000, time: "5 min ago", read: false },
  { id: "n4", type: "deposit", title: "New Deposit", message: "Amit Kumar deposited ₹10,000 via Bank Transfer", amount: 10000, time: "8 min ago", read: false },
  { id: "n5", type: "high_bet", title: "High-Value Bet", message: "Sneha Reddy placed ₹25,000 on CSK vs MI", amount: 25000, time: "12 min ago", read: false },
];

const liveNotifications: Omit<AdminNotification, "id" | "time" | "read">[] = [
  { type: "deposit", title: "New Deposit", message: "Vikram Singh deposited ₹8,000 via UPI", amount: 8000 },
  { type: "high_bet", title: "High-Value Bet", message: "Rahul Sharma placed ₹30,000 on Man Utd vs Liverpool", amount: 30000 },
  { type: "withdrawal", title: "Withdrawal Request", message: "Karan Mehta requested ₹20,000 withdrawal", amount: 20000 },
  { type: "deposit", title: "New Deposit", message: "Sneha Reddy deposited ₹12,000 via Bank Transfer", amount: 12000 },
  { type: "high_bet", title: "High-Value Bet", message: "Amit Kumar placed ₹40,000 on Alcaraz vs Sinner", amount: 40000 },
  { type: "withdrawal", title: "Withdrawal Request", message: "Priya Patel requested ₹7,000 withdrawal", amount: 7000 },
];

const typeConfig = {
  deposit: { icon: ArrowDownCircle, color: "text-live", bg: "bg-live/10", label: "Deposit" },
  withdrawal: { icon: ArrowUpCircle, color: "text-live-red", bg: "bg-live-red/10", label: "Withdrawal" },
  high_bet: { icon: TrendingUp, color: "text-highlight", bg: "bg-highlight/10", label: "High Bet" },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
  soundEnabled?: boolean;
}

export function NotificationPanel({ open, onClose, onCountChange, soundEnabled = true }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal" | "high_bet">("all");
  const liveIndex = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Play alert beep for high-value bets
  const playAlertSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      // Two-tone alert: high urgency
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio not supported, silently ignore
    }
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const template = liveNotifications[liveIndex.current % liveNotifications.length];
      const newNotif: AdminNotification = {
        ...template,
        id: `live-${Date.now()}`,
        time: "Just now",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
      // Play sound for high-value bets
      if (template.type === "high_bet" && soundEnabled) {
        playAlertSound();
      }
      liveIndex.current++;
    }, 15000);

    return () => clearInterval(interval);
  }, [playAlertSound, soundEnabled]);

  // Update unread count
  useEffect(() => {
    onCountChange(notifications.filter((n) => !n.read).length);
  }, [notifications, onCountChange]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "deposit", label: "Deposits" },
    { key: "withdrawal", label: "Withdrawals" },
    { key: "high_bet", label: "High Bets" },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 w-80 md:w-96 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="text-[10px] font-semibold text-primary hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="text-[10px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-border">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-6 w-6 mb-2" />
            <p className="text-xs">No notifications</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <button
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface/50 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-foreground">{notif.title}</span>
                    {!notif.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-bold ${config.color}`}>
                      ₹{notif.amount.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{notif.time}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="border-t border-border px-3 py-2 text-center">
          <span className="text-[10px] text-muted-foreground">
            Showing {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
