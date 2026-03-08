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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          payment_amount: number | null
          payment_status: string | null
          service_id: string | null
          status: string | null
          time: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          service_id?: string | null
          status?: string | null
          time: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          service_id?: string | null
          status?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          cedula: string
          created_at: string | null
          email: string | null
          favorite_colors: string | null
          health_alerts: string | null
          id: string
          nail_shape: string | null
          name: string
          notes: string | null
          phone: string
          preferences: string | null
        }
        Insert: {
          cedula: string
          created_at?: string | null
          email?: string | null
          favorite_colors?: string | null
          health_alerts?: string | null
          id?: string
          nail_shape?: string | null
          name: string
          notes?: string | null
          phone: string
          preferences?: string | null
        }
        Update: {
          cedula?: string
          created_at?: string | null
          email?: string | null
          favorite_colors?: string | null
          health_alerts?: string | null
          id?: string
          nail_shape?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preferences?: string | null
        }
        Relationships: []
      }
      custom_schedules: {
        Row: {
          created_at: string | null
          date: string
          hours: Json
          id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          hours?: Json
          id?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          hours?: Json
          id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string | null
          id: string
          sent_count: number | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          sent_count?: number | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          sent_count?: number | null
          title?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          original_price: number | null
          service_id: string | null
          title: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          original_price?: number | null
          service_id?: string | null
          title: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          original_price?: number | null
          service_id?: string | null
          title?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          accent_color: string | null
          business_name: string
          closing_time: string
          cover_image_url: string | null
          created_at: string | null
          feature_tags: Json | null
          id: string
          logo_url: string | null
          manual_hours: Json | null
          opening_time: string
          primary_color: string | null
          reservation_amount: number
          schedule_mode: string | null
          section_colors: Json | null
          time_slot_interval: number | null
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          accent_color?: string | null
          business_name?: string
          closing_time?: string
          cover_image_url?: string | null
          created_at?: string | null
          feature_tags?: Json | null
          id?: string
          logo_url?: string | null
          manual_hours?: Json | null
          opening_time?: string
          primary_color?: string | null
          reservation_amount?: number
          schedule_mode?: string | null
          section_colors?: Json | null
          time_slot_interval?: number | null
          updated_at?: string | null
          whatsapp_number?: string
        }
        Update: {
          accent_color?: string | null
          business_name?: string
          closing_time?: string
          cover_image_url?: string | null
          created_at?: string | null
          feature_tags?: Json | null
          id?: string
          logo_url?: string | null
          manual_hours?: Json | null
          opening_time?: string
          primary_color?: string | null
          reservation_amount?: number
          schedule_mode?: string | null
          section_colors?: Json | null
          time_slot_interval?: number | null
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          type: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          type: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
