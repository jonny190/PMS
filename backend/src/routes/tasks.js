const express = require('express');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get tasks for a day entry
router.get('/day-entry/:dayEntryId', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { dayEntryId } = req.params;
    const tenantId = req.user.tenantId;

    // Verify day entry belongs to user's tenant
    const dayEntry = await pool.query(
      `SELECT id, user_id, tenant_id FROM day_entries WHERE id = $1`,
      [dayEntryId]
    );

    if (dayEntry.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Day entry not found' },
      });
    }

    if (dayEntry.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Get tasks with their results
    const tasks = await pool.query(
      `SELECT 
        t.id,
        t.day_entry_id,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.is_completed,
        t.completed_at,
        t.created_at,
        tr.failure_reason_id,
        tr.notes,
        fr.name as failure_reason_name,
        fr.description as failure_reason_description
       FROM tasks t
       LEFT JOIN task_results tr ON t.id = tr.task_id
       LEFT JOIN failure_reasons fr ON tr.failure_reason_id = fr.id
       WHERE t.day_entry_id = $1
       ORDER BY t.is_completed ASC, t.priority ASC, t.created_at ASC`,
      [dayEntryId]
    );

    res.json({
      success: true,
      data: tasks.rows,
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Create task
router.post('/', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { dayEntryId, title, description, category, priority = 0 } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    // Verify day entry belongs to user
    const dayEntry = await pool.query(
      `SELECT id, user_id, tenant_id FROM day_entries WHERE id = $1`,
      [dayEntryId]
    );

    if (dayEntry.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Day entry not found' },
      });
    }

    if (dayEntry.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Create task
    const result = await pool.query(
      `INSERT INTO tasks (day_entry_id, tenant_id, title, description, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [dayEntryId, tenantId, title, description, category, priority]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Update task
router.put('/:id', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, isCompleted } = req.body;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    // Verify task belongs to user
    const task = await pool.query(
      `SELECT t.id, t.day_entry_id, t.tenant_id, u.id as user_id 
       FROM tasks t
       JOIN day_entries de ON t.day_entry_id = de.id
       JOIN users u ON de.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found' },
      });
    }

    if (task.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    if (task.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      values.push(title);
      updateFields.push(`title = $${values.length}`);
    }

    if (description !== undefined) {
      values.push(description);
      updateFields.push(`description = $${values.length}`);
    }

    if (category !== undefined) {
      values.push(category);
      updateFields.push(`category = $${values.length}`);
    }

    if (priority !== undefined) {
      values.push(priority);
      updateFields.push(`priority = $${values.length}`);
    }

    if (isCompleted !== undefined) {
      values.push(isCompleted);
      updateFields.push(`is_completed = $${values.length}`);
      if (isCompleted) {
        values.push(new Date());
        updateFields.push(`completed_at = $${values.length}`);
      } else {
        updateFields.push(`completed_at = NULL`);
      }
    }

    if (values.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No fields to update' },
      });
    }

    values.push(id);
    const updateQuery = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Delete task
router.delete('/:id', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    // Verify task belongs to user
    const task = await pool.query(
      `SELECT t.id, t.day_entry_id, t.tenant_id, u.id as user_id 
       FROM tasks t
       JOIN day_entries de ON t.day_entry_id = de.id
       JOIN users u ON de.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found' },
      });
    }

    if (task.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    if (task.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Delete task
    await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;