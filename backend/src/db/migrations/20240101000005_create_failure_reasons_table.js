/**
 * Create failure_reasons table
 */
exports.up = (knex) => {
  return knex.schema.createTable('failure_reasons', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid_generate_v4());
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description').nullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('failure_reasons');
};