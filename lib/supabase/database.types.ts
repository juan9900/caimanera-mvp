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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      court_events: {
        Row: {
          court_id: string
          created_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          court_id: string
          created_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          court_id?: string
          created_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_events_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          added_by: string
          address: string | null
          amenities: string[]
          booking_url: string | null
          closes_at: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_official: boolean
          lat: number
          lng: number
          logo_url: string | null
          name: string
          open_days: number[]
          opens_at: string | null
          photos: string[] | null
          promo_code: string | null
          promo_expires_at: string | null
          promo_text: string | null
          schedule: string | null
          sponsor_priority: number
          sponsored_until: string | null
          sports: string[]
          whatsapp_url: string | null
        }
        Insert: {
          added_by: string
          address?: string | null
          amenities?: string[]
          booking_url?: string | null
          closes_at?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          lat: number
          lng: number
          logo_url?: string | null
          name: string
          open_days?: number[]
          opens_at?: string | null
          photos?: string[] | null
          promo_code?: string | null
          promo_expires_at?: string | null
          promo_text?: string | null
          schedule?: string | null
          sponsor_priority?: number
          sponsored_until?: string | null
          sports?: string[]
          whatsapp_url?: string | null
        }
        Update: {
          added_by?: string
          address?: string | null
          amenities?: string[]
          booking_url?: string | null
          closes_at?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          lat?: number
          lng?: number
          logo_url?: string | null
          name?: string
          open_days?: number[]
          opens_at?: string | null
          photos?: string[] | null
          promo_code?: string | null
          promo_expires_at?: string | null
          promo_text?: string | null
          schedule?: string | null
          sponsor_priority?: number
          sponsored_until?: string | null
          sports?: string[]
          whatsapp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courts_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["friendship_status"]
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          inviter_id: string | null
          joined_at: string | null
          status: Database["public"]["Enums"]["group_member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          inviter_id?: string | null
          joined_at?: string | null
          status?: Database["public"]["Enums"]["group_member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          inviter_id?: string | null
          joined_at?: string | null
          status?: Database["public"]["Enums"]["group_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          invite_token: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          created_at: string
          id: string
          joined_via: Database["public"]["Enums"]["joined_via_type"]
          match_id: string
          status: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_via: Database["public"]["Enums"]["joined_via_type"]
          match_id: string
          status?: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_via?: Database["public"]["Enums"]["joined_via_type"]
          match_id?: string
          status?: Database["public"]["Enums"]["participant_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court_id: string
          created_at: string
          datetime: string
          id: string
          is_public: boolean
          organizer_id: string
          payment_amount_bs: number | null
          payment_bank: string | null
          payment_cedula: string | null
          payment_phone: string | null
          reopened_at: string | null
          slots_filled: number
          sport: string
          status: Database["public"]["Enums"]["match_status"]
          total_slots: number
          vibe: Database["public"]["Enums"]["vibe_type"]
        }
        Insert: {
          court_id: string
          created_at?: string
          datetime: string
          id?: string
          is_public?: boolean
          organizer_id: string
          payment_amount_bs?: number | null
          payment_bank?: string | null
          payment_cedula?: string | null
          payment_phone?: string | null
          reopened_at?: string | null
          slots_filled?: number
          sport: string
          status?: Database["public"]["Enums"]["match_status"]
          total_slots: number
          vibe: Database["public"]["Enums"]["vibe_type"]
        }
        Update: {
          court_id?: string
          created_at?: string
          datetime?: string
          id?: string
          is_public?: boolean
          organizer_id?: string
          payment_amount_bs?: number | null
          payment_bank?: string | null
          payment_cedula?: string | null
          payment_phone?: string | null
          reopened_at?: string | null
          slots_filled?: number
          sport?: string
          status?: Database["public"]["Enums"]["match_status"]
          total_slots?: number
          vibe?: Database["public"]["Enums"]["vibe_type"]
        }
        Relationships: [
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_admin: boolean
          location_label: string | null
          location_lat: number | null
          location_lng: number | null
          name: string | null
          notification_scopes: string[]
          phone: string | null
          photo_url: string | null
          referral_code: string
          sport_preferences: string[]
          vibe: Database["public"]["Enums"]["vibe_type"]
          zone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          invited_by?: string | null
          is_admin?: boolean
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string | null
          notification_scopes?: string[]
          phone?: string | null
          photo_url?: string | null
          referral_code?: string
          sport_preferences?: string[]
          vibe?: Database["public"]["Enums"]["vibe_type"]
          zone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_admin?: boolean
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string | null
          notification_scopes?: string[]
          phone?: string | null
          photo_url?: string | null
          referral_code?: string
          sport_preferences?: string[]
          vibe?: Database["public"]["Enums"]["vibe_type"]
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      group_preview_by_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          member_count: number
          name: string
          owner_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_direct_network: {
        Args: { candidate: string; organizer: string }
        Returns: boolean
      }
      join_group_by_token: { Args: { p_token: string }; Returns: string }
      log_court_event: {
        Args: { p_court_id: string; p_type: string }
        Returns: undefined
      }
      resolve_audience_subscriptions: {
        Args: { p_match_id: string; p_scope: string }
        Returns: {
          auth: string
          endpoint: string
          p256dh: string
          subscription_id: string
        }[]
      }
      user_has_group_row: { Args: { p_group_id: string }; Returns: boolean }
      user_is_confirmed_in_match: {
        Args: { p_match_id: string }
        Returns: boolean
      }
      user_is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      user_is_group_owner: { Args: { p_group_id: string }; Returns: boolean }
      user_is_match_organizer: {
        Args: { p_match_id: string }
        Returns: boolean
      }
      user_is_match_participant: {
        Args: { p_match_id: string }
        Returns: boolean
      }
    }
    Enums: {
      friendship_status: "pendiente" | "aceptada" | "rechazada"
      group_member_status: "invitado" | "miembro"
      joined_via_type: "red_directa" | "externo"
      match_status: "abierto" | "completo" | "cancelado" | "vencido"
      participant_status: "confirmado" | "pendiente" | "rechazado" | "invitado"
      vibe_type: "relajado" | "competitivo"
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
      friendship_status: ["pendiente", "aceptada", "rechazada"],
      group_member_status: ["invitado", "miembro"],
      joined_via_type: ["red_directa", "externo"],
      match_status: ["abierto", "completo", "cancelado", "vencido"],
      participant_status: ["confirmado", "pendiente", "rechazado", "invitado"],
      vibe_type: ["relajado", "competitivo"],
    },
  },
} as const
