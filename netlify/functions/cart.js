const supabase = require('@supabase/supabase-js');

// Use Supabase service role key for full access
const supabaseUrl = 'https://dppjohfplbznhggdemeu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Main handler
exports.handler = async (event, context) => {
  const { httpMethod: method, path } = event;
  const userId = path.match(/\/cart\/([^/]+)/)?.[1];

  try {
    // POST add to cart
    if (method === 'POST' && !userId) {
      const { userId: uId, productId, quantity } = JSON.parse(event.body);
      const errors = [];
      if (!uId) errors.push('userId is required');
      if (!productId) errors.push('productId is required');
      if (quantity <= 0) errors.push('Quantity must be positive');
      if (errors.length > 0) return {
        statusCode: 400,
        body: JSON.stringify({ errors })
      };

      // Check if product exists
      const { count, error: productError } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact' })
        .eq('id', productId);
      if (productError || count === 0) return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' })
      };

      const { data, error } = await supabaseClient
        .from('carts')
        .insert({
          user_id: uId,
          product_id: productId,
          quantity: quantity
        });
      if (error) throw error;
      return {
        statusCode: 201,
        body: JSON.stringify(data)
      };
    }

    // GET cart for user
    if (method === 'GET' && userId) {
      const { data, error } = await supabaseClient
        .from('carts')
        .select(`
          user_id,
          product_id,
          quantity,
          products (id, name, price, image_url)
        `)
        .eq('user_id', userId);
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    }

    // DELETE cart for user
    if (method === 'DELETE' && userId) {
      const { error } = await supabaseClient
        .from('carts')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      return {
        statusCode: 204,
        body: ''
      };
    }

    return {
      statusCode: 405,
      body: 'Method not allowed'
    };

  } catch (error) {
    console.error('Cart API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};