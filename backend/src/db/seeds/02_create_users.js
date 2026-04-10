const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

exports.seed = async (knex) => {
  // Get tenant IDs
  const tenants = await knex('tenants').select('id', 'slug');
  
  const tenant1 = tenants.find(t => t.slug === 'democorp');
  const tenant2 = tenants.find(t => t.slug === 'acme');

  if (!tenant1 || !tenant2) {
    console.error('Tenants not found. Run 01_create_tenants seed first.');
    return;
  }

  const users = [
    // Platform admin
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      email: 'platform@example.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Platform',
      last_name: 'Admin',
      role: 'platform_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 1 users
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      email: 'admin@democorp.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'John',
      last_name: 'Doe',
      role: 'tenant_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      email: 'user1@democorp.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      email: 'user2@democorp.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Bob',
      last_name: 'Johnson',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 2 users
    {
      id: uuidv4(),
      tenant_id: tenant2.id,
      email: 'admin@acme.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Alice',
      last_name: 'Williams',
      role: 'tenant_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant2.id,
      email: 'user@acme.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Charlie',
      last_name: 'Brown',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('users').insert(users);
};