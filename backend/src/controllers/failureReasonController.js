const { pool } = require('../db');

const getFailureReasons = async (req, res) => {
  const { tenantId } = req;

  try {
    const result = await pool.query(
      `SELECT fr.*, COUNT(tr.id) as task_count
       FROM failure_reasons fr
       LEFT JOIN task_results tr ON fr.id = tr.failure_reason_id
       WHERE fr.tenant_id = $1
       GROUP BY fr.id
       ORDER BY fr.name ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error getting failure reasons:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get failure reasons' },
    });
  }
};

const createFailureReason = async (req, res) => {
  const { tenantId } = req;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Name is required' },
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO failure_reasons (tenant_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tenantId, name, description || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating failure reason:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create failure reason' },
    });
  }
};

const updateFailureReason = async (req, res) => {
  const { tenantId } = req;
  const { reasonId } = req.params;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE failure_reasons 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description)
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [name, description, reasonId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Failure reason not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating failure reason:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update failure reason' },
    });
  }
};

const deleteFailureReason = async (req, res) => {
  const { tenantId } = req;
  const { reasonId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM failure_reasons WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [reasonId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Failure reason not found' },
      });
    }

    res.json({
      success: true,
      message: 'Failure reason deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting failure reason:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete failure reason' },
    });
  }
};

module.exports = {
  getFailureReasons,
  createFailureReason,
  updateFailureReason,
  deleteFailureReason,
};