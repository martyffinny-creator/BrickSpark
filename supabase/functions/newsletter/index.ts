import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI'

/**
 * Allowed subscriber sources — extend as needed.
 * Helps prevent source spoofing.
 */
const ALLOWED_SOURCES = ['website', 'studio', 'club', 'schools', 'blog', 'popup', 'footer']

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405)
  }

  // Parse request body
  let body: { email?: unknown; source?: unknown; name?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const rawSource = typeof body.source === 'string' ? body.source.trim().toLowerCase() : 'website'
  const source = ALLOWED_SOURCES.includes(rawSource) ? rawSource : 'website'
  const name =
    typeof body.name === 'string' ? body.name.trim().slice(0, 120) : null

  // Validate
  if (!email) {
    return jsonResponse({ error: 'Email address is required.' }, 400)
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Please provide a valid email address.' }, 400)
  }
  if (email.length > 320) {
    return jsonResponse({ error: 'Email address is too long.' }, 400)
  }

  // Create Supabase client with service role (bypasses RLS for trusted inserts)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Insert into newsletter table
  const record: Record<string, unknown> = {
    email,
    source,
    subscribed_at: new Date().toISOString(),
    active: true,
  }
  if (name) record.name = name

  const { error } = await supabase.from('newsletter').insert([record])

  if (error) {
    // Postgres unique violation — already subscribed
    if (error.code === '23505') {
      return jsonResponse(
        {
          success: true,
          already_subscribed: true,
          message: "You're already subscribed to the BrickSpark newsletter! 🎉",
        },
        200,
      )
    }

    console.error('Newsletter insert error:', error)
    return jsonResponse(
      { error: 'Something went wrong. Please try again in a moment.' },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: 'Welcome to the BrickSpark family! Check your inbox for a confirmation. 🧱',
    },
    201,
  )
})
