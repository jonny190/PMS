const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { setTenant } = require('../middleware/tenant');

const router = express.Router();

// Platform admin: Create a new tenant
router.post('/', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    const { name, slug, maxUsers = 10 } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and slug are required' },
      });
    }

    // Check if slug already exists
    const existingTenant = await pool.query(
      `SELECT id FROM tenants WHERE slug = $1`,
      [slug]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Tenant slug already exists' },
      });
    }

    // Insert tenant
    const result = await pool.query(
      `INSERT INTO tenants (name, slug, max_users, current_users)
       VALUES ($1, $2, $3, 0)
       RETURNING id, name, slug, max_users, current_users`,
      [name, slug, maxUsers]
    );

    const tenant = result.rows[0];

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    console.error('Create tenant error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Platform admin: Get all tenants
router.get('/', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    const tenants = await pool.query(
      `SELECT 
        id, 
        name, 
        slug, 
        max_users, 
        current_users,
        created_at
       FROM tenants
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: tenants.rows,
    });
  } catch (err) {
    console.error('Get tenants error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Platform admin: Get tenant by ID
router.get('/:id', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await pool.query(
      `SELECT 
        id, 
        name, 
        slug, 
        max_users, 
        current_users,
        created_at
       FROM tenants
       WHERE id = $1`,
      [id]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    res.json({
      success: true,
      data: tenant.rows[0],
    });
  } catch (err) {
    console.error('Get tenant error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Platform admin: Update tenant
router.put('/:id', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, maxUsers } = req.body;

    const tenant = await pool.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [id]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      values.push(name);
      updateFields.push(`name = $${values.length}`);
    }

    if (maxUsers !== undefined) {
      values.push(maxUsers);
      updateFields.push(`max_users = $${values.length}`);
    }

    if (values.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No fields to update' },
      });
    }

    values.push(id);
    const updateQuery = `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Platform admin: Delete tenant
router.delete('/:id', authenticate, authorize('platform_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await pool.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [id]
    );

    if (tenant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    await pool.query(`DELETE FROM tenants WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (err) {
    console.error('Delete tenant error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;