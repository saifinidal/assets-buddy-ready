// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/loose";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type UserRole = Tables<"user_roles">;
export type Deposit = Tables<"deposits">;
export type Withdrawal = Tables<"withdrawals">;
export type AgentRequest = Tables<"agent_requests">;

export interface ProfileWithRole extends Profile {
  role: string;
  parentName?: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data: profilesData } = await supabase.from("profiles").select("*");
    const { data: rolesData } = await supabase.from("user_roles").select("*");

    if (profilesData && rolesData) {
      const roleMap = new Map(rolesData.map((r) => [r.user_id, r.role]));
      const profileMap = new Map(profilesData.map((p) => [p.id, p.name]));
      const merged: ProfileWithRole[] = profilesData.map((p) => ({
        ...p,
        role: roleMap.get(p.id) || "user",
        parentName: p.parent_id ? profileMap.get(p.parent_id) || undefined : undefined,
      }));
      setProfiles(merged);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const updateProfileStatus = async (profileId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", profileId);
    await fetchProfiles();
  };

  const updateProfileRole = async (profileId: string, newRole: string, parentId?: string, share?: number, commission?: number) => {
    // Update role in user_roles table
    await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", profileId);
    // Update parent/share/commission in profiles
    const updates: any = {};
    if (parentId !== undefined) updates.parent_id = parentId;
    if (share !== undefined) updates.share = share;
    if (commission !== undefined) updates.commission = commission;
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", profileId);
    }
    await fetchProfiles();
  };

  const createProfile = async (data: {
    name: string; phone: string; role: string; share: number; commission: number; parentId?: string;
  }) => {
    const prefix = { admin: "ADM", super_stockist: "SST", stockist: "STK", master: "MST", agent: "AGT", sub_agent: "SAG", user: "USR" }[data.role] || "USR";
    const displayId = `${prefix}-${String(Date.now()).slice(-3)}`;

    const { data: newProfile, error } = await supabase.from("profiles").insert({
      display_id: displayId,
      name: data.name,
      phone: data.phone,
      share: data.share,
      commission: data.commission,
      parent_id: data.parentId || null,
      status: "active",
      kyc: "pending",
    }).select().single();

    if (newProfile && !error) {
      await supabase.from("user_roles").insert({
        user_id: newProfile.id,
        role: data.role as any,
      });
    }
    await fetchProfiles();
    return { error };
  };

  return { profiles, loading, fetchProfiles, updateProfileStatus, updateProfileRole, createProfile };
}

export function useDeposits() {
  const [deposits, setDeposits] = useState<(Deposit & { userName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    const { data: deps } = await supabase.from("deposits").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    
    if (deps && profiles) {
      const nameMap = new Map(profiles.map((p) => [p.id, p.name]));
      setDeposits(deps.map((d) => ({ ...d, userName: nameMap.get(d.profile_id) || "Unknown" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const updateDepositStatus = async (id: string, status: string) => {
    await supabase.from("deposits").update({ status }).eq("id", id);
    await fetchDeposits();
  };

  return { deposits, loading, fetchDeposits, updateDepositStatus };
}

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<(Withdrawal & { userName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    const { data: wths } = await supabase.from("withdrawals").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    
    if (wths && profiles) {
      const nameMap = new Map(profiles.map((p) => [p.id, p.name]));
      setWithdrawals(wths.map((w) => ({ ...w, userName: nameMap.get(w.profile_id) || "Unknown" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const updateWithdrawalStatus = async (id: string, status: string) => {
    await supabase.from("withdrawals").update({ status }).eq("id", id);
    await fetchWithdrawals();
  };

  return { withdrawals, loading, fetchWithdrawals, updateWithdrawalStatus };
}

export function useAgentRequests() {
  const [requests, setRequests] = useState<(AgentRequest & { userName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data: reqs } = await supabase.from("agent_requests").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    
    if (reqs && profiles) {
      const nameMap = new Map(profiles.map((p) => [p.id, p.name]));
      setRequests(reqs.map((r) => ({ ...r, userName: nameMap.get(r.profile_id) || "Unknown" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("agent_requests").update({ status }).eq("id", id);
    await fetchRequests();
  };

  return { requests, loading, fetchRequests, updateRequestStatus };
}

export type Settlement = {
  id: string;
  profile_id: string;
  agent_profile_id: string;
  type: string;
  amount: number;
  reason: string;
  note: string | null;
  status: string;
  created_at: string | null;
};

export type Commission = {
  id: string;
  profile_id: string;
  from_profile_id: string;
  match_event: string | null;
  turnover: number;
  comm_rate: number;
  amount: number;
  type: string;
  created_at: string | null;
};

export function useSettlements(agentProfileId?: string) {
  const [settlements, setSettlements] = useState<(Settlement & { agentName: string; agentDisplayId: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("settlements" as any).select("*");
    if (agentProfileId) {
      query = query.or(`profile_id.eq.${agentProfileId},agent_profile_id.eq.${agentProfileId}`);
    }
    const { data: stls } = await query;
    const { data: profiles } = await supabase.from("profiles").select("id, name, display_id");
    
    if (stls && profiles) {
      const nameMap = new Map(profiles.map((p: any) => [p.id, p.name]));
      const idMap = new Map(profiles.map((p: any) => [p.id, p.display_id]));
      setSettlements((stls as any[]).map((s) => ({
        ...s,
        agentName: nameMap.get(s.agent_profile_id) || "Unknown",
        agentDisplayId: idMap.get(s.agent_profile_id) || "",
      })));
    }
    setLoading(false);
  }, [agentProfileId]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const createSettlement = async (data: { agent_profile_id: string; type: string; amount: number; reason: string; note?: string; profile_id: string }) => {
    await supabase.from("settlements" as any).insert(data as any);
    await fetchSettlements();
  };

  const updateSettlementStatus = async (id: string, status: string) => {
    await supabase.from("settlements" as any).update({ status } as any).eq("id", id);
    await fetchSettlements();
  };

  return { settlements, loading, fetchSettlements, createSettlement, updateSettlementStatus };
}

export function useCommissions(profileId?: string) {
  const [commissions, setCommissions] = useState<(Commission & { fromName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("commissions" as any).select("*");
    if (profileId) {
      query = query.eq("profile_id", profileId);
    }
    const { data: comms } = await query;
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    
    if (comms && profiles) {
      const nameMap = new Map(profiles.map((p: any) => [p.id, p.name]));
      setCommissions((comms as any[]).map((c) => ({
        ...c,
        fromName: nameMap.get(c.from_profile_id) || "Unknown",
      })));
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  return { commissions, loading, fetchCommissions };
}