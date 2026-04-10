const { v4: uuidv4 } = require('uuid');

exports.seed = async (knex) => {
  // Insert demo tenants
  const tenants = [
    {
      id: uuidv4(),
      name: 'Demo Corp',
      slug: 'democorp',
      max_users: 50,
      current_users: 3,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Acme Inc',
      slug: 'acme',
      max_users: 20,
      current_users: 2,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('tenants').insert(tenants);
};