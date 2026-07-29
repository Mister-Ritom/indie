// ⚠️  AUTO-GENERATED — do not edit manually.
// Regenerate with: supabase gen types typescript --project-id huqnhvsuliyjiplgdkmd
// (or via the Supabase MCP tool: generate_typescript_types)

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
      boards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          created_at: string | null
          id: string
          pin_id: string
          processed_for_scores: boolean
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_id: string
          processed_for_scores?: boolean
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_id?: string
          processed_for_scores?: boolean
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          processed_for_scores: boolean
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          processed_for_scores?: boolean
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          processed_for_scores?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          cover_image_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          cover_image_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          cover_image_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          pin_id: string
          processed_for_scores: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          pin_id: string
          processed_for_scores?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          pin_id?: string
          processed_for_scores?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          pin_id: string | null
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          pin_id?: string | null
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          pin_id?: string | null
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_deletions: {
        Row: {
          requested_at: string
          scheduled_at: string
          user_id: string
        }
        Insert: {
          requested_at?: string
          scheduled_at?: string
          user_id: string
        }
        Update: {
          requested_at?: string
          scheduled_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pin_assets: {
        Row: {
          created_at: string | null
          height: number
          id: string
          pin_id: string
          url: string
          variant: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          height: number
          id?: string
          pin_id: string
          url: string
          variant?: string | null
          width: number
        }
        Update: {
          created_at?: string | null
          height?: number
          id?: string
          pin_id?: string
          url?: string
          variant?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "pin_assets_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          pin_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          pin_id: string
          reason: string
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          pin_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_reports_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_views: {
        Row: {
          pin_id: string
          processed_for_scores: boolean
          updated_at: string
          user_id: string
          view_count: number
          viewed_at: string
        }
        Insert: {
          pin_id: string
          processed_for_scores?: boolean
          updated_at?: string
          user_id: string
          view_count?: number
          viewed_at?: string
        }
        Update: {
          pin_id?: string
          processed_for_scores?: boolean
          updated_at?: string
          user_id?: string
          view_count?: number
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_views_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          ai_labels: Json | null
          alt_text: string | null
          board_id: string | null
          created_at: string | null
          description: string | null
          dominant_color: string | null
          height: number | null
          id: string
          interest_id: string | null
          link: string | null
          media_type: string
          title: string | null
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          ai_labels?: Json | null
          alt_text?: string | null
          board_id?: string | null
          created_at?: string | null
          description?: string | null
          dominant_color?: string | null
          height?: number | null
          id?: string
          interest_id?: string | null
          link?: string | null
          media_type: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          ai_labels?: Json | null
          alt_text?: string | null
          board_id?: string | null
          created_at?: string | null
          description?: string | null
          dominant_color?: string | null
          height?: number | null
          id?: string
          interest_id?: string | null
          link?: string | null
          media_type?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pins_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          all_saves_private: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          username: string
          website: string | null
        }
        Insert: {
          all_saves_private?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          username: string
          website?: string | null
        }
        Update: {
          all_saves_private?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      saves: {
        Row: {
          board_id: string | null
          created_at: string | null
          pin_id: string
          processed_for_scores: boolean
          user_id: string
        }
        Insert: {
          board_id?: string | null
          created_at?: string | null
          pin_id: string
          processed_for_scores?: boolean
          user_id: string
        }
        Update: {
          board_id?: string | null
          created_at?: string | null
          pin_id?: string
          processed_for_scores?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interest_scores: {
        Row: {
          label: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          label: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          label?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interest_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string | null
          interest_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          interest_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          interest_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
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
      cancel_account_deletion: { Args: never; Returns: Json }
      get_discovery_carousel_pins: {
        Args: { page_limit: number; viewer_id: string }
        Returns: { id: string; score: number }[]
      }
      get_discovery_ideas_pins: {
        Args: { page_limit: number; page_offset: number; viewer_id: string }
        Returns: { id: string; score: number }[]
      }
      get_featured_boards: {
        Args: { page_limit: number; viewer_id: string }
        Returns: { id: string; score: number }[]
      }
      get_feed_pins: {
        Args: { page_limit: number; page_offset: number; viewer_id: string }
        Returns: { id: string; score: number }[]
      }
      process_pending_deletions: { Args: never; Returns: Json }
      request_account_deletion: { Args: never; Returns: Json }
      update_user_interest_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      notification_type: "like" | "comment" | "follow"
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
      notification_type: ["like", "comment", "follow"],
    },
  },
} as const

// ─── Domain types (enriched rows used by UI) ────────────────────────────────

export type MediaType = "image" | "gif";
export type PinVariant = "original" | "2160" | "1440" | "720" | "360" | "thumb";

export interface AiLabel {
  label: string;
  score: number;
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Interest = Database["public"]["Tables"]["interests"]["Row"];
export type UserInterest = Database["public"]["Tables"]["user_interests"]["Row"];
export type Board = Database["public"]["Tables"]["boards"]["Row"];
export type Pin = Database["public"]["Tables"]["pins"]["Row"];
export type PinAsset = Database["public"]["Tables"]["pin_assets"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Save = Database["public"]["Tables"]["saves"]["Row"];
export type PinView = Database["public"]["Tables"]["pin_views"]["Row"];
export type UserInterestScore = Database["public"]["Tables"]["user_interest_scores"]["Row"];
export type PendingDeletion = Database["public"]["Tables"]["pending_deletions"]["Row"];
export type UserBlock = Database["public"]["Tables"]["user_blocks"]["Row"];
export type PinReport = Database["public"]["Tables"]["pin_reports"]["Row"];
export type UserReport = Database["public"]["Tables"]["user_reports"]["Row"];

export interface FeedPin extends Pin {
  profile: Pick<Profile, "id" | "username" | "avatar_url" | "full_name">;
  assets: PinAsset[];
  likes_count: number;
  saves_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  board?: Pick<Board, "id" | "name"> | null;
  interest?: Pick<Interest, "id" | "name" | "slug"> | null;
}

export interface PinDetail extends FeedPin {
  comments: (Comment & {
    profile: Pick<Profile, "id" | "username" | "avatar_url">;
  })[];
  related_pins: FeedPin[];
}

export interface BoardWithPins extends Board {
  profile: Pick<Profile, "id" | "username" | "avatar_url" | "full_name">;
  pins: FeedPin[];
  pins_count: number;
}

export interface ProfileWithStats extends Profile {
  pins_count: number;
  followers_count: number;
  following_count: number;
  boards_count: number;
  is_following: boolean;
}

export type NotificationType = "like" | "comment" | "follow";

export interface Notification {
  id: string;
  type: NotificationType;
  actor: Pick<Profile, "id" | "username" | "avatar_url">;
  pin?: Pick<Pin, "id" | "title" | "dominant_color"> & { thumb_url?: string };
  created_at: string;
  read: boolean;
}
