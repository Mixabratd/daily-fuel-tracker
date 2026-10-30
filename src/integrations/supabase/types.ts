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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      food_log_entries: {
        Row: {
          barcode: string | null
          brand: string | null
          carbs_per_100g: number
          created_at: string
          date: string
          fat_per_100g: number
          fiber_per_100g: number | null
          grams: number
          id: string
          kcal_per_100g: number
          meal: string
          name: string
          protein_per_100g: number
          sodium_per_100g: number | null
          source: string
          sugar_per_100g: number | null
          total_carbs: number
          total_fat: number
          total_kcal: number
          total_protein: number
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          carbs_per_100g?: number
          created_at?: string
          date: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          grams?: number
          id?: string
          kcal_per_100g?: number
          meal: string
          name: string
          protein_per_100g?: number
          sodium_per_100g?: number | null
          source?: string
          sugar_per_100g?: number | null
          total_carbs?: number
          total_fat?: number
          total_kcal?: number
          total_protein?: number
          user_id?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          carbs_per_100g?: number
          created_at?: string
          date?: string
          fat_per_100g?: number
          fiber_per_100g?: number | null
          grams?: number
          id?: string
          kcal_per_100g?: number
          meal?: string
          name?: string
          protein_per_100g?: number
          sodium_per_100g?: number | null
          source?: string
          sugar_per_100g?: number | null
          total_carbs?: number
          total_fat?: number
          total_kcal?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          activity: string
          age: number
          aims: string[]
          birth_date: string | null
          created_at: string
          diet: string | null
          goal: string
          height_cm: number
          name: string
          obstacles: string[]
          onboarding_completed: boolean
          pace_kg: number | null
          sex: string
          target_calories: number
          target_carbs: number
          target_fat: number
          target_protein: number
          target_weight_kg: number | null
          units: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          activity?: string
          age?: number
          aims?: string[]
          birth_date?: string | null
          created_at?: string
          diet?: string | null
          goal?: string
          height_cm?: number
          name?: string
          obstacles?: string[]
          onboarding_completed?: boolean
          pace_kg?: number | null
          sex?: string
          target_calories?: number
          target_carbs?: number
          target_fat?: number
          target_protein?: number
          target_weight_kg?: number | null
          units?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Update: {
          activity?: string
          age?: number
          aims?: string[]
          birth_date?: string | null
          created_at?: string
          diet?: string | null
          goal?: string
          height_cm?: number
          name?: string
          obstacles?: string[]
          onboarding_completed?: boolean
          pace_kg?: number | null
          sex?: string
          target_calories?: number
          target_carbs?: number
          target_fat?: number
          target_protein?: number
          target_weight_kg?: number | null
          units?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          user_id?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
