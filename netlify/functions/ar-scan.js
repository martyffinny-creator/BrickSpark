const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dppjohfplbznhggdemeu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI'
);

// Fallback AR data if table doesn't have entry
const DEFAULT_STEPS = {
  'dino-dig-adventure':  [{ step:1, emoji:'🦴', desc:'Lay the excavation base plate' }, { step:2, emoji:'🪨', desc:'Build the rocky terrain walls' }, { step:3, emoji:'🦕', desc:'Assemble the dinosaur skeleton' }, { step:4, emoji:'🔦', desc:'Add the explorer minifigure & tools' }],
  'space-station-alpha': [{ step:1, emoji:'🛸', desc:'Build the central docking hub' }, { step:2, emoji:'🔭', desc:'Attach the telescope array' }, { step:3, emoji:'⚡', desc:'Install solar panel wings' }, { step:4, emoji:'👨‍🚀', desc:'Place astronaut crew & equipment' }],
  'enchanted-castle':    [{ step:1, emoji:'🏰', desc:'Lay the castle foundation' }, { step:2, emoji:'🧱', desc:'Build the main tower walls' }, { step:3, emoji:'🚪', desc:'Add the drawbridge & gate' }, { step:4, emoji:'👑', desc:'Crown the towers & place the royal flag' }],
  'ocean-explorer':      [{ step:1, emoji:'🌊', desc:'Build the underwater base' }, { step:2, emoji:'🐠', desc:'Add coral reef scenery' }, { step:3, emoji:'🤿', desc:'Assemble the submarine hull' }, { step:4, emoji:'🐙', desc:'Place sea creatures & diver' }],
  'city-builder-starter':[{ step:1, emoji:'🛣️', desc:'Lay the road base plates' }, { step:2, emoji:'🏗️', desc:'Build the first building frame' }, { step:3, emoji:'🚗', desc:'Add vehicles & traffic signals' }, { step:4, emoji:'🌳', desc:'Plant trees & place citizens' }],
  'robot-workshop':      [{ step:1, emoji:'⚙️', desc:'Build the workshop floor & walls' }, { step:2, emoji:'🤖', desc:'Assemble the robot body & arms' }, { step:3, emoji:'🔧', desc:'Add tools & workshop equipment' }, { step:4, emoji:'💡', desc:'Power up with LED light bricks' }],
  'jungle-safari':       [{ step:1, emoji:'🌿', desc:'Build the jungle base & foliage' }, { step:2, emoji:'🦁', desc:'Place the safari animals' }, { step:3, emoji:'🚙', desc:'Assemble the safari jeep' }, { step:4, emoji:'📸', desc:'Add explorer minifigure & camera' }],
  'brickspark-mega-mix': [{ step:1, emoji:'🌈', desc:'Sort bricks by colour & type' }, { step:2, emoji:'🏗️', desc:'Choose your build from the guide book' }, { step:3, emoji:'🧱', desc:'Follow your selected model steps' }, { step:4, emoji:'🎉', desc:'Show off your creation to the community!' }]
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let productSlug;
  try {
    ({ productSlug } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!productSlug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'productSlug is required' }) };

  // Try ar_models table first
  const { data: arModel } = await supabase
    .from('ar_models')
    .select('*')
    .eq('product_slug', productSlug)
    .single();

  // Log the scan
  await supabase.from('ar_scans').insert([{ product_slug: productSlug, scanned_at: new Date().toISOString() }]).catch(() => {});

  // Get product info
  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, emoji, image_url, short_desc')
    .eq('slug', productSlug)
    .single();

  const buildSteps = (arModel && arModel.build_steps) || DEFAULT_STEPS[productSlug] || [
    { step: 1, emoji: '🧱', desc: 'Start with the base' },
    { step: 2, emoji: '🏗️', desc: 'Build up the structure' },
    { step: 3, emoji: '✨', desc: 'Add the finishing details' }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      product_slug: productSlug,
      model_name: (arModel && arModel.model_name) || (product && product.name) || productSlug,
      model_emoji: (arModel && arModel.model_emoji) || (product && product.emoji) || '🧱',
      build_steps: buildSteps,
      product: product || null,
      ar_model: arModel || null
    })
  };
};
