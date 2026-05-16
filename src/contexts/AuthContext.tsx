// @ts-nocheck
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/loose";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "super_stockist" | "stockist" | "master" | "agent" | "sub_agent" | "user";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  super_stockist: "Super Stockist",
  stockist: "Stockist",
  master: "Master",
  agent: "Agent",
  sub_agent: "Sub-Agent",
  user: "User",
};

export const ROLE_HIERARCHY: UserRole[] = [
  "admin", "super_stockist", "stockist", "master", "agent", "sub_agent", "user",
];

export interface AppUser {
  id: string; // display_id
  profileId: string; // uuid from profiles
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  status: string;
  balance: number;
  parentId: string | null;
  joined: string;
  share: number;
  commission: number;
  kyc: string;
}

interface AuthContextType {
  currentUser: AppUser | null;
  authUser: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  signup: (email: string, password: string, fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAgentRole: () => boolean;
  canAccessAdmin: () => boolean;
  canAccessAgent: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email?: string | null) => {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Transient network / RLS hiccup — do NOT wipe existing currentUser,
    // otherwise UI flips to "logged out" while the session is still valid.
    if (profileErr) {
      console.warn("[auth] fetchProfile error, keeping current user:", profileErr.message);
      return null;
    }

    if (!profile) {
      // Truly no profile row — only then clear.
      setCurrentUser(null);
      return null;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .single();

    const role = (roleData?.role as UserRole) || "user";

    const nextUser = {
      id: profile.display_id,
      profileId: profile.id,
      name: profile.name,
      phone: profile.phone,
      email: email || null,
      role,
      status: profile.status || "active",
      balance: profile.balance || 0,
      parentId: profile.parent_id,
      joined: profile.created_at || "",
      share: profile.share || 0,
      commission: profile.commission || 0,
      kyc: profile.kyc || "pending",
    };

    setCurrentUser(nextUser);
    return nextUser;
  }, []);

  // Listen to auth state changes — NEVER await supabase calls inside this
  // callback; it holds an internal auth lock and will deadlock. Defer via setTimeout.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only clear on explicit sign-out or user deletion.
        // INITIAL_SESSION with null is handled by the IIFE below.
        // TOKEN_REFRESHED / USER_UPDATED with a session must NEVER wipe state.
        if (event === "SIGNED_OUT") {
          setAuthUser(null);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setAuthUser(session.user);
          setTimeout(() => {
            fetchProfile(session.user.id, session.user.email).finally(() => setLoading(false));
          }, 0);
        }
      }
    );

    // Check existing session
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Login failed" };

    setAuthUser(data.user);
    setLoading(true);
    const appUser = await fetchProfile(data.user.id, data.user.email);
    setLoading(false);

    // Determine redirect based on role
    const role = appUser?.role || "user";
    let redirectTo = "/";
    if (role === "admin") redirectTo = "/admin";
    else if (["super_stockist", "stockist", "master", "agent", "sub_agent"].includes(role)) redirectTo = "/agent";
    return { success: true, redirectTo };
  }, [fetchProfile]);

  const signup = useCallback(async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setCurrentUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser) {
      await fetchProfile(authUser.id, authUser.email);
    }
  }, [authUser, fetchProfile]);

  const hasRole = useCallback((role: UserRole) => currentUser?.role === role, [currentUser]);

  const isAgentRole = useCallback(() => {
    if (!currentUser) return false;
    return ["super_stockist", "stockist", "master", "agent", "sub_agent"].includes(currentUser.role);
  }, [currentUser]);

  const canAccessAdmin = useCallback(() => currentUser?.role === "admin", [currentUser]);

  const canAccessAgent = useCallback(() => {
    if (!currentUser) return false;
    return ["admin", "super_stockist", "stockist", "master", "agent", "sub_agent"].includes(currentUser.role);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, authUser, isLoggedIn: !!currentUser && !!authUser, loading,
      login, signup, logout, hasRole, isAgentRole, canAccessAdmin, canAccessAgent, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}