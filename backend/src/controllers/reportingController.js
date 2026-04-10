const { pool } = require('../db');

const getTenantStats = async (req, res) => {
  const { tenantId } = req;

  try {
    // Get total stats
    const totalResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT de.id) as total_day_entries,
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) as completed_tasks,
         COUNT(DISTINCT CASE WHEN NOT t.is_completed THEN t.id END) as incomplete_tasks
       FROM day_entries de
       LEFT JOIN tasks t ON de.id = t.day_entry_id
       WHERE de.tenant_id = $1`,
      [tenantId]
    );

    const totalStats = totalResult.rows[0];

    // Get failure reason breakdown
    const failureReasonResult = await pool.query(
      `SELECT fr.name as failure_reason, COUNT(tr.id) as count
       FROM failure_reasons fr
       LEFT JOIN task_results tr ON fr.id = tr.failure_reason_id
       WHERE fr.tenant_id = $1
       GROUP BY fr.name
       ORDER BY count DESC`,
      [tenantId]
    );

    // Get per-user stats
    const userStatsResult = await pool.query(
      `SELECT 
         u.id, u.first_name, u.last_name,
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) as completed_tasks,
         CASE 
           WHEN COUNT(DISTINCT t.id) = 0 THEN 0
           ELSE ROUND((COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END)::numeric / COUNT(DISTINCT t.id)::numeric) * 100)
         END as completion_rate
       FROM users u
       LEFT JOIN day_entries de ON u.id = de.user_id AND de.tenant_id = $1
       LEFT JOIN tasks t ON de.id = t.day_entry_id
       WHERE u.tenant_id = $1
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY u.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totals: {
          dayEntries: totalStats.total_day_entries,
          totalTasks: totalStats.total_tasks,
          completedTasks: totalStats.completed_tasks,
          incompleteTasks: totalStats.incomplete_tasks,
          completionRate: totalStats.total_tasks > 0 
            ? Math.round((totalStats.completed_tasks / totalStats.total_tasks) * 100) 
            : 0,
        },
        failureReasons: failureReasonResult.rows,
        userStats: userStatsResult.rows,
      },
    });
  } catch (err) {
    console.error('Error getting tenant stats:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get tenant stats' },
    });
  }
};

const getUserStats = async (req, res) => {
  const { tenantId, userId } = req;

  try {
    const result = await pool.query(
      `SELECT 
         COUNT(DISTINCT de.id) as total_days,
         COUNT(DISTINCT t.id) as total_tasks,
         COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END) as completed_tasks,
         COUNT(DISTINCT CASE WHEN NOT t.is_completed THEN t.id END) as incomplete_tasks,
         CASE 
           WHEN COUNT(DISTINCT t.id) = 0 THEN 0
           ELSE ROUND((COUNT(DISTINCT CASE WHEN t.is_completed THEN t.id END)::numeric / COUNT(DISTINCT t.id)::numeric) * 100)
         END as completion_rate
       FROM day_entries de
       LEFT JOIN tasks t ON de.id = t.day_entry_id
       WHERE de.tenant_id = $1 AND de.user_id = $2`,
      [tenantId, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error getting user stats:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user stats' },
    });
  }
};

module.exports = {
  getTenantStats,
  getUserStats,
};