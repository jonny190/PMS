const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Starting database seed...');

    // Create demo tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, max_users, domain)
       VALUES ('Demo Company', 50, 'demo')
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      []
    );
    const tenantId = tenantResult.rows[0]?.id;

    if (!tenantId) {
      console.log('Tenant already exists, skipping...');
    } else {
      console.log('Created demo tenant with ID:', tenantId);
    }

    // Create platform admin
    const platformAdminResult = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, tenant_id, is_active)
       VALUES ('platform@admin.com', $1, 'Platform', 'Admin', 'platform_admin', NULL, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [await bcrypt.hash('password123', 10)]
    );
    console.log('Platform admin created');

    // Create demo tenant admin
    const tenantAdminResult = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, tenant_id, is_active)
       VALUES ('admin@example.com', $1, 'John', 'Admin', 'tenant_admin', $2, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [await bcrypt.hash('password123', 10), tenantId]
    );
    console.log('Tenant admin created');

    // Create demo users
    const demoUsers = [
      { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
      { email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson' },
      { email: 'charlie@example.com', firstName: 'Charlie', lastName: 'Brown' },
    ];

    for (const user of demoUsers) {
      await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, role, tenant_id, is_active)
         VALUES ($1, $2, $3, $4, 'user', $5, true)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.email,
          await bcrypt.hash('password123', 10),
          user.firstName,
          user.lastName,
          tenantId,
        ]
      );
      console.log(`Created user: ${user.email}`);
    }

    // Create failure reasons
    const failureReasons = ['Weather', 'Staffing', 'Equipment', 'Other'];
    for (const reason of failureReasons) {
      await pool.query(
        `INSERT INTO failure_reasons (tenant_id, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [tenantId, reason, `${reason} description`]
      );
    }
    console.log('Created failure reasons');

    console.log('Database seed completed!');
    console.log('\nDemo credentials:');
    console.log('Platform Admin: platform@admin.com / password123');
    console.log('Tenant Admin: admin@example.com / password123');
    console.log('User: alice@example.com / password123');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();