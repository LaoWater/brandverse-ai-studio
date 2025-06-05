export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string | null
          id: string
          logo_path: string | null
          mission: string | null
          name: string
          other_info: Json | null
          primary_color_1: string | null
          primary_color_2: string | null
          tone_of_voice: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_path?: string | null
          mission?: string | null
          name: string
          other_info?: Json | null
          primary_color_1?: string | null
          primary_color_2?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_path?: string | null
          mission?: string | null
          name?: string
          other_info?: Json | null
          primary_color_1?: string | null
          primary_color_2?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          company_id: string
          connected: boolean | null
          created_at: string | null
          id: string
          type: Database["public"]["Enums"]["platform_type"]
          updated_at: string | null
        }
        Insert: {
          company_id: string
          connected?: boolean | null
          created_at?: string | null
          id?: string
          type: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          connected?: boolean | null
          created_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["platform_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platforms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          company_id: string
          created_date: string | null
          details: string | null
          has_picture: string | null
          has_video: string | null
          id: string
          platform_type: Database["public"]["Enums"]["platform_type"]
          status: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_date?: string | null
          details?: string | null
          has_picture?: string | null
          has_video?: string | null
          id?: string
          platform_type: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_date?: string | null
          details?: string | null
          has_picture?: string | null
          has_video?: string | null
          id?: string
          platform_type?: Database["public"]["Enums"]["platform_type"]
          status?: Database["public"]["Enums"]["post_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_level: number | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          subscription_expiry_date: string | null
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at: string | null
        }
        Insert: {
          admin_level?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          subscription_expiry_date?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string | null
        }
        Update: {
          admin_level?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_expiry_date?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string | null
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
      platform_type:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "twitter"
        | "tiktok"
      post_status: "draft" | "approved" | "posted"
      subscription_type: "free" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      platform_type: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      post_status: ["draft", "approved", "posted"],
      subscription_type: ["free", "pro", "enterprise"],
    },
  },
} as const
