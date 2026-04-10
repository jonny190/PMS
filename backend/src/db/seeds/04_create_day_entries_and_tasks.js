const { v4: uuidv4 } = require('uuid');

exports.seed = async (knex) => {
  // Get tenant and user IDs
  const tenants = await knex('tenants').select('id', 'slug');
  const users = await knex('users').select('id', 'email');
  
  const tenant1 = tenants.find(t => t.slug === 'democorp');
  const tenant2 = tenants.find(t => t.slug === 'acme');

  if (!tenant1 || !tenant2) {
    console.error('Tenants not found. Run 01_create_tenants seed first.');
    return;
  }

  const user1 = users.find(u => u.email === 'user1@democorp.com');
  const user2 = users.find(u => u.email === 'user2@democorp.com');
  const user3 = users.find(u => u.email === 'user@acme.com');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dayEntries = [
    // Tenant 1 users - today
    {
      id: uuidv4(),
      user_id: user1.id,
      tenant_id: tenant1.id,
      date: today,
      start_time: new Date(),
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      user_id: user2.id,
      tenant_id: tenant1.id,
      date: today,
      start_time: new Date(),
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 1 users - yesterday (completed)
    {
      id: uuidv4(),
      user_id: user1.id,
      tenant_id: tenant1.id,
      date: yesterdayStr,
      start_time: new Date(yesterday),
      end_time: new Date(),
      is_completed: true,
      completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      user_id: user2.id,
      tenant_id: tenant1.id,
      date: yesterdayStr,
      start_time: new Date(yesterday),
      end_time: new Date(),
      is_completed: true,
      completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 2 users - today
    {
      id: uuidv4(),
      user_id: user3.id,
      tenant_id: tenant2.id,
      date: today,
      start_time: new Date(),
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // Tenant 2 users - yesterday (completed)
    {
      id: uuidv4(),
      user_id: user3.id,
      tenant_id: tenant2.id,
      date: yesterdayStr,
      start_time: new Date(yesterday),
      end_time: new Date(),
      is_completed: true,
      completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('day_entries').insert(dayEntries);

  // Tasks for yesterday (completed)
  const yesterdayEntry1 = dayEntries.find(e => e.date === yesterdayStr && e.user_id === user1.id);
  const yesterdayEntry2 = dayEntries.find(e => e.date === yesterdayStr && e.user_id === user2.id);
  const yesterdayEntry3 = dayEntries.find(e => e.date === yesterdayStr && e.user_id === user3.id);

  const yesterdayTasks = [
    // User 1 - yesterday (all completed)
    {
      id: uuidv4(),
      day_entry_id: yesterdayEntry1.id,
      tenant_id: tenant1.id,
      title: 'Morning meeting',
      description: 'Team standup meeting',
      category: 'Meetings',
      priority: 1,
      is_completed: true,
      completed_at: new Date(yesterday),
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday),
    },
    {
      id: uuidv4(),
      day_entry_id: yesterdayEntry1.id,
      tenant_id: tenant1.id,
      title: 'Project A development',
      description: 'Work on new features',
      category: 'Development',
      priority: 2,
      is_completed: true,
      completed_at: new Date(yesterday),
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday),
    },
    // User 2 - yesterday (all completed)
    {
      id: uuidv4(),
      day_entry_id: yesterdayEntry2.id,
      tenant_id: tenant1.id,
      title: 'Code review',
      description: 'Review pull requests',
      category: 'Development',
      priority: 1,
      is_completed: true,
      completed_at: new Date(yesterday),
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday),
    },
    {
      id: uuidv4(),
      day_entry_id: yesterdayEntry2.id,
      tenant_id: tenant1.id,
      title: 'Documentation update',
      description: 'Update API documentation',
      category: 'Documentation',
      priority: 3,
      is_completed: true,
      completed_at: new Date(yesterday),
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday),
    },
    // User 3 - yesterday (all completed)
    {
      id: uuidv4(),
      day_entry_id: yesterdayEntry3.id,
      tenant_id: tenant2.id,
      title: 'Client call',
      description: 'Weekly sync with client',
      category: 'Meetings',
      priority: 1,
      is_completed: true,
      completed_at: new Date(yesterday),
      created_at: new Date(yesterday),
      updated_at: new Date(yesterday),
    },
  ];

  await knex('tasks').insert(yesterdayTasks);

  // Tasks for today (some incomplete with failure reasons)
  const todayEntry1 = dayEntries.find(e => e.date === today && e.user_id === user1.id);
  const todayEntry2 = dayEntries.find(e => e.date === today && e.user_id === user2.id);
  const todayEntry3 = dayEntries.find(e => e.date === today && e.user_id === user3.id);

  const todayTasks = [
    // User 1 - today (some incomplete)
    {
      id: uuidv4(),
      day_entry_id: todayEntry1.id,
      tenant_id: tenant1.id,
      title: 'Review requirements',
      description: 'Review new feature requirements',
      category: 'Planning',
      priority: 1,
      is_completed: true,
      completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      day_entry_id: todayEntry1.id,
      tenant_id: tenant1.id,
      title: 'Database migration',
      description: 'Run migration script',
      category: 'Development',
      priority: 2,
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      day_entry_id: todayEntry1.id,
      tenant_id: tenant1.id,
      title: 'Deploy to staging',
      description: 'Deploy new version to staging',
      category: 'Deployment',
      priority: 3,
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // User 2 - today (some incomplete)
    {
      id: uuidv4(),
      day_entry_id: todayEntry2.id,
      tenant_id: tenant1.id,
      title: 'Testing',
      description: 'Run integration tests',
      category: 'Testing',
      priority: 1,
      is_completed: true,
      completed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      day_entry_id: todayEntry2.id,
      tenant_id: tenant1.id,
      title: 'Bug fixes',
      description: 'Fix reported bugs',
      category: 'Development',
      priority: 2,
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    // User 3 - today (some incomplete)
    {
      id: uuidv4(),
      day_entry_id: todayEntry3.id,
      tenant_id: tenant2.id,
      title: 'Project planning',
      description: 'Plan next quarter',
      category: 'Planning',
      priority: 1,
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('tasks').insert(todayTasks);
};