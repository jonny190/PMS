/**
 * Add indexes for better query performance
 */
exports.up = (knex) => {
  return knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_tasks_day_entry_id ON tasks(day_entry_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks(is_completed);
    CREATE INDEX IF NOT EXISTS idx_day_entries_user_id ON day_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_day_entries_tenant_id ON day_entries(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_day_entries_date ON day_entries(date);
    CREATE INDEX IF NOT EXISTS idx_failure_reasons_tenant_id ON failure_reasons(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_task_results_task_id ON task_results(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_results_tenant_id ON task_results(tenant_id);
  `);
};

exports.down = (knex) => {
  return knex.schema.raw(`
    DROP INDEX IF EXISTS idx_tasks_day_entry_id;
    DROP INDEX IF EXISTS idx_tasks_tenant_id;
    DROP INDEX IF EXISTS idx_tasks_is_completed;
    DROP INDEX IF EXISTS idx_day_entries_user_id;
    DROP INDEX IF EXISTS idx_day_entries_tenant_id;
    DROP INDEX IF EXISTS idx_day_entries_date;
    DROP INDEX IF EXISTS idx_failure_reasons_tenant_id;
    DROP INDEX IF EXISTS idx_users_tenant_id;
    DROP INDEX IF EXISTS idx_task_results_task_id;
    DROP INDEX IF EXISTS idx_task_results_tenant_id;
  `);
};