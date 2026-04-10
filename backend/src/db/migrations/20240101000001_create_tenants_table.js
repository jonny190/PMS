/**
 * Create tenants table
 */
exports.up = (knex) => {
  return knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid_generate_v4());
    table.string('name').notNullable();
    table.string('slug').notNullable().unique();
    table.integer('max_users').notNullable().defaultTo(10);
    table.integer('current_users').notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('tenants');
};