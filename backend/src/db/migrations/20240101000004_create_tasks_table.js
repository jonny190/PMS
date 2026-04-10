/**
 * Create tasks table
 */
exports.up = (knex) => {
  return knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid_generate_v4());
    table.uuid('day_entry_id').notNullable().references('id').inTable('day_entries').onDelete('CASCADE');
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').nullable();
    table.string('category').nullable();
    table.integer('priority').notNullable().defaultTo(0);
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('tasks');
};