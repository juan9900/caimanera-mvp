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
      courts: {
        Row: {
          added_by: string
          contact_phone: string | null
          created_at: string
          id: string
          is_official: boolean
          lat: number
          lng: number
          name: string
          photos: string[] | null
          schedule: string | null
        }
        Insert: {
          added_by: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          lat: number
          lng: number
          name: string
          photos?: string[] | null
          schedule?: string | null
        }
        Update: {
          added_by?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          lat?: number
          lng?: number
          name?: string
          photos?: string[] | null
          schedule?: string | null
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
          organizer_id: string
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
          organizer_id: string
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
          organizer_id?: string
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
      is_admin: { Args: never; Returns: boolean }
      is_direct_network: {
        Args: { candidate: string; organizer: string }
        Returns: boolean
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
      user_is_confirmed_in_match: {
        Args: { p_match_id: string }
        Returns: boolean
      }
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
      joined_via_type: "red_directa" | "externo"
      match_status: "abierto" | "completo" | "cancelado"
      participant_status: "confirmado" | "pendiente" | "rechazado"
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
      joined_via_type: ["red_directa", "externo"],
      match_status: ["abierto", "completo", "cancelado"],
      participant_status: ["confirmado", "pendiente", "rechazado"],
      vibe_type: ["relajado", "competitivo"],
    },
  },
} as const
