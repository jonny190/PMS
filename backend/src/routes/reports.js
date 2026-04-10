const express = require('express');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Tenant admin: Get daily report
router.get('/daily', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    // Get total tasks and completed tasks
    const tasksResult = await pool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN t.is_completed THEN 1 ELSE 0 END) as completed_tasks,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((SUM(CASE WHEN t.is_completed THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2)
          ELSE 0 
        END as completion_rate
       FROM tasks t
       JOIN day_entries de ON t.day_entry_id = de.id
       WHERE de.tenant_id = $1 AND de.date = $2`,
      [tenantId, reportDate]
    );

    // Get failure reasons breakdown
    const failureReasonsResult = await pool.query(
      `SELECT 
        fr.name as failure_reason,
        COUNT(tr.id) as count
       FROM failure_reasons fr
       LEFT JOIN task_results tr ON fr.id = tr.failure_reason_id
       LEFT JOIN tasks t ON tr.task_id = t.id
       LEFT JOIN day_entries de ON t.day_entry_id = de.id
       WHERE fr.tenant_id = $1 AND fr.is_active = true
       GROUP BY fr.name, fr.id
       ORDER BY count DESC`,
      [tenantId]
    );

    // Get per-user summary
    const userSummaryResult = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) as completed_tasks,
        CASE 
          WHEN COUNT(DISTINCT t.id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END)::numeric / COUNT(DISTINCT t.id)) * 100, 2)
          ELSE 0 
        END as completion_rate
       FROM users u
       JOIN day_entries de ON u.id = de.user_id
       JOIN tasks t ON de.id = t.day_entry_id
       WHERE u.tenant_id = $1 AND de.date = $2
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY completion_rate DESC`,
      [tenantId, reportDate]
    );

    res.json({
      success: true,
      data: {
        date: reportDate,
        summary: {
          total_tasks: parseInt(tasksResult.rows[0].total_tasks) || 0,
          completed_tasks: parseInt(tasksResult.rows[0].completed_tasks) || 0,
          completion_rate: parseFloat(tasksResult.rows[0].completion_rate) || 0,
        },
        failure_reasons: failureReasonsResult.rows,
        users: userSummaryResult.rows,
      },
    });
  } catch (err) {
    console.error('Get daily report error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Get weekly report
router.get('/weekly', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { weekStart } = req.query;
    const startOfWeek = weekStart || new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const result = await pool.query(
      `SELECT 
        de.date,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) as completed_tasks,
        CASE 
          WHEN COUNT(DISTINCT t.id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END)::numeric / COUNT(DISTINCT t.id)) * 100, 2)
          ELSE 0 
        END as completion_rate
       FROM day_entries de
       JOIN tasks t ON de.id = t.day_entry_id
       WHERE de.tenant_id = $1 
         AND de.date >= $2 
         AND de.date <= $3
       GROUP BY de.date
       ORDER BY de.date DESC`,
      [tenantId, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]
    );

    res.json({
      success: true,
      data: {
        week_start: startOfWeek.toISOString().split('T')[0],
        week_end: endOfWeek.toISOString().split('T')[0],
        days: result.rows,
      },
    });
  } catch (err) {
    console.error('Get weekly report error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Platform admin: Get platform overview
router.get('/platform', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    // Get tenant statistics
    const tenantStats = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.slug,
        t.max_users,
        t.current_users,
        t.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT de.id) as total_day_entries,
        COUNT(DISTINCT CASE WHEN de.is_completed THEN de.id END) as completed_day_entries
       FROM tenants t
       LEFT JOIN users u ON t.id = u.tenant_id
       LEFT JOIN day_entries de ON t.id = de.tenant_id
       GROUP BY t.id, t.name, t.slug, t.max_users, t.current_users, t.created_at
       ORDER BY t.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        tenants: tenantStats.rows,
        total_tenants: tenantStats.rows.length,
      },
    });
  } catch (err) {
    console.error('Get platform report error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;