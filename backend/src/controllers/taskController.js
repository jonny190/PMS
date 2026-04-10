const { pool } = require('../db');

const getTasks = async (req, res) => {
  const { tenantId, userId } = req;
  const { dayEntryId } = req.query;

  try {
    let result;
    if (dayEntryId) {
      result = await pool.query(
        `SELECT t.*, tr.failure_reason_id, tr.note, fr.name as failure_reason_name
         FROM tasks t
         LEFT JOIN task_results tr ON t.id = tr.task_id
         LEFT JOIN failure_reasons fr ON tr.failure_reason_id = fr.id
         WHERE t.day_entry_id = $1 AND t.tenant_id = $2
         ORDER BY t.created_at ASC`,
        [dayEntryId, tenantId]
      );
    } else {
      result = await pool.query(
        `SELECT t.*, tr.failure_reason_id, tr.note, fr.name as failure_reason_name
         FROM tasks t
         LEFT JOIN task_results tr ON t.id = tr.task_id
         LEFT JOIN failure_reasons fr ON tr.failure_reason_id = fr.id
         WHERE t.tenant_id = $1 AND t.user_id = $2
         ORDER BY t.created_at ASC`,
        [tenantId, userId]
      );
    }

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error getting tasks:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get tasks' },
    });
  }
};

const createTask = async (req, res) => {
  const { tenantId, userId } = req;
  const { day_entry_id, title, category } = req.body;

  if (!day_entry_id || !title) {
    return res.status(400).json({
      success: false,
      error: { message: 'Day entry ID and title are required' },
    });
  }

  // Verify day entry belongs to user
  const dayEntryCheck = await pool.query(
    'SELECT id FROM day_entries WHERE id = $1 AND tenant_id = $2 AND user_id = $3',
    [day_entry_id, tenantId, userId]
  );

  if (dayEntryCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: { message: 'Day entry not found or access denied' },
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (day_entry_id, tenant_id, user_id, title, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [day_entry_id, tenantId, userId, title, category || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create task' },
    });
  }
};

const updateTask = async (req, res) => {
  const { tenantId, userId } = req;
  const { taskId } = req.params;
  const { is_completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET is_completed = COALESCE($1, is_completed)
       WHERE id = $2 AND tenant_id = $3 AND user_id = $4
       RETURNING *`,
      [is_completed, taskId, tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update task' },
    });
  }
};

const deleteTask = async (req, res) => {
  const { tenantId, userId } = req;
  const { taskId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 AND user_id = $3 RETURNING id',
      [taskId, tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found' },
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete task' },
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};