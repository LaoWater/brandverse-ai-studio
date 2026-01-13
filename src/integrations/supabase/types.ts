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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      available_credits: {
        Row: {
          available_credits: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credits?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credits?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      image_control: {
        Row: {
          caption_guidance: string | null
          company_id: string
          created_at: string
          enabled: boolean
          id: string
          image_ratio: string | null
          image_style: string | null
          level: number
          platform_type: Database["public"]["Enums"]["platform_type"] | null
          starting_image_url: string | null
          updated_at: string
          user_id: string
          visual_guidance: string | null
        }
        Insert: {
          caption_guidance?: string | null
          company_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          image_ratio?: string | null
          image_style?: string | null
          level: number
          platform_type?: Database["public"]["Enums"]["platform_type"] | null
          starting_image_url?: string | null
          updated_at?: string
          user_id: string
          visual_guidance?: string | null
        }
        Update: {
          caption_guidance?: string | null
          company_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          image_ratio?: string | null
          image_style?: string | null
          level?: number
          platform_type?: Database["public"]["Enums"]["platform_type"] | null
          starting_image_url?: string | null
          updated_at?: string
          user_id?: string
          visual_guidance?: string | null
        }
        Relationships: []
      }
      influencer_profiles: {
        Row: {
          bio: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          secret_code: string | null
          social_links: Json | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          secret_code?: string | null
          social_links?: Json | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          secret_code?: string | null
          social_links?: Json | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_secret_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_secret_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          aspect_ratio: string | null
          company_id: string | null
          created_at: string | null
          custom_title: string | null
          download_count: number | null
          duration: number | null
          file_format: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          is_favorite: boolean | null
          model_used: string
          notes: string | null
          prompt: string
          public_url: string
          quality: string | null
          reference_image_url: string | null
          storage_path: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          company_id?: string | null
          created_at?: string | null
          custom_title?: string | null
          download_count?: number | null
          duration?: number | null
          file_format: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          is_favorite?: boolean | null
          model_used: string
          notes?: string | null
          prompt: string
          public_url: string
          quality?: string | null
          reference_image_url?: string | null
          storage_path: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          company_id?: string | null
          created_at?: string | null
          custom_title?: string | null
          download_count?: number | null
          duration?: number | null
          file_format?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_favorite?: boolean | null
          model_used?: string
          notes?: string | null
          prompt?: string
          public_url?: string
          quality?: string | null
          reference_image_url?: string | null
          storage_path?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      purchase_history: {
        Row: {
          amount_paid: number | null
          created_at: string
          credits_purchased: number
          id: number
          purchase_type: Database["public"]["Enums"]["purchase_type_enum"]
          stripe_price_id: string | null
          stripe_session_id: string
          subscription_plan: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          credits_purchased?: number
          id?: number
          purchase_type: Database["public"]["Enums"]["purchase_type_enum"]
          stripe_price_id?: string | null
          stripe_session_id: string
          subscription_plan?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          credits_purchased?: number
          id?: number
          purchase_type?: Database["public"]["Enums"]["purchase_type_enum"]
          stripe_price_id?: string | null
          stripe_session_id?: string
          subscription_plan?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seo_analysis: {
        Row: {
          analysis_result: Json
          buyer_persona: Json | null
          company_id: string
          competitors: string[] | null
          created_at: string | null
          credits_used: number | null
          error_message: string | null
          id: string
          keywords: string[] | null
          platform_scores: Json | null
          recommendations: Json | null
          status: string
          target_audience: string | null
          updated_at: string | null
          user_id: string
          visibility_score: number | null
        }
        Insert: {
          analysis_result?: Json
          buyer_persona?: Json | null
          company_id: string
          competitors?: string[] | null
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          id?: string
          keywords?: string[] | null
          platform_scores?: Json | null
          recommendations?: Json | null
          status?: string
          target_audience?: string | null
          updated_at?: string | null
          user_id: string
          visibility_score?: number | null
        }
        Update: {
          analysis_result?: Json
          buyer_persona?: Json | null
          company_id?: string
          competitors?: string[] | null
          created_at?: string | null
          credits_used?: number | null
          error_message?: string | null
          id?: string
          keywords?: string[] | null
          platform_scores?: Json | null
          recommendations?: Json | null
          status?: string
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_blog_posts: {
        Row: {
          analysis_id: string | null
          company_id: string
          content: string
          created_at: string | null
          credits_used: number | null
          excerpt: string | null
          id: string
          reading_time_minutes: number | null
          seo_meta: Json | null
          status: string
          target_keywords: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          analysis_id?: string | null
          company_id: string
          content: string
          created_at?: string | null
          credits_used?: number | null
          excerpt?: string | null
          id?: string
          reading_time_minutes?: number | null
          seo_meta?: Json | null
          status?: string
          target_keywords?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          analysis_id?: string | null
          company_id?: string
          content?: string
          created_at?: string | null
          credits_used?: number | null
          excerpt?: string | null
          id?: string
          reading_time_minutes?: number | null
          seo_meta?: Json | null
          status?: string
          target_keywords?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_blog_posts_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "seo_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_blog_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_engagement_opportunities: {
        Row: {
          analysis_id: string | null
          company_id: string
          created_at: string | null
          discovered_at: string | null
          id: string
          platform: string
          relevance_score: number | null
          response_reasoning: string | null
          source_content: string | null
          source_title: string | null
          source_url: string | null
          status: string
          suggested_response: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          analysis_id?: string | null
          company_id: string
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          platform: string
          relevance_score?: number | null
          response_reasoning?: string | null
          source_content?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string
          suggested_response?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          analysis_id?: string | null
          company_id?: string
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          platform?: string
          relevance_score?: number | null
          response_reasoning?: string | null
          source_content?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string
          suggested_response?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_engagement_opportunities_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "seo_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_engagement_opportunities_company_id_fkey"
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
          last_credit_pack_purchased:
            | Database["public"]["Enums"]["credit_pack_type"]
            | null
          referred_by: string | null
          subscription_expiry_date: string | null
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          type: Database["public"]["Enums"]["user_type"] | null
          updated_at: string | null
        }
        Insert: {
          admin_level?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_credit_pack_purchased?:
            | Database["public"]["Enums"]["credit_pack_type"]
            | null
          referred_by?: string | null
          subscription_expiry_date?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          type?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string | null
        }
        Update: {
          admin_level?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_credit_pack_purchased?:
            | Database["public"]["Enums"]["credit_pack_type"]
            | null
          referred_by?: string | null
          subscription_expiry_date?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          type?: Database["public"]["Enums"]["user_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: { _credits_to_deduct: number; _user_id: string }
        Returns: boolean
      }
      get_trending_media_tags: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          tag: string
          usage_count: number
        }[]
      }
      get_user_media_storage_usage: {
        Args: { p_user_id: string }
        Returns: {
          image_count: number
          total_files: number
          total_size_mb: number
          video_count: number
        }[]
      }
      increment_media_download_count: {
        Args: { media_id: string }
        Returns: boolean
      }
      increment_media_view_count: {
        Args: { media_id: string }
        Returns: boolean
      }
      reset_daily_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      credit_pack_type: "starter" | "launch" | "scale" | "studio"
      platform_type:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "twitter"
        | "tiktok"
      post_status: "draft" | "approved" | "posted"
      purchase_type_enum: "subscription" | "credit_pack"
      subscription_type: "free" | "standard" | "pro"
      user_type: "client" | "influencer"
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
      credit_pack_type: ["starter", "launch", "scale", "studio"],
      platform_type: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
      post_status: ["draft", "approved", "posted"],
      purchase_type_enum: ["subscription", "credit_pack"],
      subscription_type: ["free", "standard", "pro"],
      user_type: ["client", "influencer"],
    },
  },
} as const
