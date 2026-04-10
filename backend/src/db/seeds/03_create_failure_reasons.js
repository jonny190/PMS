const { v4: uuidv4 } = require('uuid');

exports.seed = async (knex) => {
  // Get tenant IDs
  const tenants = await knex('tenants').select('id', 'slug');
  
  const tenant1 = tenants.find(t => t.slug === 'democorp');
  const tenant2 = tenants.find(t => t.slug === 'acme');

  if (!tenant1 || !tenant2) {
    console.error('Tenants not found. Run 01_create_tenants seed first.');
    return;
  }

  const failureReasons = [
    // Tenant 1 failure reasons
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      name: 'Weather',
      description: 'Bad weather conditions prevented task completion',
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      name: 'Staffing',
      description: 'Insufficient staff available',
      sort_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      name: 'Equipment',
      description: 'Equipment was unavailable or broken',
      sort_order: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      name: 'Materials',
      description: 'Materials were unavailable',
      sort_order: 4,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant1.id,
      name: 'Other',
      description: 'Other reasons',
      sort_order: 5,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 2 failure reasons
    {
      id: uuidv4(),
      tenant_id: tenant2.id,
      name: 'Weather',
      description: 'Bad weather conditions',
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant2.id,
      name: 'Equipment',
      description: 'Equipment issues',
      sort_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      tenant_id: tenant2.id,
      name: 'Other',
      description: 'Other reasons',
      sort_order: 3,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('failure_reasons').insert(failureReasons);
};