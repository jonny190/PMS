const express = require('express');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get today's day entry for the user
router.get('/today', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        de.id,
        de.date,
        de.start_time,
        de.end_time,
        de.is_completed,
        de.created_at,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id AND is_completed = true) as completed_tasks
       FROM day_entries de
       WHERE de.user_id = $1 
         AND de.tenant_id = $2 
         AND de.date = $3`,
      [userId, tenantId, today]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Get today entry error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Get or create day entry for a specific date
router.get('/:date', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    // Check if entry exists
    let result = await pool.query(
      `SELECT id FROM day_entries WHERE user_id = $1 AND tenant_id = $2 AND date = $3`,
      [userId, tenantId, date]
    );

    if (result.rows.length === 0) {
      // Create new entry
      result = await pool.query(
        `INSERT INTO day_entries (user_id, tenant_id, date)
         VALUES ($1, $2, $3)
         RETURNING id, date, start_time, end_time, is_completed, created_at`,
        [userId, tenantId, date]
      );
    }

    // Get entry with task counts
    const entryResult = await pool.query(
      `SELECT 
        de.id,
        de.date,
        de.start_time,
        de.end_time,
        de.is_completed,
        de.created_at,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id AND is_completed = true) as completed_tasks
       FROM day_entries de
       WHERE de.id = $1`,
      [result.rows[0].id]
    );

    res.json({
      success: true,
      data: entryResult.rows[0],
    });
  } catch (err) {
    console.error('Get/create day entry error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Start day entry
router.post('/start', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Check if entry exists
    let result = await pool.query(
      `SELECT id FROM day_entries WHERE user_id = $1 AND tenant_id = $2 AND date = $3`,
      [userId, tenantId, entryDate]
    );

    if (result.rows.length === 0) {
      // Create new entry
      result = await pool.query(
        `INSERT INTO day_entries (user_id, tenant_id, date, start_time)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, date, start_time, end_time, is_completed, created_at`,
        [userId, tenantId, entryDate]
      );
    } else {
      // Update existing entry start time if not set
      result = await pool.query(
        `UPDATE day_entries 
         SET start_time = COALESCE(start_time, NOW())
         WHERE id = $1
         RETURNING id, date, start_time, end_time, is_completed, created_at`,
        [result.rows[0].id]
      );
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Start day entry error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// End day entry
router.post('/end', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Check if entry exists
    const result = await pool.query(
      `SELECT id, is_completed FROM day_entries WHERE user_id = $1 AND tenant_id = $2 AND date = $3`,
      [userId, tenantId, entryDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Day entry not found' },
      });
    }

    if (result.rows[0].is_completed) {
      return res.status(400).json({
        success: false,
        error: { message: 'Day entry already completed' },
      });
    }

    // Update entry
    const updateResult = await pool.query(
      `UPDATE day_entries 
       SET end_time = NOW(), is_completed = true, completed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [result.rows[0].id]
    );

    res.json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (err) {
    console.error('End day entry error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Get user's day entries (for admin view)
router.get('/user/:userId', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user.tenantId;
    const { limit = 30, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        de.id,
        de.date,
        de.start_time,
        de.end_time,
        de.is_completed,
        de.created_at,
        u.first_name,
        u.last_name,
        u.email,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE day_entry_id = de.id AND is_completed = true) as completed_tasks
       FROM day_entries de
       JOIN users u ON de.user_id = u.id
       WHERE de.user_id = $1 AND de.tenant_id = $2
       ORDER BY de.date DESC
       LIMIT $3 OFFSET $4`,
      [userId, tenantId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM day_entries WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    res.json({
      success: true,
      data: {
        entries: result.rows,
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Get user day entries error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;