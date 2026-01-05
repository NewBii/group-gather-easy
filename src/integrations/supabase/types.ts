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
      activities: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          suggested_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          suggested_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          suggested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_votes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          participant_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          participant_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          participant_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_votes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_scenarios: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          metadata: Json | null
          scenario_label: string
          suggested_date: string | null
          suggested_time_of_day: string | null
          suggested_vibe: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          scenario_label: string
          suggested_date?: string | null
          suggested_time_of_day?: string | null
          suggested_vibe?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          scenario_label?: string
          suggested_date?: string | null
          suggested_time_of_day?: string | null
          suggested_vibe?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_scenarios_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      date_options: {
        Row: {
          created_at: string
          end_date: string | null
          event_id: string
          id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          event_id: string
          id?: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          event_id?: string
          id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      date_votes: {
        Row: {
          created_at: string
          date_option_id: string
          id: string
          participant_id: string
          updated_at: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          date_option_id: string
          id?: string
          participant_id: string
          updated_at?: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          date_option_id?: string
          id?: string
          participant_id?: string
          updated_at?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "date_votes_date_option_id_fkey"
            columns: ["date_option_id"]
            isOneToOne: false
            referencedRelation: "date_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          is_completed: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_completed?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_completed?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          ai_phase: string | null
          created_at: string
          created_by: string | null
          date_range_end: string | null
          date_range_start: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          final_date: string | null
          final_location: Json | null
          id: string
          location_data: Json | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          organization_mode: string | null
          spark_prompt: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          unique_slug: string
          updated_at: string
        }
        Insert: {
          ai_phase?: string | null
          created_at?: string
          created_by?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          final_date?: string | null
          final_location?: Json | null
          id?: string
          location_data?: Json | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          organization_mode?: string | null
          spark_prompt?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          unique_slug: string
          updated_at?: string
        }
        Update: {
          ai_phase?: string | null
          created_at?: string
          created_by?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          final_date?: string | null
          final_location?: Json | null
          id?: string
          location_data?: Json | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          organization_mode?: string | null
          spark_prompt?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          unique_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_article_translations: {
        Row: {
          article_id: string
          content: string
          excerpt: string | null
          id: string
          language: string
          meta_description: string | null
          meta_title: string | null
          title: string
        }
        Insert: {
          article_id: string
          content: string
          excerpt?: string | null
          id?: string
          language: string
          meta_description?: string | null
          meta_title?: string | null
          title: string
        }
        Update: {
          article_id?: string
          content?: string
          excerpt?: string | null
          id?: string
          language?: string
          meta_description?: string | null
          meta_title?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "guide_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_articles: {
        Row: {
          category_id: string
          cover_image_url: string | null
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          reading_time_minutes: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "guide_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      guide_category_translations: {
        Row: {
          category_id: string
          description: string | null
          id: string
          language: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          language: string
          name: string
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          language?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "guide_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      location_suggestions: {
        Row: {
          address: string | null
          created_at: string
          event_id: string
          id: string
          name: string
          suggested_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          event_id: string
          id?: string
          name: string
          suggested_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          suggested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_suggestions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_suggestions_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      location_votes: {
        Row: {
          created_at: string
          id: string
          location_suggestion_id: string
          participant_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          location_suggestion_id: string
          participant_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          id?: string
          location_suggestion_id?: string
          participant_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "location_votes_location_suggestion_id_fkey"
            columns: ["location_suggestion_id"]
            isOneToOne: false
            referencedRelation: "location_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          id: string
          is_organizer: boolean
          location_lat: number | null
          location_lng: number | null
          name: string
          transport_mode: Database["public"]["Enums"]["transport_mode"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          is_organizer?: boolean
          location_lat?: number | null
          location_lng?: number | null
          name: string
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          is_organizer?: boolean
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          transport_mode?: Database["public"]["Enums"]["transport_mode"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language_preference: string | null
          notification_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          notification_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          notification_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenario_votes: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_dealbreaker: boolean | null
          participant_id: string
          rank: number | null
          scenario_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_dealbreaker?: boolean | null
          participant_id: string
          rank?: number | null
          scenario_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_dealbreaker?: boolean | null
          participant_id?: string
          rank?: number | null
          scenario_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_votes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "ai_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      is_participant_of_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      owns_participant: { Args: { p_participant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      event_status: "draft" | "active" | "completed" | "cancelled"
      event_type: "day_event" | "trip"
      location_type: "set_venues" | "suggestions" | "fair_spot"
      transport_mode: "car" | "public_transit" | "bike" | "walk"
      vote_type: "yes" | "no" | "maybe"
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
      app_role: ["admin", "moderator", "user"],
      event_status: ["draft", "active", "completed", "cancelled"],
      event_type: ["day_event", "trip"],
      location_type: ["set_venues", "suggestions", "fair_spot"],
      transport_mode: ["car", "public_transit", "bike", "walk"],
      vote_type: ["yes", "no", "maybe"],
    },
  },
} as const
