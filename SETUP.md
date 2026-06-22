# Indie App Setup

Follow these instructions to deploy the backend on Supabase and start your application.

## 1. Supabase Project Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> API** and copy your `Project URL` and `anon public` key.
3. Create a `.env.local` file in the root of the React Native app:

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 2. SQL Schema & Triggers

Run the following SQL in the **SQL Editor** in your Supabase dashboard. It sets up tables, RLS policies, and the pg_cron trigger for feed recommendations.

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create tables
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cover_image_url TEXT
);

-- Seed some default interests
INSERT INTO interests (name, slug, cover_image_url) VALUES 
('Photography', 'photography', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000'),
('UI Design', 'ui-design', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000'),
('Architecture', 'architecture', 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&q=80&w=1000'),
('Illustration', 'illustration', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'),
('Typography', 'typography', 'https://images.unsplash.com/photo-1564347288827-3e4293543e07?auto=format&fit=crop&q=80&w=1000'),
('Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1000'),
('Travel', 'travel', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000'),
('Food & Drink', 'food-drink', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'),
('Quotes', 'quotes', 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1000'),
('Memes', 'memes', 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&q=80&w=1000'),
('Gaming', 'gaming', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1000'),
('Music', 'music', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1000'),
('Anime', 'anime', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1000'),
('Cars & Motorcycles', 'cars', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000'),
('Fitness & Health', 'fitness', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000'),
('Art & Painting', 'art', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1000'),
('DIY & Crafts', 'diy', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1000'),
('Animals & Pets', 'animals', 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=1000'),
('Nature & Outdoors', 'nature', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000'),
('Home Decor', 'home-decor', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000'),
('Beauty & Makeup', 'beauty', 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1000'),
('Tattoos', 'tattoos', 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&q=80&w=1000'),
('Graphic Design', 'graphic-design', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1000'),
('3D Art', '3d-art', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'),
('Movies & TV', 'movies', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1000');

CREATE TABLE user_interests (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
    interest_id UUID REFERENCES interests(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT,
    link TEXT,
    alt_text TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'gif', 'video')) NOT NULL,
    dominant_color TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pin_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    variant TEXT CHECK (variant IN ('original', '2160', '1440', '720', '360', 'thumb')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE likes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, pin_id)
);

CREATE TABLE saves (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, pin_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE pin_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for anonymous views
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User interests are viewable by everyone" ON user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage their interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public boards are viewable by everyone" ON boards FOR SELECT USING (is_private = false OR auth.uid() = user_id);
CREATE POLICY "Users can manage their boards" ON boards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pins are viewable by everyone" ON pins FOR SELECT USING (true);
CREATE POLICY "Users can create pins" ON pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON pins FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE pin_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assets are viewable by everyone" ON pin_assets FOR SELECT USING (true);
-- In production, restrict inserts to edge functions or service role

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saves are viewable by everyone" ON saves FOR SELECT USING (true);
CREATE POLICY "Users can manage their saves" ON saves FOR ALL USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON follows FOR ALL USING (auth.uid() = follower_id);

ALTER TABLE pin_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create views" ON pin_views FOR INSERT WITH CHECK (true);
-- Views are internal, no select policy needed for public

-- Create Feed RPC
CREATE OR REPLACE FUNCTION get_feed_pins(viewer_id UUID, page_limit INT, page_offset INT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    board_id UUID,
    interest_id UUID,
    title TEXT,
    description TEXT,
    link TEXT,
    alt_text TEXT,
    media_type TEXT,
    dominant_color TEXT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ,
    score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.user_id, p.board_id, p.interest_id, p.title, p.description, p.link, 
        p.alt_text, p.media_type, p.dominant_color, p.width, p.height, p.created_at,
        COALESCE(ui.weight, 0.1) * (1.0 / EXTRACT(EPOCH FROM (NOW() - p.created_at) + INTERVAL '1 hour')) AS score
    FROM pins p
    LEFT JOIN user_interests ui ON p.interest_id = ui.interest_id AND ui.user_id = viewer_id
    ORDER BY score DESC
    LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Storage Buckets

Run the following SQL in the **SQL Editor** to create the required storage buckets and their access policies:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('pin-originals', 'pin-originals', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars policies
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- Pin Originals policies (Public Read, Private Upload)
CREATE POLICY "Users can upload their own originals." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pin-originals' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own originals." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'pin-originals');
CREATE POLICY "Pin originals are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'pin-originals');
```

## 4. Google Auth Setup

1. In Supabase, go to **Authentication -> Providers -> Google**.
2. Make sure you use your **Web Application** credentials. (iOS/Android client IDs are not needed because Supabase handles the OAuth handshake and redirects back to the app).
3. Add your Web Client ID (`465906414446-hii8v20tg71lsdkpskgjuervouqe8nun.apps.googleusercontent.com`) and Client Secret into the Supabase dashboard.
*(Note: I have already configured your `app.json` scheme to `me.ritom.indie` so deep-linking will work out of the box).*

## 5. Edge Functions & Webhooks

The project includes an Edge Function (`supabase/functions/process-pin`) which is responsible for simulating dominant color extraction and generating URL references for optimized image variants using Supabase's on-the-fly Image Transformations.

1. **Deploy the Function:**
   Make sure you have the Supabase CLI installed, link your project, and deploy the function:
   ```bash
   npx supabase link --project-ref huqnhvsuliyjiplgdkmd
   npx supabase functions deploy process-pin
   ```

2. **Set up the Database Webhook:**
   - In your Supabase Dashboard, go to **Database -> Webhooks**.
   - Create a new Webhook.
   - **Name:** `process_new_pins`
   - **Table:** `pins`
   - **Events:** `Insert`
   - **Type:** Supabase Edge Function
   - **Method:** `POST`
   - **Edge Function:** Select `process-pin` from the dropdown.

## 6. Recommendation Pipeline

The recommendation system consists of three parts:

### 6a. Set the Gemini API key

Get a free key from [aistudio.google.com](https://aistudio.google.com) (no billing required), then set it as an Edge Function secret:

```bash
bunx supabase secrets set GEMINI_API_KEY=your_key_here
```

Or from a file:
```bash
bunx supabase secrets set --env-file .env.local
```

### 6b. Run the SQL migration

In the **SQL Editor** in your Supabase dashboard, run the entire contents of:

```
supabase/recommendation_pipeline.sql
```

This sets up:
- The `update_user_interest_scores()` batch function
- A `pg_cron` job that runs it every 30 minutes
- The improved multi-signal `get_feed_pins` RPC
- Indexes for performance
- RLS policies on `user_interest_scores`

### 6c. Redeploy the Edge Function

```bash
bunx supabase functions deploy process-pin
```

The updated function now calls `gemini-flash-latest` to generate multi-label AI content fingerprints for every new pin, stored in `pins.ai_labels`. Falls back to keyword extraction if Gemini is unavailable.

### How it works

| Layer | What happens | Writes |
|-------|-------------|--------|
| Pin upload | Gemini labels image → stored in `ai_labels` | 1× per pin |
| User interaction | `processed_for_scores = FALSE` flag set | 1× per event |
| pg_cron (every 30 min) | Batch computes label score deltas, upserts `user_interest_scores` | 1× per batch |
| Feed load | `get_feed_pins` dot-products taste × labels | 0 writes |

## 7. Starting the App

Install dependencies and start Expo:

```bash
bun install
bun run start
```
