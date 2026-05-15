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
          actor_profile_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          bet_type: string
          created_at: string | null
          id: string
          match_event: string
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
      casino_icons: {
        Row: {
          created_at: string | null
          icon_type: string
          id: string
          image_url: string | null
          key: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon_type: string
          id?: string
          image_url?: string | null
          key: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon_type?: string
          id?: string
          image_url?: string | null
          key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      casino_sessions: {
        Row: {
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          game_id: string | null
          game_name: string | null
          id: string
          profile_id: string | null
          provider: string | null
        }
        Insert: {
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          game_id?: string | null
          game_name?: string | null
          id?: string
          profile_id?: string | null
          provider?: string | null
        }
        Update: {
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          game_id?: string | null
          game_name?: string | null
          id?: string
          profile_id?: string | null
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casino_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number | null
          comm_rate: number | null
          created_at: string | null
          from_profile_id: string
          id: string
          match_event: string | null
          profile_id: string
          turnover: number | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          comm_rate?: number | null
          created_at?: string | null
          from_profile_id: string
          id?: string
          match_event?: string | null
          profile_id: string
          turnover?: number | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          comm_rate?: number | null
          created_at?: string | null
          from_profile_id?: string
          id?: string
          match_event?: string | null
          profile_id?: string
          turnover?: number | null
          type?: string | null
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
          created_at: string | null
          game_id: string | null
          game_name: string | null
          id: string
          profile_id: string | null
          provider: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          game_name?: string | null
          id?: string
          profile_id?: string | null
          provider?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          game_name?: string | null
          id?: string
          profile_id?: string | null
          provider?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_launch_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          admin_note: string | null
          back_image_url: string | null
          created_at: string | null
          document_number: string | null
          document_type: string
          front_image_url: string | null
          id: string
          profile_id: string
          reviewed_at: string | null
          selfie_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          back_image_url?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          front_image_url?: string | null
          id?: string
          profile_id: string
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          back_image_url?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          front_image_url?: string | null
          id?: string
          profile_id?: string
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_matches: {
        Row: {
          created_at: string | null
          draw_back: number | null
          draw_lay: number | null
          event_id: string | null
          id: string
          is_live: boolean | null
          league: string | null
          match_time: string | null
          score1: string | null
          score2: string | null
          sort_order: number | null
          sport: string
          sport_icon: string | null
          status: string | null
          team1: string
          team1_back: number | null
          team1_lay: number | null
          team2: string
          team2_back: number | null
          team2_lay: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          draw_back?: number | null
          draw_lay?: number | null
          event_id?: string | null
          id?: string
          is_live?: boolean | null
          league?: string | null
          match_time?: string | null
          score1?: string | null
          score2?: string | null
          sort_order?: number | null
          sport?: string
          sport_icon?: string | null
          status?: string | null
          team1: string
          team1_back?: number | null
          team1_lay?: number | null
          team2: string
          team2_back?: number | null
          team2_lay?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          draw_back?: number | null
          draw_lay?: number | null
          event_id?: string | null
          id?: string
          is_live?: boolean | null
          league?: string | null
          match_time?: string | null
          score1?: string | null
          score2?: string | null
          sort_order?: number | null
          sport?: string
          sport_icon?: string | null
          status?: string | null
          team1?: string
          team1_back?: number | null
          team1_lay?: number | null
          team2?: string
          team2_back?: number | null
          team2_lay?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_odds: {
        Row: {
          auto_generated: boolean | null
          back_odd: number | null
          created_at: string | null
          event_id: string
          id: string
          is_suspended: boolean | null
          lay_odd: number | null
          match_event: string
          open_date: string | null
          selection: string
          sort_order: number | null
          sport: string
          updated_at: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          back_odd?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          is_suspended?: boolean | null
          lay_odd?: number | null
          match_event: string
          open_date?: string | null
          selection: string
          sort_order?: number | null
          sport?: string
          updated_at?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          back_odd?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_suspended?: boolean | null
          lay_odd?: number | null
          match_event?: string
          open_date?: string | null
          selection?: string
          sort_order?: number | null
          sport?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          holder_name: string | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          label: string | null
          type: string | null
          updated_at: string | null
          upi_id: string | null
          usage_count: number | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          holder_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          label?: string | null
          type?: string | null
          updated_at?: string | null
          upi_id?: string | null
          usage_count?: number | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          holder_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          label?: string | null
          type?: string | null
          updated_at?: string | null
          upi_id?: string | null
          usage_count?: number | null
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
          vip_level: string
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
          vip_level?: string
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
          vip_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          referred_profile_id: string
          referrer_profile_id: string
          type: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          referred_profile_id: string
          referrer_profile_id: string
          type?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          referred_profile_id?: string
          referrer_profile_id?: string
          type?: string | null
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
          status: string | null
          type: string | null
        }
        Insert: {
          agent_profile_id: string
          amount: number
          created_at?: string | null
          id?: string
          note?: string | null
          profile_id: string
          reason: string
          status?: string | null
          type?: string | null
        }
        Update: {
          agent_profile_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          note?: string | null
          profile_id?: string
          reason?: string
          status?: string | null
          type?: string | null
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
          category: string
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      support_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_read_admin: boolean | null
          is_read_user: boolean | null
          priority: string | null
          profile_id: string
          status: string | null
          subject: string
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_read_admin?: boolean | null
          is_read_user?: boolean | null
          priority?: string | null
          profile_id: string
          status?: string | null
          subject: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_read_admin?: boolean | null
          is_read_user?: boolean | null
          priority?: string | null
          profile_id?: string
          status?: string | null
          subject?: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_name: string
          sender_profile_id: string | null
          sender_type: string | null
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_name: string
          sender_profile_id?: string | null
          sender_type?: string | null
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_name?: string
          sender_profile_id?: string | null
          sender_type?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
      get_my_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: { _pid: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_agent_or_above: { Args: never; Returns: boolean }
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
