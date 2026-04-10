const express = require('express');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get failure reasons for tenant
router.get('/', authenticate, authorize('platform_admin', 'tenant_admin', 'user'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const failureReasons = await pool.query(
      `SELECT 
        id,
        tenant_id,
        name,
        description,
        sort_order,
        is_active,
        created_at
       FROM failure_reasons
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY sort_order ASC, name ASC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: failureReasons.rows,
    });
  } catch (err) {
    console.error('Get failure reasons error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Create failure reason
router.post('/', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { name, description, sortOrder = 0, isActive = true } = req.body;
    const tenantId = req.user.tenantId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name is required' },
      });
    }

    const result = await pool.query(
      `INSERT INTO failure_reasons (tenant_id, name, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, name, description, sortOrder, isActive]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Create failure reason error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Update failure reason
router.put('/:id', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;
    const tenantId = req.user.tenantId;

    // Verify failure reason belongs to tenant
    const failureReason = await pool.query(
      `SELECT id FROM failure_reasons WHERE id = $1`,
      [id]
    );

    if (failureReason.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Failure reason not found' },
      });
    }

    if (failureReason.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      values.push(name);
      updateFields.push(`name = $${values.length}`);
    }

    if (description !== undefined) {
      values.push(description);
      updateFields.push(`description = $${values.length}`);
    }

    if (sortOrder !== undefined) {
      values.push(sortOrder);
      updateFields.push(`sort_order = $${values.length}`);
    }

    if (isActive !== undefined) {
      values.push(isActive);
      updateFields.push(`is_active = $${values.length}`);
    }

    if (values.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No fields to update' },
      });
    }

    values.push(id);
    const updateQuery = `UPDATE failure_reasons SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update failure reason error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Delete failure reason
router.delete('/:id', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Verify failure reason belongs to tenant
    const failureReason = await pool.query(
      `SELECT id, tenant_id FROM failure_reasons WHERE id = $1`,
      [id]
    );

    if (failureReason.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Failure reason not found' },
      });
    }

    if (failureReason.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Soft delete (set is_active = false)
    await pool.query(
      `UPDATE failure_reasons SET is_active = false WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Failure reason deleted successfully',
    });
  } catch (err) {
    console.error('Delete failure reason error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;