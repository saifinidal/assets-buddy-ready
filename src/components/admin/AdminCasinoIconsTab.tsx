import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trash2, Upload, Plus, Loader2, Image as ImageIcon,
  RefreshCw, Pencil, Check, Crown, Tv, Sparkles, Rocket,
  Fish, Joystick, Clock, Save, ArrowUp, ArrowDown,
  PackageOpen, AlertTriangle, FileImage, X, FolderUp,
  CheckCircle2, XCircle, ArrowUpDown, CalendarClock, ListOrdered,
  GripVertical,
} from "lucide-react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { normalizeProviderKey, normalizeFuzzy } from "@/lib/normalizeProvider";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- constants ---

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type CasinoIcon = {
  id: string;
  icon_type: string;
  icon_key: string;
  label: string;
  image_url: string;
  keywords: string[] | null;
  sort_order: number;
  updated_at: string;
};

type FallbackSortMode = "sort_order" | "updated_at";

const CATEGORY_PRESETS = [
  { key: "all", label: "All Games", icon: Crown },
  { key: "live", label: "Live Casino", icon: Tv },
  { key: "slots", label: "Slots", icon: Sparkles },
  { key: "crash", label: "Crash", icon: Rocket },
  { key: "fishing", label: "Fishing", icon: Fish },
  { key: "arcade", label: "Arcade", icon: Joystick },
  { key: "history", label: "History", icon: Clock },
];

const PROVIDER_PRESETS = [
  "Spribe", "JILIGaming", "JDBGaming", "MAC88", "CQ9", "PGSoft",
  "Evolution Live", "Ezugi", "SaGaming", "Sexy", "DreamGaming",
  "PragmaticPlay-Asia", "PragmaticPlayLive-Asia", "Habanero",
  "FaChaiGaming", "Rich88", "Bgaming", "Smartsoft",
];

// Build a lookup for auto-matching filenames
const ALL_TARGETS: { value: string; label: string; type: "category" | "provider" }[] = [
  ...CATEGORY_PRESETS.map(c => ({ value: `category::${c.key}`, label: `📂 ${c.label}`, type: "category" as const })),
  ...PROVIDER_PRESETS.map(p => {
    const key = normalizeProviderKey(p);
    return { value: `provider::${key}`, label: `🏢 ${p}`, type: "provider" as const };
  }),
];

function filenameToTarget(filename: string): string | null {
  const stem = normalizeFuzzy(filename.replace(/\.[^.]+$/, ""));
  for (const t of ALL_TARGETS) {
    const tKey = normalizeFuzzy(t.value.split("::")[1]);
    if (stem === tKey || stem.includes(tKey) || tKey.includes(stem)) return t.value;
  }
  // Try matching provider display names
  for (const p of PROVIDER_PRESETS) {
    const pNorm = normalizeFuzzy(p);
    const key = normalizeProviderKey(p);
    if (stem === pNorm || stem.includes(pNorm) || pNorm.includes(stem)) return `provider::${key}`;
  }
  return null;
}

// --- tiny helpers ---

function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl border border-dashed border-border bg-muted/20">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-primary/60" />
      </div>
      <p className="text-sm font-semibold text-foreground/80">{title}</p>
      <p className="text-xs text-muted-foreground mt-1.5 text-center max-w-sm leading-relaxed">{description}</p>
      {ctaLabel && onCta && (
        <Button size="sm" className="mt-4" onClick={onCta}>
          <Upload className="h-3.5 w-3.5 mr-1.5" /> {ctaLabel}
        </Button>
      )}
    </div>
  );
}

function CardSkeleton({ aspect = "4/3" }: { aspect?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
      <Skeleton className={`w-full rounded-lg aspect-[${aspect}]`} />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

function ProviderSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-2 space-y-1.5">
      <Skeleton className="h-3.5 w-16 mx-auto" />
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-6 w-full rounded-md" />
    </div>
  );
}
// --- Sortable wrapper ---

function SortableItem({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className={className}>
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 z-20 h-6 w-6 rounded-md bg-card/80 border border-border flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors backdrop-blur-sm"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}



type ValidationResult = { valid: true } | { valid: false; error: string };

function validateFile(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported type "${file.type.split("/")[1] || file.type}". Use PNG, JPG, WebP, GIF, or SVG.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File is ${formatBytes(file.size)} — max ${formatBytes(MAX_FILE_SIZE)}.` };
  }
  return { valid: true };
}

// --- Upload Preview Dialog (single file) ---

type PendingUpload = {
  file: File;
  previewUrl: string;
  label: string;
  onConfirm: (file: File) => void;
  error?: string;
};

function UploadPreviewDialog({ pending, onClose }: { pending: PendingUpload | null; onClose: () => void }) {
  if (!pending) return null;
  const hasError = !!pending.error;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <FileImage className="h-5 w-5 text-primary" />}
            {hasError ? "Invalid File" : `Upload — ${pending.label}`}
          </DialogTitle>
          <DialogDescription>
            {hasError ? pending.error : "Review the image below, then confirm to upload."}
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-full max-w-[280px] aspect-square rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
          {hasError ? (
            <div className="flex flex-col items-center gap-2 text-destructive/60">
              <AlertTriangle className="h-10 w-10" />
              <span className="text-xs text-center px-4">{pending.error}</span>
            </div>
          ) : (
            <img src={pending.previewUrl} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="truncate max-w-[200px]">{pending.file.name}</span>
          <span className="shrink-0">{formatBytes(pending.file.size)}</span>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          {!hasError && (
            <Button onClick={() => { pending.onConfirm(pending.file); onClose(); }}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Bulk Upload Dialog ---

type BulkItem = {
  id: string;
  file: File;
  previewUrl: string;
  target: string; // "category::key" or "provider::key" or ""
  validation: ValidationResult;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
};

function BulkUploadDialog({
  open,
  onClose,
  onUploadAll,
}: {
  open: boolean;
  onClose: () => void;
  onUploadAll: (items: { file: File; type: "category" | "provider"; key: string; label: string }[]) => Promise<void>;
}) {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ total: number; success: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: BulkItem[] = Array.from(files).map((file) => {
      const validation = validateFile(file);
      const previewUrl = validation.valid ? URL.createObjectURL(file) : "";
      const autoTarget = filenameToTarget(file.name);
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        target: autoTarget || "",
        validation,
        status: "pending" as const,
      };
    });
    setItems(prev => [...prev, ...newItems]);
    setResults(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const updateTarget = useCallback((id: string, target: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, target } : i));
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validItems = items.filter(i => i.validation.valid && i.target);
  const invalidCount = items.filter(i => !i.validation.valid).length;
  const unmappedCount = items.filter(i => i.validation.valid && !i.target).length;

  const handleUpload = async () => {
    if (validItems.length === 0) return;
    setUploading(true);
    setProgress(0);
    setResults(null);

    const toUpload = validItems.map(item => {
      const [type, key] = item.target.split("::");
      const matchedTarget = ALL_TARGETS.find(t => t.value === item.target);
      return {
        file: item.file,
        type: type as "category" | "provider",
        key,
        label: matchedTarget?.label.replace(/^[📂🏢]\s*/, "") || key,
        itemId: item.id,
      };
    });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const entry = toUpload[i];
      setItems(prev => prev.map(it => it.id === entry.itemId ? { ...it, status: "uploading" } : it));
      try {
        await onUploadAll([{ file: entry.file, type: entry.type, key: entry.key, label: entry.label }]);
        setItems(prev => prev.map(it => it.id === entry.itemId ? { ...it, status: "done" } : it));
        success++;
      } catch (err: any) {
        setItems(prev => prev.map(it => it.id === entry.itemId ? { ...it, status: "error", errorMsg: err?.message || "Failed" } : it));
        failed++;
      }
      setProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    setResults({ total: toUpload.length, success, failed });
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    items.forEach(i => { if (i.previewUrl) URL.revokeObjectURL(i.previewUrl); });
    setItems([]);
    setResults(null);
    setProgress(0);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="h-5 w-5 text-primary" /> Bulk Upload Icons
          </DialogTitle>
          <DialogDescription>
            Select multiple images at once. Files are auto-matched to categories/providers by filename. Reassign any unmatched files manually.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone / file picker */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/10 hover:border-primary/40"}`}
          onClick={() => inputRef.current?.click()}
        >
          <FolderUp className={`h-8 w-8 mx-auto mb-2 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
          <p className="text-sm font-medium text-foreground/70">
            {dragOver ? "Drop files here" : "Click or drag images here"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            PNG, JPG, WebP, GIF, SVG — max 2 MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{items.length} files</Badge>
              {validItems.length > 0 && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  {validItems.length} ready
                </Badge>
              )}
              {unmappedCount > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                  {unmappedCount} unmapped
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} invalid</Badge>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[340px] rounded-lg border border-border">
              <div className="divide-y divide-border">
                {items.map(item => {
                  const isValid = item.validation.valid;
                  const validationErr = !isValid ? (item.validation as { valid: false; error: string }).error : null;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 p-2.5 ${!isValid ? "bg-destructive/5" : item.status === "done" ? "bg-green-500/5" : ""}`}>
                      {/* Thumbnail */}
                      <div className="h-12 w-12 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                        {isValid && item.previewUrl ? (
                          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive/50" />
                        )}
                      </div>

                      {/* Info + mapping */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground truncate max-w-[160px]">{item.file.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(item.file.size)}</span>
                        </div>

                        {validationErr ? (
                          <p className="text-[10px] text-destructive">{validationErr}</p>
                        ) : (
                          <Select
                            value={item.target}
                            onValueChange={(v) => updateTarget(item.id, v)}
                            disabled={uploading || item.status === "done"}
                          >
                            <SelectTrigger className="h-7 text-[11px] w-full max-w-[240px]">
                              <SelectValue placeholder="Select target…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none" disabled className="text-muted-foreground text-[11px]">— Categories —</SelectItem>
                              {ALL_TARGETS.filter(t => t.type === "category").map(t => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                              ))}
                              <SelectItem value="__none2" disabled className="text-muted-foreground text-[11px]">— Providers —</SelectItem>
                              {ALL_TARGETS.filter(t => t.type === "provider").map(t => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Status / actions */}
                      <div className="shrink-0 flex items-center gap-1">
                        {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {item.status === "error" && (
                          <span title={item.errorMsg}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </span>
                        )}
                        {!uploading && item.status !== "done" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(item.id)}>
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Progress bar during upload */}
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-[11px] text-muted-foreground text-center">{progress}% complete</p>
              </div>
            )}

            {/* Results summary */}
            {results && (
              <div className={`rounded-lg p-3 text-sm ${results.failed > 0 ? "bg-amber-500/10 text-amber-700" : "bg-green-500/10 text-green-700"}`}>
                <p className="font-medium">
                  {results.failed === 0
                    ? `✅ All ${results.success} icon(s) uploaded successfully!`
                    : `⚠️ ${results.success} succeeded, ${results.failed} failed`}
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleUpload} disabled={uploading || validItems.length === 0}>
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1" /> Upload {validItems.length} file{validItems.length !== 1 ? "s" : ""}</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main component ---

export function AdminCasinoIconsTab() {
  const [icons, setIcons] = useState<CasinoIcon[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [fallbackSort, setFallbackSort] = useState<FallbackSortMode>("sort_order");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  const closePendingUpload = useCallback(() => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
  }, [pendingUpload]);

  const stageFile = useCallback((file: File, label: string, onConfirm: (f: File) => void) => {
    const validation = validateFile(file);
    const isValid = validation.valid;
    const previewUrl = isValid ? URL.createObjectURL(file) : "";
    const errorMsg = isValid ? undefined : (validation as { valid: false; error: string }).error;
    setPendingUpload({ file, previewUrl, label, onConfirm, error: errorMsg });
  }, []);

  const fetchIcons = useCallback(async (tab?: string) => {
    const targetTab = tab || activeTab;
    setTabLoading(prev => ({ ...prev, [targetTab]: true }));
    const { data, error } = await supabase
      .from("casino_icons")
      .select("*")
      .order("icon_type")
      .order("sort_order");
    if (error) {
      toast({ title: "Error loading icons", description: error.message, variant: "destructive" });
    } else {
      setIcons(data || []);
    }
    setTabLoading(prev => ({ ...prev, [targetTab]: false }));
    setInitialLoaded(true);
  }, [activeTab]);

  useEffect(() => { fetchIcons("categories"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Core upload: ensure DB row exists, upload to storage, update image_url
  const uploadIconFile = async (iconType: string, iconKey: string, label: string, file: File) => {
    // Find or create DB row
    let existing = icons.find(i => i.icon_type === iconType && i.icon_key === iconKey);
    if (!existing) {
      const { data, error } = await supabase.from("casino_icons").insert({
        icon_type: iconType,
        icon_key: iconKey,
        label,
        image_url: "",
        sort_order: icons.filter(i => i.icon_type === iconType).length,
      }).select().single();
      if (error || !data) throw new Error(error?.message || "Failed to create DB row");
      existing = data;
      setIcons(prev => [...prev, data]);
    }

    const ext = file.name.split(".").pop();
    const path = `${existing.id}.${ext}`;
    await supabase.storage.from("casino-icons").remove([path]);
    const { error: uploadError } = await supabase.storage
      .from("casino-icons")
      .upload(path, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from("casino-icons").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("casino_icons")
      .update({ image_url: urlData.publicUrl })
      .eq("id", existing.id);
    if (updateError) throw new Error(updateError.message);
  };

  const handleUpload = async (iconId: string, file: File) => {
    setUploading(iconId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${iconId}.${ext}`;
      await supabase.storage.from("casino-icons").remove([path]);
      const { error: uploadError } = await supabase.storage
        .from("casino-icons")
        .upload(path, file, { upsert: true });
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }
      const { data: urlData } = supabase.storage.from("casino-icons").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("casino_icons")
        .update({ image_url: urlData.publicUrl })
        .eq("id", iconId);
      if (updateError) { toast({ title: "Failed to save URL", description: updateError.message, variant: "destructive" }); }
      else { toast({ title: "✅ Icon uploaded" }); fetchIcons(); }
    } finally {
      setUploading(null);
    }
  };

  const ensureAndUpload = async (iconType: string, iconKey: string, label: string, file: File) => {
    const existing = icons.find(i => i.icon_type === iconType && i.icon_key === iconKey);
    if (existing) { handleUpload(existing.id, file); return; }
    const { data, error } = await supabase.from("casino_icons").insert({
      icon_type: iconType, icon_key: iconKey, label, image_url: "",
      sort_order: icons.filter(i => i.icon_type === iconType).length,
    }).select().single();
    if (error || !data) { toast({ title: "Failed to create entry", description: error?.message, variant: "destructive" }); return; }
    setIcons(prev => [...prev, data]);
    handleUpload(data.id, file);
  };

  // Bulk upload handler
  const handleBulkUpload = async (items: { file: File; type: "category" | "provider"; key: string; label: string }[]) => {
    for (const item of items) {
      await uploadIconFile(item.type, item.key, item.label, item.file);
    }
    await fetchIcons();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("casino_icons").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Deleted" }); fetchIcons(); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("casino_icons").delete().in("id", ids);
    if (error) {
      toast({ title: "Bulk delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `✅ Deleted ${ids.length} icon(s)` });
      setSelectedIds(new Set());
      fetchIcons();
    }
    setBulkDeleting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleUpdateField = async (id: string, field: string, value: string | string[] | null) => {
    const { error } = await supabase.from("casino_icons").update({ [field]: value } as any).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Updated" }); fetchIcons(); }
  };

  const handleReorder = async (id: string, direction: "up" | "down", type: string) => {
    const subset = icons.filter(i => i.icon_type === type).sort((a, b) => a.sort_order - b.sort_order);
    const idx = subset.findIndex(i => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= subset.length) return;
    setReordering(id);
    const a = subset[idx];
    const b = subset[swapIdx];
    await Promise.all([
      supabase.from("casino_icons").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("casino_icons").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    await fetchIcons();
    setReordering(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent, sortedItems: CasinoIcon[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedItems.findIndex(i => i.id === active.id);
    const newIndex = sortedItems.findIndex(i => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedItems, oldIndex, newIndex);

    // Optimistic update
    setIcons(prev => {
      const otherIcons = prev.filter(i => i.icon_type !== reordered[0]?.icon_type);
      const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx }));
      return [...otherIcons, ...updated];
    });

    // Persist all new sort_orders
    const updates = reordered.map((item, idx) =>
      supabase.from("casino_icons").update({ sort_order: idx } as any).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);
    if (hasError) {
      toast({ title: "Failed to save order", variant: "destructive" });
      fetchIcons(); // revert
    }
  }, [fetchIcons]);

  const handleAddFallback = async () => {
    if (!newKey.trim()) { toast({ title: "Key is required", variant: "destructive" }); return; }
    setSaving(true);
    const keywords = newKeywords.split(",").map(k => k.trim()).filter(Boolean);
    const { error } = await supabase.from("casino_icons").insert({
      icon_type: "fallback", icon_key: newKey.trim().toLowerCase(),
      label: newLabel.trim() || newKey.trim(), image_url: "",
      keywords: keywords.length ? keywords : null,
      sort_order: icons.filter(i => i.icon_type === "fallback").length,
    });
    if (error) { toast({ title: "Failed to add", description: error.message, variant: "destructive" }); }
    else { toast({ title: "✅ Fallback entry added — upload image now" }); setNewKey(""); setNewLabel(""); setNewKeywords(""); fetchIcons(); }
    setSaving(false);
  };

  const isTabLoading = (tab: string) => !initialLoaded || !!tabLoading[tab];
  const isAnyLoading = Object.values(tabLoading).some(Boolean);

  const categoryIcons = icons.filter(i => i.icon_type === "category").sort((a, b) => a.sort_order - b.sort_order);
  const fallbackIcons = icons.filter(i => i.icon_type === "fallback").sort((a, b) => {
    if (fallbackSort === "updated_at") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    return a.sort_order - b.sort_order;
  });
  const providerIcons = icons.filter(i => i.icon_type === "provider").sort((a, b) => a.sort_order - b.sort_order);

  const stageCategory = (presetKey: string, presetLabel: string, file: File) => {
    stageFile(file, presetLabel, (f) => ensureAndUpload("category", presetKey, presetLabel, f));
  };
  const stageProvider = (provKey: string, providerName: string, file: File) => {
    stageFile(file, providerName, (f) => ensureAndUpload("provider", provKey, providerName, f));
  };
  const stageFallback = (iconId: string, label: string, file: File) => {
    stageFile(file, label, (f) => handleUpload(iconId, f));
  };

  return (
    <div className="space-y-6">
      <UploadPreviewDialog pending={pendingUpload} onClose={closePendingUpload} />
      <BulkUploadDialog open={bulkOpen} onClose={() => setBulkOpen(false)} onUploadAll={handleBulkUpload} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">🎰 Casino Icons Manager</h2>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setBulkOpen(true)}>
            <FolderUp className="h-3.5 w-3.5 mr-1" /> Bulk Upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchIcons(activeTab)} disabled={isAnyLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isAnyLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Accepted: PNG, JPG, WebP, GIF, SVG — max 2 MB per file. Use <button className="underline text-primary" onClick={() => setBulkOpen(true)}>Bulk Upload</button> for multiple files at once.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">📂 Categories ({categoryIcons.length})</TabsTrigger>
          <TabsTrigger value="providers">🏢 Providers ({providerIcons.length})</TabsTrigger>
          <TabsTrigger value="fallbacks">🖼️ Fallbacks ({fallbackIcons.length})</TabsTrigger>
        </TabsList>

        {/* ===================== CATEGORIES TAB ===================== */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          {categoryIcons.length === 0 && !isTabLoading("categories") ? (
            <EmptyState
              icon={Crown}
              title="No category icons uploaded yet"
              description="Category tabs are using default Lucide icons. Upload custom icons below to give each category a unique look, or use Bulk Upload to add them all at once."
              ctaLabel="Bulk Upload Icons"
              onCta={() => setBulkOpen(true)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload custom icons for casino category tabs. These replace the default Lucide icons. Drag the grip handle to reorder.
            </p>
          )}
          {isTabLoading("categories") ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, categoryIcons)}>
              <SortableContext items={categoryIcons.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {(() => {
                    // Sort presets: DB-entry ones first (by sort_order), then ones without DB entries
                    const sorted = [...CATEGORY_PRESETS].sort((a, b) => {
                      const aIcon = categoryIcons.find(i => i.icon_key === a.key);
                      const bIcon = categoryIcons.find(i => i.icon_key === b.key);
                      if (aIcon && bIcon) return aIcon.sort_order - bIcon.sort_order;
                      if (aIcon && !bIcon) return -1;
                      if (!aIcon && bIcon) return 1;
                      return 0;
                    });
                    return sorted.map(preset => {
                      const existing = categoryIcons.find(i => i.icon_key === preset.key);
                      const PresetIcon = preset.icon;
                      const cardContent = (
                        <div className="rounded-xl border border-border bg-card p-3 pl-8 space-y-2 transition-shadow hover:shadow-md">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {existing?.image_url ? (
                                <img src={existing.image_url} className="h-5 w-5 object-contain rounded" alt={preset.label} />
                              ) : (
                                <PresetIcon className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{preset.label}</p>
                              <p className="text-[10px] text-muted-foreground">Key: {preset.key}</p>
                            </div>
                          </div>
                          <div className="aspect-[4/3] rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                            {existing?.image_url ? (
                              <img src={existing.image_url} alt={preset.label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                                <ImageIcon className="h-8 w-8" />
                                <span className="text-[10px]">No custom icon</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <FilePickerButton
                              label={existing?.image_url ? "Replace" : "Upload"}
                              disabled={uploading === existing?.id}
                              loading={uploading === existing?.id}
                              onSelect={(f) => stageCategory(preset.key, preset.label, f)}
                            />
                            {existing?.image_url && (
                              <Button size="sm" variant="ghost" className="text-destructive h-8 px-2" onClick={() => existing && handleDelete(existing.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                      if (existing) {
                        return <SortableItem key={existing.id} id={existing.id}>{cardContent}</SortableItem>;
                      }
                      return <div key={preset.key}>{cardContent}</div>;
                    });
                  })()}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* ===================== PROVIDERS TAB ===================== */}
        <TabsContent value="providers" className="space-y-4 mt-4">
          {providerIcons.length === 0 && !isTabLoading("providers") && (
            <EmptyState
              icon={ImageIcon}
              title="No provider logos uploaded yet"
              description="Games without thumbnails will show generic placeholders. Upload provider logos below so each provider's games always have a branded fallback image."
              ctaLabel="Bulk Upload Logos"
              onCta={() => setBulkOpen(true)}
            />
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Upload provider logos. These show as fallback when a game from that provider has no image.
            </p>
            {(() => {
              const selectableProviderIds = providerIcons.filter(i => !!i.image_url).map(i => i.id);
              const selectedCount = selectableProviderIds.filter(id => selectedIds.has(id)).length;
              if (selectableProviderIds.length === 0) return null;
              return (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleSelectAll(selectableProviderIds)}
                  >
                    {selectedCount === selectableProviderIds.length ? (
                      <><X className="h-3 w-3 mr-1" /> Deselect All</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Select All ({selectableProviderIds.length})</>
                    )}
                  </Button>
                  {selectedCount > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={bulkDeleting}
                      onClick={handleBulkDelete}
                    >
                      {bulkDeleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      Delete {selectedCount} Selected
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
          {isTabLoading("providers") ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <ProviderSkeleton key={i} />)}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, providerIcons)}>
              <SortableContext items={providerIcons.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {(() => {
                    // Sort presets: DB-entry ones first (by sort_order), then ones without
                    const sorted = [...PROVIDER_PRESETS].sort((a, b) => {
                      const aIcon = providerIcons.find(i => i.icon_key === normalizeProviderKey(a));
                      const bIcon = providerIcons.find(i => i.icon_key === normalizeProviderKey(b));
                      if (aIcon && bIcon) return aIcon.sort_order - bIcon.sort_order;
                      if (aIcon && !bIcon) return -1;
                      if (!aIcon && bIcon) return 1;
                      return 0;
                    });
                    return sorted.map(providerName => {
                      const provKey = normalizeProviderKey(providerName);
                      const existing = providerIcons.find(i => i.icon_key === provKey);
                      const hasImage = !!existing?.image_url;
                      const isSelected = !!existing && selectedIds.has(existing.id);
                      const cardContent = (
                        <div
                          className={`rounded-xl border bg-card p-2 pl-7 space-y-1.5 transition-all hover:shadow-md relative ${isSelected ? "border-primary ring-1 ring-primary/30" : hasImage ? "border-primary/20" : "border-border"}`}
                        >
                          {hasImage && existing && (
                            <button
                              className={`absolute top-1.5 right-1.5 z-10 h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
                              onClick={() => toggleSelect(existing.id)}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          )}
                          <p className="text-xs font-semibold text-foreground truncate text-center">{providerName}</p>
                          <div className="aspect-[4/3] rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                            {hasImage ? (
                              <img src={existing!.image_url} alt={providerName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 text-muted-foreground/30">
                                <ImageIcon className="h-5 w-5" />
                                <span className="text-[8px]">No logo</span>
                              </div>
                            )}
                          </div>
                          <FilePickerButton
                            label={hasImage ? "Replace" : "Upload"}
                            disabled={uploading === existing?.id}
                            loading={uploading === existing?.id}
                            small
                            onSelect={(f) => stageProvider(provKey, providerName, f)}
                          />
                          {hasImage && (
                            <Button size="sm" variant="ghost" className="w-full text-destructive h-6 text-[10px]" onClick={() => existing && handleDelete(existing.id)}>
                              <Trash2 className="h-3 w-3 mr-1" /> Remove
                            </Button>
                          )}
                        </div>
                      );
                      if (existing) {
                        return <SortableItem key={existing.id} id={existing.id}>{cardContent}</SortableItem>;
                      }
                      return <div key={providerName}>{cardContent}</div>;
                    });
                  })()}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* ===================== FALLBACKS TAB ===================== */}
        <TabsContent value="fallbacks" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Fallback images by keyword — when a game's name contains a keyword, this image is used.
          </p>
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Add New Fallback
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Key</Label>
                <Input placeholder="e.g. fishing" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input placeholder="Display name" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Keywords (comma-sep)</Label>
                <Input placeholder="fish, shark, ocean" value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddFallback} disabled={saving} className="w-full h-8">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Sort + bulk controls */}
          {!isTabLoading("fallbacks") && fallbackIcons.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort by:
                </span>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${fallbackSort === "sort_order" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                    onClick={() => setFallbackSort("sort_order")}
                  >
                    <ListOrdered className="h-3 w-3" /> Priority
                  </button>
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${fallbackSort === "updated_at" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                    onClick={() => setFallbackSort("updated_at")}
                  >
                    <CalendarClock className="h-3 w-3" /> Recently Updated
                  </button>
                </div>
              </div>
              {(() => {
                const fallbackIds = fallbackIcons.map(i => i.id);
                const selectedCount = fallbackIds.filter(id => selectedIds.has(id)).length;
                return (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleSelectAll(fallbackIds)}
                    >
                      {selectedCount === fallbackIds.length ? (
                        <><X className="h-3 w-3 mr-1" /> Deselect All</>
                      ) : (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Select All ({fallbackIds.length})</>
                      )}
                    </Button>
                    {selectedCount > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={bulkDeleting}
                        onClick={handleBulkDelete}
                      >
                        {bulkDeleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Delete {selectedCount} Selected
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {isTabLoading("fallbacks") ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} aspect="video" />)}
            </div>
          ) : fallbackIcons.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No custom fallbacks yet"
              description="Built-in defaults are active. Add keyword-based fallback images using the form above — when a game's name contains your keywords, your custom image will be used instead of the generic placeholder."
              ctaLabel="Bulk Upload Fallbacks"
              onCta={() => setBulkOpen(true)}
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, fallbackIcons)}>
              <SortableContext items={fallbackIcons.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fallbackIcons.map((icon, idx) => (
                    <SortableItem key={icon.id} id={icon.id}>
                      <FallbackCard
                        icon={icon}
                        uploading={uploading}
                        reordering={reordering}
                        sortMode={fallbackSort}
                        isFirst={idx === 0}
                        isLast={idx === fallbackIcons.length - 1}
                        isSelected={selectedIds.has(icon.id)}
                        onToggleSelect={() => toggleSelect(icon.id)}
                        onStageUpload={(f) => stageFallback(icon.id, icon.label || icon.icon_key, f)}
                        onDelete={handleDelete}
                        onUpdateField={handleUpdateField}
                        onReorder={(dir) => handleReorder(icon.id, dir, "fallback")}
                      />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Reusable file picker button ---

function FilePickerButton({
  label, disabled, loading: isLoading, small, onSelect,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label className={`${small ? "" : "flex-1"} block cursor-pointer`}>
      <div className={`flex items-center justify-center gap-1 rounded-md border border-primary/30 bg-primary/5 ${small ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-xs"} font-medium text-primary hover:bg-primary/10 transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        {isLoading ? <Loader2 className={`${small ? "h-2.5 w-2.5" : "h-3 w-3"} animate-spin`} /> : <Upload className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />}
        {label}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); if (inputRef.current) inputRef.current.value = ""; }} />
    </label>
  );
}

// --- Fallback card ---

function FallbackCard({
  icon, uploading, reordering, sortMode = "sort_order", isFirst, isLast,
  isSelected = false, onToggleSelect,
  onStageUpload, onDelete, onUpdateField, onReorder,
}: {
  icon: CasinoIcon;
  uploading: string | null;
  reordering: string | null;
  sortMode?: FallbackSortMode;
  isFirst: boolean;
  isLast: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onStageUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onUpdateField: (id: string, field: string, value: string | string[] | null) => void;
  onReorder: (direction: "up" | "down") => void;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(icon.label);
  const [kwDraft, setKwDraft] = useState(icon.keywords?.join(", ") || "");
  const [kwDirty, setKwDirty] = useState(false);
  const isReordering = reordering === icon.id;
  const canReorder = sortMode === "sort_order";

  // Format relative time for updated_at display
  const updatedLabel = (() => {
    if (!icon.updated_at) return "";
    const diff = Date.now() - new Date(icon.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className={`rounded-xl border bg-card p-3 space-y-2 transition-all hover:shadow-md relative ${isSelected ? "border-primary ring-1 ring-primary/30" : isReordering ? "border-primary/40 ring-1 ring-primary/20 scale-[1.01]" : "border-border"}`}>
      {onToggleSelect && (
        <button
          className={`absolute top-2 right-2 z-10 h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
          onClick={onToggleSelect}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {editingLabel ? (
            <div className="flex items-center gap-1">
              <Input className="h-6 text-xs w-28" value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { onUpdateField(icon.id, "label", labelDraft); setEditingLabel(false); } }} autoFocus />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onUpdateField(icon.id, "label", labelDraft); setEditingLabel(false); }}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
            </div>
          ) : (
            <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors" onClick={() => setEditingLabel(true)}>
              {icon.label || icon.icon_key}
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {sortMode === "sort_order" ? (
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">#{icon.sort_order}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5" title={new Date(icon.updated_at).toLocaleString()}>
              <CalendarClock className="h-2.5 w-2.5" /> {updatedLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {canReorder && (
            <>
              <Button
                size="icon"
                variant={isFirst ? "ghost" : "outline"}
                className={`h-6 w-6 transition-colors ${!isFirst && !isReordering ? "border-primary/20 text-primary hover:bg-primary/10" : ""}`}
                disabled={isFirst || isReordering}
                onClick={() => onReorder("up")}
              >
                {isReordering ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUp className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant={isLast ? "ghost" : "outline"}
                className={`h-6 w-6 transition-colors ${!isLast && !isReordering ? "border-primary/20 text-primary hover:bg-primary/10" : ""}`}
                disabled={isLast || isReordering}
                onClick={() => onReorder("down")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(icon.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="aspect-video rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
        {icon.image_url ? (
          <img src={icon.image_url} alt={icon.label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[10px]">No image uploaded</span>
          </div>
        )}
      </div>
      <FilePickerButton label={icon.image_url ? "Replace Image" : "Upload Image"} disabled={uploading === icon.id} loading={uploading === icon.id} onSelect={onStageUpload} />
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Keywords (comma-sep)</Label>
        <div className="flex gap-1">
          <Input className="h-7 text-xs flex-1" value={kwDraft} placeholder="fish, shark, ocean"
            onChange={(e) => { setKwDraft(e.target.value); setKwDirty(true); }} />
          {kwDirty && (
            <Button size="icon" variant="outline" className="h-7 w-7 shrink-0"
              onClick={() => { const kws = kwDraft.split(",").map(k => k.trim()).filter(Boolean); onUpdateField(icon.id, "keywords", kws.length ? kws : null); setKwDirty(false); }}>
              <Save className="h-3 w-3" />
            </Button>
          )}
        </div>
        {icon.keywords?.length ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {icon.keywords.map((kw, i) => (
              <span key={i} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary font-medium">{kw}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
