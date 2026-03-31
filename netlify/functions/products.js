// netlify/functions/products.js
// Products API — GET all or GET by slug

const PRODUCTS = [
  {
    id: 'dino-dig-adventure',
    slug: 'dino-dig-adventure',
    name: 'Dino Dig Adventure',
    price: 34.99,
    ages: '4–8',
    pieces: 140,
    emoji: '🦖',
    category: 'Adventure',
    description: 'Unearth prehistoric creatures with this exciting dinosaur dig kit! Build a T-Rex, Triceratops, and Pterodactyl. Includes a volcano base, fossil digging area, and 4 explorer minifigures.',
    features: ['3 buildable dinosaurs', 'Volcano with hidden cave', 'Fossil digging play area', '4 explorer minifigures', 'Illustrated guidebook'],
    image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600'
  },
  {
    id: 'space-station-alpha',
    slug: 'space-station-alpha',
    name: 'Space Station Alpha',
    price: 49.99,
    ages: '6–12',
    pieces: 320,
    emoji: '🚀',
    category: 'Science',
    description: 'Launch into orbit with the modular Space Station Alpha! Features glow-in-the-dark bricks, rotating solar panels, and a docking shuttle. Build, reconfigure, and explore the cosmos.',
    features: ['Glow-in-the-dark bricks', 'Rotating solar panels', 'Docking shuttle', '6 astronaut minifigures', 'Modular design — reconfigure endlessly'],
    image_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600'
  },
  {
    id: 'enchanted-castle',
    slug: 'enchanted-castle',
    name: 'Enchanted Castle',
    price: 44.99,
    ages: '5–10',
    pieces: 410,
    emoji: '🏰',
    category: 'Fantasy',
    description: 'Build a magical castle with a working drawbridge, secret passage, and throne room. Includes 8 fantasy minifigures — knights, a dragon, and a royal family.',
    features: ['Working drawbridge', 'Secret passage', 'Throne room interior', '8 fantasy minifigures', 'Buildable dragon'],
    image_url: 'https://images.unsplash.com/photo-1533154683220-9e0e1f6b6285?w=600'
  },
  {
    id: 'ocean-explorer',
    slug: 'ocean-explorer',
    name: 'Ocean Explorer',
    price: 34.99,
    ages: '4–8',
    pieces: 180,
    emoji: '🐙',
    category: 'Adventure',
    description: 'Dive into the deep blue with the Ocean Explorer! Build a submarine, coral reef, and underwater cave. Discover sea creatures and learn about marine ecosystems.',
    features: ['Buildable submarine', 'Coral reef diorama', 'Underwater cave', '5 sea creature figures', '4 diver minifigures'],
    image_url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600'
  },
  {
    id: 'city-builder-starter',
    slug: 'city-builder-starter',
    name: 'City Builder Starter',
    price: 24.99,
    ages: '3–6',
    pieces: 240,
    emoji: '🏗️',
    category: 'Starter',
    description: 'The perfect first kit! Chunky, easy-grip bricks for little hands. Build houses, shops, vehicles, and a park. Designed for ages 3+ with rounded edges and large pieces.',
    features: ['Extra-large easy-grip bricks', 'Rounded edges for safety', 'Multiple build options', '6 character figures', 'Durable storage container'],
    image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600'
  },
  {
    id: 'robot-workshop',
    slug: 'robot-workshop',
    name: 'Robot Workshop',
    price: 54.99,
    ages: '7–12',
    pieces: 380,
    emoji: '🤖',
    category: 'STEM',
    description: 'Engineer your own robots with working gears, light-up eyes, and poseable limbs! Includes 8 STEM challenge cards that teach engineering concepts through play.',
    features: ['Working gear mechanisms', 'Light-up LED eyes', 'Poseable limbs', '8 STEM challenge cards', '3 robot build variations'],
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600'
  },
  {
    id: 'jungle-safari',
    slug: 'jungle-safari',
    name: 'Jungle Safari',
    price: 39.99,
    ages: '4–9',
    pieces: 260,
    emoji: '🦁',
    category: 'Adventure',
    description: 'Go on a wild jungle adventure! Build a safari jeep, observation tower, and animal habitats. Features lions, elephants, monkeys, and more.',
    features: ['Safari jeep with rolling wheels', 'Observation tower', 'Animal habitats', '8 jungle animals', '4 ranger minifigures'],
    image_url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600'
  },
  {
    id: 'mega-mix',
    slug: 'mega-mix',
    name: 'BrickSpark Mega Mix',
    price: 74.99,
    ages: '5–12',
    pieces: 600,
    emoji: '🎨',
    category: 'Creative',
    description: 'The ultimate creative building set! 600 pieces spanning every theme — build anything you can imagine. Includes idea cards, a parts guide, and a premium storage case.',
    features: ['600 mixed pieces', '20 idea cards', 'Premium storage case', 'Parts guide booklet', 'Compatible with all BrickSpark kits'],
    image_url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600'
  }
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const params = event.queryStringParameters || {};

  // Get by slug
  if (params.slug) {
    const product = PRODUCTS.find(p => p.slug === params.slug);
    if (!product) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Product not found' })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(product)
    };
  }

  // Filter by category
  let results = PRODUCTS;
  if (params.category) {
    results = results.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
  }

  // Sort
  if (params.sort === 'price-asc') {
    results = [...results].sort((a, b) => a.price - b.price);
  } else if (params.sort === 'price-desc') {
    results = [...results].sort((a, b) => b.price - a.price);
  } else if (params.sort === 'name') {
    results = [...results].sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results)
  };
};
