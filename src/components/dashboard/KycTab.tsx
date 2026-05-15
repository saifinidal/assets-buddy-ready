import { useState, useEffect } from "react";
import { Shield, Upload, CheckCircle, Clock, XCircle, Camera, CreditCard, ArrowLeft, Loader2, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/loose";
import { useToast } from "@/hooks/use-toast";

interface KycTabProps {
  profileId: string;
  kycStatus: string;
}

const docTypes = [
  { id: "aadhaar", label: "Aadhaar Card", icon: CreditCard },
  { id: "pan", label: "PAN Card", icon: CreditCard },
  { id: "passport", label: "Passport", icon: FileText },
  { id: "driving_license", label: "Driving License", icon: CreditCard },
];

export function KycTab({ profileId, kycStatus }: KycTabProps) {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Form state
  const [docType, setDocType] = useState("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [profileId]);

  const fetchSubmission = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("kyc_submissions" as any)
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && (data as any[]).length > 0) {
      setSubmission((data as any[])[0]);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${profileId}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!docNumber.trim()) {
      toast({ title: "Document Number Required", variant: "destructive" });
      return;
    }
    if (!frontFile) {
      toast({ title: "Front Image Required", description: "Please upload the front side of your document", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const frontUrl = await uploadFile(frontFile, "front");
      const backUrl = backFile ? await uploadFile(backFile, "back") : null;
      const selfieUrl = selfieFile ? await uploadFile(selfieFile, "selfie") : null;

      if (!frontUrl) {
        toast({ title: "Upload Failed", description: "Could not upload front image", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("kyc_submissions" as any).insert({
        profile_id: profileId,
        document_type: docType,
        document_number: docNumber.trim(),
        front_image_url: frontUrl,
        back_image_url: backUrl,
        selfie_url: selfieUrl,
        status: "pending",
      } as any);

      if (error) throw error;

      // Update profile kyc status to 'submitted'
      await supabase.from("profiles").update({ kyc: "submitted" }).eq("id", profileId);

      toast({ title: "KYC Submitted!", description: "Your documents are being reviewed" });
      setShowForm(false);
      fetchSubmission();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit KYC", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ========== STATUS VIEW ==========
  if (submission && !showForm) {
    const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; border: string; label: string; desc: string }> = {
      verified: {
        icon: CheckCircle, color: "text-[hsl(var(--live))]", bg: "bg-[hsl(var(--live)/.08)]", border: "border-[hsl(var(--live)/.2)]",
        label: "Verified", desc: "Your identity has been verified successfully."
      },
      pending: {
        icon: Clock, color: "text-[hsl(var(--highlight))]", bg: "bg-[hsl(var(--highlight)/.08)]", border: "border-[hsl(var(--highlight)/.2)]",
        label: "Under Review", desc: "Your documents are being reviewed. This usually takes 24-48 hours."
      },
      rejected: {
        icon: XCircle, color: "text-[hsl(var(--live-red))]", bg: "bg-[hsl(var(--live-red)/.08)]", border: "border-[hsl(var(--live-red)/.2)]",
        label: "Rejected", desc: submission.admin_note || "Your KYC was rejected. Please re-submit with valid documents."
      },
    };

    const config = statusConfig[submission.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <div className="space-y-4">
        {/* Status Card */}
        <div className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} p-5`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ${config.color}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className={`font-display text-lg font-bold ${config.color}`}>{config.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{config.desc}</p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Submitted: {new Date(submission.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-secondary/40 px-4 py-2.5 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Submission Details</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">Document Type</span>
              <span className="text-xs font-semibold text-foreground capitalize">{submission.document_type.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">Document Number</span>
              <span className="text-xs font-semibold text-foreground font-mono">{submission.document_number}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">Documents</span>
              <div className="flex gap-2">
                {submission.front_image_url && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--live))]"><CheckCircle className="h-3 w-3" /> Front</span>}
                {submission.back_image_url && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--live))]"><CheckCircle className="h-3 w-3" /> Back</span>}
                {submission.selfie_url && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--live))]"><CheckCircle className="h-3 w-3" /> Selfie</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Re-submit if rejected */}
        {submission.status === "rejected" && (
          <Button onClick={() => setShowForm(true)} className="w-full h-11 rounded-xl font-bold">
            Re-submit KYC Documents
          </Button>
        )}
      </div>
    );
  }

  // ========== FORM VIEW ==========
  if (showForm || !submission) {
    return (
      <div className="space-y-4">
        {submission && (
          <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to status
          </button>
        )}

        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Identity Verification</p>
              <p className="text-[11px] text-muted-foreground">Upload your documents for KYC verification</p>
            </div>
          </div>
        </div>

        {/* Document Type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Document Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {docTypes.map((dt) => (
              <button
                key={dt.id}
                onClick={() => setDocType(dt.id)}
                className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                  docType === dt.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <dt.icon className={`h-4 w-4 ${docType === dt.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold text-foreground">{dt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Number */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Document Number</Label>
          <Input
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder={docType === "aadhaar" ? "XXXX XXXX XXXX" : docType === "pan" ? "ABCDE1234F" : "Enter number"}
            className="h-11 rounded-xl border-2 text-sm"
          />
        </div>

        {/* File Uploads */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold">Upload Documents</Label>
          
          <FileUploadBox
            label="Front Side"
            sublabel="Required"
            icon={CreditCard}
            file={frontFile}
            onFileChange={setFrontFile}
            required
          />
          <FileUploadBox
            label="Back Side"
            sublabel="Optional"
            icon={CreditCard}
            file={backFile}
            onFileChange={setBackFile}
          />
          <FileUploadBox
            label="Selfie with Document"
            sublabel="Optional"
            icon={Camera}
            file={selfieFile}
            onFileChange={setSelfieFile}
          />
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p>• Upload clear, readable images (JPG, PNG, max 5MB)</p>
            <p>• All four corners of the document should be visible</p>
            <p>• Review typically takes 24-48 hours</p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitting || !frontFile || !docNumber.trim()} className="w-full h-12 rounded-xl font-bold">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading & Submitting...</>
          ) : (
            <><Shield className="h-4 w-4" /> Submit KYC Documents</>
          )}
        </Button>
      </div>
    );
  }

  return null;
}

// ========== File Upload Box ==========
function FileUploadBox({ label, sublabel, icon: Icon, file, onFileChange, required }: {
  label: string;
  sublabel: string;
  icon: typeof Upload;
  file: File | null;
  onFileChange: (f: File | null) => void;
  required?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3.5 cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5 ${
      file ? "border-[hsl(var(--live)/.3)] bg-[hsl(var(--live)/.03)]" : "border-border bg-card"
    }`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
        file ? "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))]" : "bg-secondary text-muted-foreground"
      }`}>
        {file ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {file ? (
          <p className="text-[10px] text-[hsl(var(--live))] font-medium truncate">{file.name}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">{sublabel} · Tap to upload</p>
        )}
      </div>
      <div className="shrink-0">
        <Upload className="h-4 w-4 text-muted-foreground" />
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
