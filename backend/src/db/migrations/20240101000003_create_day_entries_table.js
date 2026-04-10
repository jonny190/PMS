/**
 * Create day_entries table
 */
exports.up = (knex) => {
  return knex.schema.createTable('day_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid_generate_v4());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.date('date').notNullable();
    table.timestamp('start_time').nullable();
    table.timestamp('end_time').nullable();
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Composite unique constraint: one entry per user per day
    table.unique(['user_id', 'date']);
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('day_entries');
};