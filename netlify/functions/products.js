const supabase = require('@supabase/supabase-js');

// Use Supabase service role key for full access
const supabaseUrl = 'https://dppjohfplbznhggdemeu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Main handler
exports.handler = async (event, context) => {
  const { httpMethod: method, path } = event;
  const productId = path.match(/\/products\/(\d+)/)?.[1];

  // Product validation helper
  const validateProduct = (data) => {
    const errors = [];
    if (!data.name || data.name.length < 3) errors.push('Name must be at least 3 characters');
    if (!data.theme) errors.push('Theme is required');
    if (typeof data.price !== 'number' || data.price <= 0) errors.push('Price must be a positive number');
    if (typeof data.stock !== 'number' || data.stock < 0) errors.push('Stock must be non-negative');
    if (!data.imageUrl || !data.imageUrl.includes('http')) errors.push('Valid image URL required');
    return errors;
  };

  try {
    // GET all products
    if (method === 'GET' && !productId) {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*');
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ products: data })
      };
    }

    // GET single product
    if (method === 'GET' && productId) {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error) return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' })
      };
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    }

    // POST new product
    if (method === 'POST' && !productId) {
      const product = JSON.parse(event.body);
      const errors = validateProduct(product);
      if (errors.length > 0) return {
        statusCode: 400,
        body: JSON.stringify({ errors })
      };

      const { data, error } = await supabaseClient
        .from('products')
        .insert({
          name: product.name,
          theme: product.theme,
          price: product.price,
          stock: product.stock,
          image_url: product.imageUrl
        })
        .select();
      if (error) throw error;
      return {
        statusCode: 201,
        body: JSON.stringify(data[0])
      };
    }

    // PUT update product
    if (method === 'PUT' && productId) {
      const updates = JSON.parse(event.body);
      const errors = [];
      if (updates.price !== undefined && updates.price <= 0) errors.push('Price must be positive');
      if (updates.stock !== undefined && updates.stock < 0) errors.push('Stock cannot be negative');
      if (errors.length > 0) return {
        statusCode: 400,
        body: JSON.stringify({ errors })
      };

      const { data, error } = await supabaseClient
        .from('products')
        .update({
          price: updates.price,
          stock: updates.stock
        })
        .eq('id', productId)
        .select();
      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify(data[0])
      };
    }

    // DELETE product
    if (method === 'DELETE' && productId) {
      const { data, error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId)
        .select();
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
    console.error('Products API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};