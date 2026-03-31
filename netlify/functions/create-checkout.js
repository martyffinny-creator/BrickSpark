// netlify/functions/create-checkout.js
// Stripe Checkout Session + Supabase order insert
// Set STRIPE_SECRET_KEY and SUPABASE_SERVICE_KEY in Netlify environment variables

const { createClient } = require('@supabase/supabase-js');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(STRIPE_SECRET_KEY);

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { items, customerEmail, customerName, address } = JSON.parse(event.body);

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No items provided.' }) };
    }
    if (!customerEmail || !customerName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Customer email and name are required.' }) };
    }

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const shippingCost = subtotal >= 50 ? 0 : 5.99;

    // Build Stripe line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          metadata: { product_id: item.id }
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.qty
    }));

    // Add shipping as a line item if not free
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Standard Shipping' },
          unit_amount: Math.round(shippingCost * 100)
        },
        quantity: 1
      });
    }

    // Determine base URL
    const origin = event.headers.origin || event.headers.referer?.replace(/\/[^/]*$/, '') || process.env.URL || 'https://brickspark.com';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart.html`
    });

    // Insert order to Supabase
    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      items: JSON.stringify(items),
      subtotal: subtotal,
      shipping: shippingCost,
      total: subtotal + shippingCost,
      stripe_session_id: session.id,
      status: 'pending',
      address: address ? JSON.stringify(address) : null,
      created_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase.from('orders').insert([orderData]);
    if (dbError) {
      console.error('Supabase order insert error:', dbError);
      // Don't fail checkout — Stripe session already created
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error('Checkout error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
};
