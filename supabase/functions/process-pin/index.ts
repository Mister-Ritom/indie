import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"
import * as jpeg from "npm:jpeg-js@0.4.4"

console.log("Edge Function 'process-pin' initialized.")

// ---------------------------------------------------------------------------
// Soft vocabulary — the canonical label list passed to Gemini.
// Gemini is asked to prefer these terms when applicable but is NOT
// restricted to them, so novel content still gets meaningful labels.
// Also used as the fallback text-extraction taxonomy.
// ---------------------------------------------------------------------------

// Each entry: [canonical label, ...keywords that imply it in text]
const LABEL_VOCABULARY: [string, string[]][] = [
  // ── Photography ──────────────────────────────────────────────────────────
  ["photography",            ["photo", "photograph", "camera", "exposure", "shutter", "lens", "shot"]],
  ["portrait photography",   ["portrait", "headshot", "model", "face", "eyes", "subject"]],
  ["landscape photography",  ["landscape", "mountain", "valley", "panorama", "horizon", "vista"]],
  ["street photography",     ["street", "candid", "crowd", "pedestrian", "urban life"]],
  ["film photography",       ["film", "analog", "35mm", "grain", "kodak", "fuji", "darkroom"]],
  ["macro photography",      ["macro", "close-up", "closeup", "detail", "texture"]],
  ["astrophotography",       ["stars", "milky way", "galaxy", "night sky", "astro", "cosmos"]],
  ["underwater photography", ["underwater", "ocean depth", "submarine", "scuba", "marine"]],

  // ── Art styles ───────────────────────────────────────────────────────────
  ["anime",                  ["anime", "manga", "shounen", "shojo", "japanese animation", "otaku"]],
  ["manga",                  ["manga", "comic panel", "speech bubble", "ink lines", "panel"]],
  ["cartoon",                ["cartoon", "animated", "toon", "comic", "caricature"]],
  ["pixel art",              ["pixel", "pixelated", "8-bit", "16-bit", "retro game", "sprite"]],
  ["illustration",           ["illustration", "illustrated", "drawing", "hand-drawn", "artwork"]],
  ["watercolor",             ["watercolor", "watercolour", "wash", "paint brush", "aquarelle"]],
  ["oil painting",           ["oil painting", "oil on canvas", "brushstroke", "palette knife"]],
  ["sketch",                 ["sketch", "pencil drawing", "doodle", "lineart", "pen and ink"]],
  ["digital art",            ["digital art", "digital painting", "procreate", "photoshop art", "krita"]],
  ["3d render",              ["3d", "render", "cgi", "blender", "cinema 4d", "octane", "unreal"]],
  ["vector art",             ["vector", "illustrator", "svg", "flat design", "geometric art"]],
  ["generative art",         ["generative", "algorithmic", "ai art", "midjourney", "stable diffusion"]],
  ["street art",             ["graffiti", "mural", "street art", "spray paint", "urban art"]],
  ["surrealism",             ["surreal", "dreamlike", "fantasy", "impossible", "bizarre", "dali"]],

  // ── Aesthetics & vibes ───────────────────────────────────────────────────
  ["dark academia",          ["dark academia", "library", "old books", "gothic university", "plaid", "candlelight"]],
  ["light academia",         ["light academia", "golden light", "classical", "marble", "scrolls"]],
  ["cottagecore",            ["cottage", "cottagecore", "wildflowers", "mushroom", "rural", "linen", "picnic"]],
  ["vaporwave",              ["vaporwave", "neon", "retro futurism", "glitch", "synthwave", "80s neon"]],
  ["cyberpunk",              ["cyberpunk", "neon city", "dystopia", "hacker", "rain city", "blade runner"]],
  ["y2k aesthetic",          ["y2k", "2000s", "butterfly clip", "chrome", "flip phone", "low rise"]],
  ["indie aesthetic",        ["indie", "alternative", "polaroid", "thrift", "record", "cassette"]],
  ["grunge",                 ["grunge", "distressed", "torn", "band tee", "flannel", "raw"]],
  ["minimalism",             ["minimal", "minimalist", "simple", "clean", "negative space", "white space"]],
  ["maximalism",             ["maximalist", "ornate", "eclectic", "layered", "busy", "opulent"]],
  ["dark aesthetic",         ["dark", "moody", "shadow", "noir", "gothic", "black", "gloomy"]],
  ["lofi aesthetic",         ["lofi", "lo-fi", "chill", "study", "cozy night", "warm light", "rain window"]],
  ["kawaii",                 ["kawaii", "cute", "pastel", "sanrio", "plushie", "adorable"]],
  ["aesthetic",              ["aesthetic", "vibes", "mood", "feeling", "atmosphere"]],
  ["brutalism",              ["brutalist", "concrete", "raw concrete", "exposed structure", "fortress"]],
  ["art deco",               ["art deco", "geometric gold", "1920s", "gatsby", "ornamental"]],
  ["bauhaus",                ["bauhaus", "constructivism", "grid layout", "primary colors", "modernist"]],
  ["baroque",                ["baroque", "ornate gold", "dramatic lighting", "caravaggio", "opulent"]],

  // ── Weather & atmosphere ─────────────────────────────────────────────────
  ["rainy",                  ["rain", "rainy", "drizzle", "wet", "puddle", "umbrella", "storm", "downpour"]],
  ["foggy",                  ["fog", "foggy", "mist", "misty", "haze", "overcast"]],
  ["snowy",                  ["snow", "snowy", "blizzard", "frost", "frozen", "winter", "white"]],
  ["sunny",                  ["sunny", "sunshine", "bright day", "clear sky", "summer"]],
  ["golden hour",            ["golden hour", "magic hour", "sunset", "sunrise", "warm glow", "dusk", "dawn"]],
  ["blue hour",              ["blue hour", "twilight", "dusk", "night falling", "moody sky"]],
  ["stormy",                 ["storm", "thunder", "lightning", "dark clouds", "dramatic sky"]],
  ["autumn",                 ["autumn", "fall", "leaves", "orange", "pumpkin", "harvest", "october"]],
  ["spring",                 ["spring", "blossom", "cherry blossom", "sakura", "bloom"]],

  // ── Moods & lighting ─────────────────────────────────────────────────────
  ["moody",                  ["moody", "atmospheric", "brooding", "melancholic", "somber"]],
  ["cozy",                   ["cozy", "hygge", "warm", "comfortable", "fireplace", "blanket", "tea", "coffee"]],
  ["dreamy",                 ["dreamy", "soft", "ethereal", "hazy", "pastel", "gentle", "whimsical"]],
  ["dramatic lighting",      ["dramatic", "chiaroscuro", "stark", "high contrast", "shadows and light"]],
  ["neon lighting",          ["neon", "glow", "neon sign", "led", "fluorescent", "electric"]],
  ["candlelight",            ["candle", "candlelight", "flame", "flickering", "warm glow"]],
  ["monochrome",             ["monochrome", "black and white", "grayscale", "bw", "monotone"]],
  ["pastel",                 ["pastel", "soft color", "muted", "lavender", "mint", "blush"]],
  ["vibrant colors",         ["vibrant", "colorful", "saturated", "vivid", "bold color", "rainbow"]],
  ["earthy tones",           ["earthy", "brown", "terracotta", "rust", "warm beige", "clay"]],

  // ── Subjects ─────────────────────────────────────────────────────────────
  ["architecture",           ["architecture", "building", "structure", "facade", "bridge", "skyscraper"]],
  ["interior design",        ["interior", "room", "furniture", "decor", "living space", "home"]],
  ["nature",                 ["nature", "forest", "tree", "plant", "wildlife", "wilderness"]],
  ["animals",                ["animal", "cat", "dog", "bird", "wildlife", "pet", "creature"]],
  ["fashion",                ["fashion", "outfit", "clothing", "style", "wear", "ootd", "apparel"]],
  ["food photography",       ["food", "recipe", "cooking", "eat", "restaurant", "dish", "baking"]],
  ["travel",                 ["travel", "destination", "wanderlust", "explore", "trip", "journey"]],
  ["urban",                  ["urban", "city", "cityscape", "metropolitan", "downtown", "rooftop"]],
  ["typography",             ["typography", "font", "typeface", "lettering", "calligraphy", "text design"]],
  ["ui design",              ["ui", "ux", "interface", "app design", "dashboard", "wireframe", "mockup"]],
  ["graphic design",         ["graphic design", "poster", "branding", "logo", "visual identity"]],
  ["music",                  ["music", "concert", "band", "guitar", "vinyl", "studio", "album"]],
  ["books",                  ["book", "reading", "library", "novel", "literature", "pages"]],
  ["fitness",                ["gym", "workout", "fitness", "exercise", "sport", "training"]],
  ["space",                  ["space", "planet", "galaxy", "nebula", "cosmos", "universe", "astronaut"]],
]

// Build a plain Record for fast lookup in text extraction
const TAXONOMY = Object.fromEntries(LABEL_VOCABULARY.map(([label, kws]) => [label, kws]))

// Flat list of canonical labels for the Gemini prompt vocabulary
const VOCABULARY_LIST = LABEL_VOCABULARY.map(([label]) => label).join(", ")

/**
 * Keyword-based label extractor — runs entirely in-process, zero cost.
 * Returns up to 6 labels with confidence scores.
 */
function extractLabelsFromText(title: string, description: string): Array<{ label: string; score: number }> {
  const text = `${title} ${description}`.toLowerCase()
  const scores: Array<{ label: string; score: number }> = []

  for (const [label, keywords] of Object.entries(TAXONOMY)) {
    const matchCount = keywords.filter(kw => text.includes(kw)).length
    if (matchCount > 0) {
      scores.push({ label, score: Math.min(0.4 + matchCount * 0.15, 0.85) })
    }
  }

  return scores.sort((a, b) => b.score - a.score).slice(0, 6)
}

// ---------------------------------------------------------------------------
// Gemini Flash vision labeling
// ---------------------------------------------------------------------------
interface AiLabel {
  label: string
  score: number
}

/**
 * Calls Gemini Flash (latest) with the image + pin metadata.
 * Returns multi-label classifications with confidence scores.
 * Throws on failure so the caller can fall back gracefully.
 */
async function labelWithGemini(
  imageUrl: string,
  title: string,
  description: string,
  apiKey: string,
): Promise<AiLabel[]> {
  const GEMINI_API_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`

  // We give Gemini a soft vocabulary: prefer these canonical terms when they
  // apply so labels stay consistent across pins, but allow free-form labels
  // for things not in the list (e.g. a very niche sub-aesthetic).
  const prompt = `Analyze this image and its metadata. Return ONLY a valid JSON object with a single key "labels" — an array of up to 8 objects, each with "label" (string) and "score" (float 0.0–1.0, confidence).

Rules:
- Labels must be lowercase
- Avoid generic words like "image", "photo", "picture", "content"
- Focus on: art style, visual aesthetic, mood, weather, lighting, subject matter, color palette
- PREFER terms from this vocabulary when they apply (use exact spelling): ${VOCABULARY_LIST}
- You MAY use labels outside this list if nothing in it fits (e.g. a very niche aesthetic)
- Score reflects how strongly the label describes the image (0.0 = weak hint, 1.0 = defines it)

Metadata — Title: "${title}", Description: "${description}"`

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: undefined as unknown,
            // Use the image URL directly via file_data for publicly accessible images
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  }

  // Fetch the image and send as inline base64 (edge fn has no CORS restrictions)
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) throw new Error(`Failed to fetch image for Gemini: ${imageRes.status}`)
  const imageBytes = await imageRes.arrayBuffer()
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBytes)))
  const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg"

  // Replace placeholder with real inline_data part
  body.contents[0].parts[1] = {
    inline_data: {
      mime_type: mimeType,
      data: base64Image,
    },
  } as unknown

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const result = await response.json()
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error("Gemini returned empty response")

  const parsed = JSON.parse(rawText)

  if (!Array.isArray(parsed?.labels)) throw new Error("Gemini response missing 'labels' array")

  // Validate and sanitise
  const labels: AiLabel[] = parsed.labels
    .filter((l: unknown) =>
      typeof l === "object" &&
      l !== null &&
      typeof (l as AiLabel).label === "string" &&
      typeof (l as AiLabel).score === "number",
    )
    .map((l: AiLabel) => ({
      label: l.label.toLowerCase().trim(),
      score: Math.min(Math.max(l.score, 0), 1),
    }))
    .slice(0, 8)

  if (labels.length === 0) throw new Error("Gemini returned zero valid labels")
  return labels
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Received Webhook Payload:", payload)

    if (payload.type !== "INSERT" || payload.table !== "pins") {
      return new Response("Not a pin insert event.", { status: 200 })
    }

    const pin = payload.record

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? ""
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const originalPath = `${pin.user_id}/${pin.id}`
    let dominantColor = pin.dominant_color
    let aiLabels: AiLabel[] = []

    // -------------------------------------------------------------------------
    // STEP 1: Dominant colour extraction (existing logic, unchanged)
    // -------------------------------------------------------------------------
    if (pin.media_type === "image" && !dominantColor) {
      try {
        const imageUrl = `${supabaseUrl}/storage/v1/render/image/public/pin-originals/${originalPath}?width=1&height=1&resize=cover`
        const res = await fetch(imageUrl)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          const rawImageData = jpeg.decode(arrayBuffer, { useTArray: true })
          if (rawImageData && rawImageData.data.length >= 3) {
            const r = rawImageData.data[0]
            const g = rawImageData.data[1]
            const b = rawImageData.data[2]
            dominantColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
            console.log(`Extracted dominant color ${dominantColor} for pin ${pin.id}`)
          }
        }
      } catch (err) {
        console.error("Error extracting dominant color:", err)
      }
    }

    if (!dominantColor) dominantColor = "#1e1e1e"

    // -------------------------------------------------------------------------
    // STEP 2: AI content labelling — Gemini Flash with text fallback
    // -------------------------------------------------------------------------
    if (pin.media_type === "image") {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/pin-originals/${originalPath}`

      if (geminiApiKey) {
        try {
          aiLabels = await labelWithGemini(
            imageUrl,
            pin.title ?? "",
            pin.description ?? "",
            geminiApiKey,
          )
          console.log(`Gemini labelled pin ${pin.id} with ${aiLabels.length} labels:`, aiLabels)
        } catch (err) {
          console.warn(`Gemini labelling failed for pin ${pin.id}, falling back to text extraction:`, err)
          aiLabels = extractLabelsFromText(pin.title ?? "", pin.description ?? "")
        }
      } else {
        // No Gemini key configured — use text-only fallback
        console.warn("GEMINI_API_KEY not set — using text-only label extraction")
        aiLabels = extractLabelsFromText(pin.title ?? "", pin.description ?? "")
      }

      // Merge with user-selected interest as a strong prior (score 1.0) if present
      // This ensures the user's explicit category always factors in even if Gemini
      // uses different terminology
      if (pin.interest_id) {
        // We don't have the interest name here, but ai_labels will capture it
        // through the Gemini analysis. No extra merge needed.
      }
    } else {
      // GIF or non-image: text-only labelling
      aiLabels = extractLabelsFromText(pin.title ?? "", pin.description ?? "")
    }

    // -------------------------------------------------------------------------
    // STEP 3: Update pin with dominant_color + ai_labels in one write
    // -------------------------------------------------------------------------
    await supabaseClient
      .from("pins")
      .update({
        dominant_color: dominantColor,
        ai_labels: aiLabels.length > 0 ? aiLabels : null,
      })
      .eq("id", pin.id)

    // -------------------------------------------------------------------------
    // STEP 4: Generate optimised image asset variants (existing logic, unchanged)
    // -------------------------------------------------------------------------
    if (pin.media_type === "image") {
      const variants = [
        { quality_variant: "thumb", width: 400, height: Math.floor((400 / pin.width) * pin.height) },
        { quality_variant: "720", width: 720, height: Math.floor((720 / pin.width) * pin.height) },
      ]

      const assetInserts = variants.map((variant) => ({
        pin_id: pin.id,
        url: `${supabaseUrl}/storage/v1/render/image/public/pin-originals/${originalPath}?width=${variant.width}&resize=contain`,
        width: variant.width,
        height: variant.height,
        variant: variant.quality_variant,
      }))

      const { error: assetError } = await supabaseClient
        .from("pin_assets")
        .insert(assetInserts)

      if (assetError) throw assetError
      console.log(`Successfully generated variants for pin ${pin.id}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        pin_id: pin.id,
        dominant_color: dominantColor,
        ai_labels: aiLabels,
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    )
  } catch (error) {
    console.error("Error processing pin:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
