const { pool } = require('../db');

const getTodayEntry = async (req, res) => {
  const { tenantId, userId } = req;

  try {
    const result = await pool.query(
      `SELECT * FROM day_entries 
       WHERE tenant_id = $1 AND user_id = $2 
       AND entry_date = CURRENT_DATE
       LIMIT 1`,
      [tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        data: null,
        message: 'No day entry found for today',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error getting day entry:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get day entry' },
    });
  }
};

const createDayEntry = async (req, res) => {
  const { tenantId, userId } = req;

  try {
    // Check if entry already exists for today
    const existing = await pool.query(
      `SELECT id FROM day_entries 
       WHERE tenant_id = $1 AND user_id = $2 
       AND entry_date = CURRENT_DATE`,
      [tenantId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Day entry already created for today' },
      });
    }

    const result = await pool.query(
      `INSERT INTO day_entries (tenant_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [tenantId, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating day entry:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create day entry' },
    });
  }
};

const updateDayEntry = async (req, res) => {
  const { tenantId, userId } = req;
  const { id, is_closed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE day_entries 
       SET is_closed = COALESCE($1, is_closed)
       WHERE id = $2 AND tenant_id = $3 AND user_id = $4
       RETURNING *`,
      [is_closed, id, tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Day entry not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating day entry:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update day entry' },
    });
  }
};

const getDayEntries = async (req, res) => {
  const { tenantId } = req;
  const { userId } = req.query;

  try {
    let result;
    if (userId) {
      result = await pool.query(
        `SELECT de.*, u.first_name, u.last_name
         FROM day_entries de
         JOIN users u ON de.user_id = u.id
         WHERE de.tenant_id = $1 AND de.user_id = $2
         ORDER BY de.entry_date DESC`,
        [tenantId, userId]
      );
    } else {
      result = await pool.query(
        `SELECT de.*, u.first_name, u.last_name
         FROM day_entries de
         JOIN users u ON de.user_id = u.id
         WHERE de.tenant_id = $1
         ORDER BY de.entry_date DESC`,
        [tenantId]
      );
    }

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error getting day entries:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get day entries' },
    });
  }
};

module.exports = {
  getTodayEntry,
  createDayEntry,
  updateDayEntry,
  getDayEntries,
};