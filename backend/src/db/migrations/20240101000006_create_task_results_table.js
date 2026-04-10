/**
 * Create task_results table for storing failure reasons and notes
 */
exports.up = (knex) => {
  return knex.schema.createTable('task_results', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid_generate_v4());
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('failure_reason_id').nullable().references('id').inTable('failure_reasons');
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = (knex) => {
  return knex.schema.dropTable('task_results');
};