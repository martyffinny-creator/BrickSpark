const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzA4NiwiZXhwIjoyMDkwMjA5MDg2fQ.FsU_njO13HIaZyHgxeQO2aGljYOEyf8ujBqs502PSpI@dppjohfplbznhggdemeu.supabase.co:5432/postgres',
});

client.connect()
  .then(() => client.query(`
    CREATE TABLE carts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id INT NOT NULL REFERENCES products(id),
      quantity INT NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_carts_user_id ON carts(user_id);
    CREATE INDEX idx_carts_product_id ON carts(product_id);
  `))
  .then(res => {
    console.log('Carts table created successfully!');
    client.end();
  })
  .catch(e => {
    console.error('Error creating carts table:', e);
    client.end();
  });