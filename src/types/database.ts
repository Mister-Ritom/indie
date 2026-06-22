// Full TypeScript types matching the Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MediaType = 'image' | 'gif';
export type PinVariant = 'original' | '2160' | '1440' | '720' | '360' | 'thumb';

export interface AiLabel {
  label: string;
  score: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };
      interests: {
        Row: {
          id: string;
          name: string;
          slug: string;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          cover_image_url?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          cover_image_url?: string | null;
        };
      };
      user_interests: {
        Row: {
          user_id: string;
          interest_id: string;
          weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          interest_id: string;
          weight?: number;
        };
        Update: {
          weight?: number;
        };
      };
      boards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_image_url: string | null;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_private?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_private?: boolean;
          updated_at?: string;
        };
      };
      pins: {
        Row: {
          id: string;
          user_id: string;
          board_id: string | null;
          interest_id: string | null;
          title: string;
          description: string | null;
          link: string | null;
          alt_text: string | null;
          media_type: MediaType;
          width: number | null;
          height: number | null;
          ai_labels: AiLabel[] | null;
          dominant_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id?: string | null;
          interest_id?: string | null;
          title: string;
          description?: string | null;
          link?: string | null;
          alt_text?: string | null;
          media_type?: MediaType;
          width?: number | null;
          height?: number | null;
          ai_labels?: AiLabel[] | null;
          dominant_color?: string | null;
        };
        Update: {
          board_id?: string | null;
          interest_id?: string | null;
          title?: string;
          description?: string | null;
          link?: string | null;
          alt_text?: string | null;
          ai_labels?: AiLabel[] | null;
          dominant_color?: string | null;
          updated_at?: string;
        };
      };
      pin_assets: {
        Row: {
          id: string;
          pin_id: string;
          variant: PinVariant;
          url: string;
          width: number | null;
          height: number | null;
          format: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pin_id: string;
          variant: PinVariant;
          url: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
        };
        Update: {
          url?: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
        };
      };
      likes: {
        Row: {
          user_id: string;
          pin_id: string;
          processed_for_scores: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pin_id: string;
          processed_for_scores?: boolean;
        };
        Update: {
          processed_for_scores?: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          pin_id: string;
          user_id: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pin_id: string;
          user_id: string;
          text: string;
        };
        Update: {
          text?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          processed_for_scores: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          processed_for_scores?: boolean;
        };
        Update: {
          processed_for_scores?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: 'like' | 'comment' | 'follow';
          pin_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: 'like' | 'comment' | 'follow';
          pin_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      saves: {
        Row: {
          user_id: string;
          pin_id: string;
          board_id: string | null;
          processed_for_scores: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pin_id: string;
          board_id?: string | null;
          processed_for_scores?: boolean;
        };
        Update: {
          board_id?: string | null;
          processed_for_scores?: boolean;
        };
      };
      pin_views: {
        Row: {
          user_id: string;
          pin_id: string;
          processed_for_scores: boolean;
          viewed_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pin_id: string;
          processed_for_scores?: boolean;
          viewed_at?: string;
        };
        Update: {
          processed_for_scores?: boolean;
        };
      };
      user_interest_scores: {
        Row: {
          user_id: string;
          label: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          label: string;
          score?: number;
        };
        Update: {
          score?: number;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_feed_pins: {
        Args: {
          viewer_id: string;
          page_limit: number;
          page_offset: number;
        };
        Returns: { id: string; score: number }[];
      };
      get_discovery_carousel_pins: {
        Args: {
          viewer_id: string;
          page_limit: number;
        };
        Returns: { id: string; score: number }[];
      };
      get_featured_boards: {
        Args: {
          viewer_id: string;
          page_limit: number;
        };
        Returns: { id: string; score: number }[];
      };
      get_discovery_ideas_pins: {
        Args: {
          viewer_id: string;
          page_limit: number;
          page_offset: number;
        };
        Returns: { id: string; score: number }[];
      };
    };
    Enums: Record<string, never>;
  };
}

// Domain types (enriched rows used by UI)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Interest = Database['public']['Tables']['interests']['Row'];
export type UserInterest = Database['public']['Tables']['user_interests']['Row'];
export type Board = Database['public']['Tables']['boards']['Row'];
export type Pin = Database['public']['Tables']['pins']['Row'];
export type PinAsset = Database['public']['Tables']['pin_assets']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type Save = Database['public']['Tables']['saves']['Row'];
export type PinView = Database['public']['Tables']['pin_views']['Row'];
export type UserInterestScore = Database['public']['Tables']['user_interest_scores']['Row'];

export interface FeedPin extends Pin {
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  assets: PinAsset[];
  likes_count: number;
  saves_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  board?: Pick<Board, 'id' | 'name'> | null;
  interest?: Pick<Interest, 'id' | 'name' | 'slug'> | null;
}

export interface PinDetail extends FeedPin {
  comments: (Comment & {
    profile: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  })[];
  related_pins: FeedPin[];
}

export interface BoardWithPins extends Board {
  profile: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
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

export type NotificationType = 'like' | 'comment' | 'follow';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  pin?: Pick<Pin, 'id' | 'title' | 'dominant_color'> & { thumb_url?: string };
  created_at: string;
  read: boolean;
}
