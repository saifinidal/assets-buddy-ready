export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          profile_id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          profile_id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          profile_id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          actor_profile_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          summary: string
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_profile_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          summary: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_profile_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          summary?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bets: {
        Row: {
          bet_type: string
          created_at: string | null
          id: string
          match_event: string
          match_id: string | null
          odds: number
          profile_id: string
          profit: number | null
          result: string | null
          selection: string
          stake: number
        }
        Insert: {
          bet_type?: string
          created_at?: string | null
          id?: string
          match_event: string
          match_id?: string | null
          odds?: number
          profile_id: string
          profit?: number | null
          result?: string | null
          selection: string
          stake?: number
        }
        Update: {
          bet_type?: string
          created_at?: string | null
          id?: string
          match_event?: string
          match_id?: string | null
          odds?: number
          profile_id?: string
          profit?: number | null
          result?: string | null
          selection?: string
          stake?: number
        }
        Relationships: [
          {
            foreignKeyName: "bets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_games: {
        Row: {
          created_at: string | null
          game_name: string | null
          game_uid: string
          id: string
          provider_name: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          game_name?: string | null
          game_uid: string
          id?: string
          provider_name?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          game_name?: string | null
          game_uid?: string
          id?: string
          provider_name?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      casino_icons: {
        Row: {
          created_at: string
          icon_key: string
          icon_type: string
          id: string
          image_url: string
          keywords: string[] | null
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_key: string
          icon_type: string
          id?: string
          image_url: string
          keywords?: string[] | null
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_key?: string
          icon_type?: string
          id?: string
          image_url?: string
          keywords?: string[] | null
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      casino_sessions: {
        Row: {
          balance_after: number | null
          balance_before: number
          closed_at: string | null
          game_name: string
          game_uid: string
          id: string
          net_change: number | null
          opened_at: string
          profile_id: string
          provider_name: string
          status: string
        }
        Insert: {
          balance_after?: number | null
          balance_before?: number
          closed_at?: string | null
          game_name: string
          game_uid: string
          id?: string
          net_change?: number | null
          opened_at?: string
          profile_id: string
          provider_name: string
          status?: string
        }
        Update: {
          balance_after?: number | null
          balance_before?: number
          closed_at?: string | null
          game_name?: string
          game_uid?: string
          id?: string
          net_change?: number | null
          opened_at?: string
          profile_id?: string
          provider_name?: string
          status?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          comm_rate: number
          created_at: string | null
          from_profile_id: string
          id: string
          match_event: string | null
          profile_id: string
          turnover: number
          type: string
        }
        Insert: {
          amount?: number
          comm_rate?: number
          created_at?: string | null
          from_profile_id: string
          id?: string
          match_event?: string | null
          profile_id: string
          turnover?: number
          type?: string
        }
        Update: {
          amount?: number
          comm_rate?: number
          created_at?: string | null
          from_profile_id?: string
          id?: string
          match_event?: string | null
          profile_id?: string
          turnover?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: string | null
          profile_id: string
          status: string | null
          utr: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method?: string | null
          profile_id: string
          status?: string | null
          utr?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: string | null
          profile_id?: string
          status?: string | null
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_launch_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          game_name: string | null
          game_uid: string
          id: string
          launch_success: boolean
          profile_id: string | null
          provider_name: string | null
          request_url: string | null
          response_body: string | null
          response_status: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          game_name?: string | null
          game_uid: string
          id?: string
          launch_success?: boolean
          profile_id?: string | null
          provider_name?: string | null
          request_url?: string | null
          response_body?: string | null
          response_status?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          game_name?: string | null
          game_uid?: string
          id?: string
          launch_success?: boolean
          profile_id?: string | null
          provider_name?: string | null
          request_url?: string | null
          response_body?: string | null
          response_status?: number | null
        }
        Relationships: []
      }
      game_route_overrides: {
        Row: {
          created_at: string
          game_name: string | null
          game_uid: string
          id: string
          server_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_name?: string | null
          game_uid: string
          id?: string
          server_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_name?: string | null
          game_uid?: string
          id?: string
          server_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string | null
          doc_type: string
          file_url: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          file_url: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          file_url?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_matches: {
        Row: {
          created_at: string
          draw_back: number | null
          draw_lay: number | null
          has_bm: boolean | null
          has_fancy: boolean | null
          has_tv: boolean | null
          id: string
          is_live: boolean
          is_suspended: boolean | null
          league: string
          match_result: string | null
          match_time: string | null
          score1: string | null
          score2: string | null
          sort_order: number | null
          sport: string
          sport_icon: string
          status: string | null
          team1: string
          team1_back: number
          team1_lay: number
          team2: string
          team2_back: number
          team2_lay: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_back?: number | null
          draw_lay?: number | null
          has_bm?: boolean | null
          has_fancy?: boolean | null
          has_tv?: boolean | null
          id?: string
          is_live?: boolean
          is_suspended?: boolean | null
          league: string
          match_result?: string | null
          match_time?: string | null
          score1?: string | null
          score2?: string | null
          sort_order?: number | null
          sport?: string
          sport_icon?: string
          status?: string | null
          team1: string
          team1_back?: number
          team1_lay?: number
          team2: string
          team2_back?: number
          team2_lay?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_back?: number | null
          draw_lay?: number | null
          has_bm?: boolean | null
          has_fancy?: boolean | null
          has_tv?: boolean | null
          id?: string
          is_live?: boolean
          is_suspended?: boolean | null
          league?: string
          match_result?: string | null
          match_time?: string | null
          score1?: string | null
          score2?: string | null
          sort_order?: number | null
          sport?: string
          sport_icon?: string
          status?: string | null
          team1?: string
          team1_back?: number
          team1_lay?: number
          team2?: string
          team2_back?: number
          team2_lay?: number
          updated_at?: string
        }
        Relationships: []
      }
      market_odds: {
        Row: {
          auto_generated: boolean
          back_odd: number
          created_at: string
          event_id: string
          id: string
          is_suspended: boolean
          lay_odd: number
          match_event: string
          open_date: string | null
          selection: string
          sort_order: number
          sport: string
          updated_at: string
        }
        Insert: {
          auto_generated?: boolean
          back_odd?: number
          created_at?: string
          event_id: string
          id?: string
          is_suspended?: boolean
          lay_odd?: number
          match_event: string
          open_date?: string | null
          selection: string
          sort_order?: number
          sport?: string
          updated_at?: string
        }
        Update: {
          auto_generated?: boolean
          back_odd?: number
          created_at?: string
          event_id?: string
          id?: string
          is_suspended?: boolean
          lay_odd?: number
          match_event?: string
          open_date?: string | null
          selection?: string
          sort_order?: number
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string | null
          created_at: string | null
          crypto_currency: string | null
          crypto_network: string | null
          holder_name: string | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          method: string
          qr_image_url: string | null
          upi_id: string | null
          usage_count: number
          wallet_address: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name?: string | null
          created_at?: string | null
          crypto_currency?: string | null
          crypto_network?: string | null
          holder_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          method?: string
          qr_image_url?: string | null
          upi_id?: string | null
          usage_count?: number
          wallet_address?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string | null
          created_at?: string | null
          crypto_currency?: string | null
          crypto_network?: string | null
          holder_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          method?: string
          qr_image_url?: string | null
          upi_id?: string | null
          usage_count?: number
          wallet_address?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number | null
          commission: number | null
          created_at: string | null
          display_id: string
          id: string
          kyc: string | null
          name: string
          parent_id: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          share: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vip_level: string | null
        }
        Insert: {
          balance?: number | null
          commission?: number | null
          created_at?: string | null
          display_id: string
          id?: string
          kyc?: string | null
          name: string
          parent_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          share?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vip_level?: string | null
        }
        Update: {
          balance?: number | null
          commission?: number | null
          created_at?: string | null
          display_id?: string
          id?: string
          kyc?: string | null
          name?: string
          parent_id?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          share?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vip_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          referred_profile_id: string
          referrer_profile_id: string
          source: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          referred_profile_id: string
          referrer_profile_id: string
          source?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          referred_profile_id?: string
          referrer_profile_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_earnings_referrer_profile_id_fkey"
            columns: ["referrer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          agent_profile_id: string
          amount: number
          created_at: string | null
          id: string
          note: string | null
          profile_id: string
          reason: string
          status: string
          type: string
        }
        Insert: {
          agent_profile_id: string
          amount: number
          created_at?: string | null
          id?: string
          note?: string | null
          profile_id: string
          reason: string
          status?: string
          type?: string
        }
        Update: {
          agent_profile_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          note?: string | null
          profile_id?: string
          reason?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string
        }
        Update: {
          category?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string | null
          id: string
          message: string
          profile_id: string
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message: string
          profile_id: string
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message?: string
          profile_id?: string
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          balance: number | null
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string
          id: string
          profile_id: string
          type: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description: string
          id?: string
          profile_id: string
          type?: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string
          id?: string
          profile_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          bank_info: string | null
          created_at: string | null
          id: string
          method: string | null
          profile_id: string
          status: string | null
        }
        Insert: {
          amount: number
          bank_info?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          profile_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          bank_info?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          profile_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_bet: { Args: { _bet_id: string }; Returns: Json }
      credit_agent_commission: { Args: { _deposit_id: string }; Returns: Json }
      get_my_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _profile_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_agent_or_above: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _metadata?: Json
          _summary: string
          _target_id?: string
          _target_type?: string
        }
        Returns: string
      }
      place_bet: {
        Args: {
          _bet_type: string
          _match_event: string
          _match_id: string
          _odds: number
          _selection: string
          _stake: number
        }
        Returns: Json
      }
      settle_bets_by_event: {
        Args: { _match_event: string; _winning_selection: string }
        Returns: Json
      }
      settle_match: {
        Args: { _match_id: string; _winning_selection: string }
        Returns: Json
      }
      upsert_market_odds: {
        Args: {
          _auto?: boolean
          _event_id: string
          _match_event: string
          _open_date: string
          _selections: Json
          _sport: string
        }
        Returns: Json
      }
      void_bets_by_event: { Args: { _match_event: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "super_stockist"
        | "stockist"
        | "master"
        | "agent"
        | "sub_agent"
        | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "super_stockist",
        "stockist",
        "master",
        "agent",
        "sub_agent",
        "user",
      ],
    },
  },
} as const
