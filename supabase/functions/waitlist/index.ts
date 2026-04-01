import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI'

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
  let body: { email?: unknown; product?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const product = typeof body.product === 'string' ? body.product.trim() : 'general'

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
  if (product.length > 64) {
    return jsonResponse({ error: 'Product identifier is too long.' }, 400)
  }

  // Create Supabase client with service role (bypasses RLS for trusted inserts)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Insert into waitlist table
  const { error } = await supabase
    .from('waitlist')
    .insert([
      {
        email,
        product,
        created_at: new Date().toISOString(),
        source: 'website',
      },
    ])

  if (error) {
    // Postgres unique violation — email already registered for this product
    if (error.code === '23505') {
      return jsonResponse(
        {
          success: true,
          already_registered: true,
          message: "You're already on the list! We'll be in touch when we launch. 🚀",
        },
        200,
      )
    }

    console.error('Waitlist insert error:', error)
    return jsonResponse(
      { error: 'Something went wrong. Please try again in a moment.' },
      500,
    )
  }

  return jsonResponse(
    {
      success: true,
      message: "You're on the list! We'll notify you as soon as BrickSpark Studio launches. 🎉",
    },
    201,
  )
})
