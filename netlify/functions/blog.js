// netlify/functions/blog.js
// Blog API — GET all posts, POST new post

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fallback posts (used if Supabase table is empty or not set up)
const FALLBACK_POSTS = [
  {
    id: 1,
    title: '10 Creative STEM Activities Using BrickSpark Kits',
    slug: '10-creative-stem-activities-brickspark',
    category: 'STEM Education',
    excerpt: "BrickSpark kits aren't just toys — they're STEM learning tools in disguise. Here are 10 hands-on activities that turn playtime into powerful learning moments.",
    author: 'BrickSpark Team',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    content: '<h2>Why STEM Play Matters</h2><p>Research shows that hands-on building activities significantly boost spatial reasoning, problem-solving, and early math skills in children aged 3–12.</p>',
    created_at: '2026-03-15T10:00:00Z',
    published: true
  },
  {
    id: 2,
    title: "How to Choose the Right BrickSpark Kit for Your Child's Age",
    slug: 'choose-right-brickspark-kit-age',
    category: 'Buying Guide',
    excerpt: 'With 8 amazing BrickSpark kits available, how do you pick the perfect one for your child? Here\'s our complete age-by-age buying guide.',
    author: 'BrickSpark Team',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    content: '<h2>Age-by-Age Gift Guide</h2><p>Choosing the right building kit depends on more than just age — it\'s about your child\'s interests and how much challenge they enjoy.</p>',
    created_at: '2026-03-20T10:00:00Z',
    published: true
  },
  {
    id: 3,
    title: 'March Building Challenge: Design Your Dream City!',
    slug: 'march-building-challenge-dream-city',
    category: 'Community Challenge',
    excerpt: "This month's community challenge is live! Submit your best city creation for a chance to win an exclusive BrickSpark Club membership and a Robot Workshop kit.",
    author: 'BrickSpark Team',
    image_url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    content: '<h2>The Challenge is ON! 🏙️</h2><p>We\'re thrilled to launch the March BrickSpark Community Challenge: Design Your Dream City!</p>',
    created_at: '2026-03-25T10:00:00Z',
    published: true
  }
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // ========================
  // GET — Fetch blog posts
  // ========================
  if (event.httpMethod === 'GET') {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If Supabase returns data, use it; otherwise fallback
      const posts = (data && data.length > 0) ? data : FALLBACK_POSTS;

      // Filter by slug if provided
      const params = event.queryStringParameters || {};
      if (params.slug) {
        const post = posts.find(p => p.slug === params.slug);
        if (!post) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Post not found' })
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(post)
        };
      }

      // Filter by category
      let results = posts;
      if (params.category) {
        results = results.filter(p => p.category.toLowerCase().includes(params.category.toLowerCase()));
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(results)
      };

    } catch (err) {
      console.error('Blog GET error:', err);
      // Return fallback posts on error
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(FALLBACK_POSTS)
      };
    }
  }

  // ========================
  // POST — Create new post
  // ========================
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);

      // Validate required fields
      const { title, slug, category, excerpt, content, author, image_url } = body;

      if (!title || !slug || !content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Title, slug, and content are required.' })
        };
      }

      // Generate slug if not provided
      const finalSlug = slug || title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const postData = {
        title,
        slug: finalSlug,
        category: category || 'General',
        excerpt: excerpt || content.substring(0, 160).replace(/<[^>]+>/g, '') + '...',
        content,
        author: author || 'BrickSpark Team',
        image_url: image_url || null,
        published: body.published !== false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select();

      if (error) {
        if (error.code === '23505') {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'A post with this slug already exists.' })
          };
        }
        throw error;
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Post created successfully', post: data?.[0] || postData })
      };

    } catch (err) {
      console.error('Blog POST error:', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message || 'Failed to create post' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
