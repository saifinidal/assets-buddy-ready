import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethodType = "upi" | "bank" | "crypto";

export interface PaymentAccount {
  id: string;
  type: PaymentMethodType;
  label: string;
  upi_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  holder_name: string | null;
  crypto_network: string | null;
  crypto_currency: string | null;
  wallet_address: string | null;
  qr_image_url: string | null;
  is_active: boolean;
  usage_count: number;
}

/**
 * Returns one active payment account using round-robin rotation.
 * Uses localStorage counter to rotate across accounts.
 */
export function usePaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payment_accounts" as any)
      .select("*")
      .eq("is_active", true)
      .order("usage_count", { ascending: true });
    if (data) setAccounts((data as any[]).map((d: any) => ({
      ...d,
      type: d.method || d.type,
      label: d.account_name || d.label || "",
      usage_count: d.usage_count || 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const getRotatedAccount = useCallback((type: PaymentMethodType): PaymentAccount | null => {
    const filtered = accounts.filter((a) => a.type === type);
    if (filtered.length === 0) return null;

    const key = `payment_rotation_${type}`;
    const idx = parseInt(localStorage.getItem(key) || "0", 10);
    const account = filtered[idx % filtered.length];
    localStorage.setItem(key, String((idx + 1) % filtered.length));
    return account;
  }, [accounts]);

  const incrementUsage = useCallback(async (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;
    await supabase
      .from("payment_accounts" as any)
      .update({ usage_count: acc.usage_count + 1 } as any)
      .eq("id", accountId);
  }, [accounts]);

  const upiAccounts = accounts.filter((a) => a.type === "upi");
  const bankAccounts = accounts.filter((a) => a.type === "bank");
  const cryptoAccounts = accounts.filter((a) => a.type === "crypto");

  return { accounts, upiAccounts, bankAccounts, cryptoAccounts, loading, getRotatedAccount, incrementUsage, fetchAccounts };
}
