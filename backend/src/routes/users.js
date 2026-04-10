const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Tenant admin: Get all users in tenant
router.get('/', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { tenantId: queryTenantId } = req.query;
    
    // Platform admins can specify tenant, others use their own tenant
    const tenantId = req.user.role === 'platform_admin' && queryTenantId 
      ? queryTenantId 
      : req.user.tenantId;

    // Verify platform admin can access the specified tenant
    if (req.user.role === 'platform_admin' && queryTenantId) {
      const tenant = await pool.query(`SELECT id FROM tenants WHERE id = $1`, [queryTenantId]);
      if (tenant.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Tenant not found' },
        });
      }
    }

    const users = await pool.query(
      `SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        is_active,
        last_login_at,
        created_at
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: users.rows,
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Get user by ID
router.get('/:id', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const user = await pool.query(
      `SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        is_active,
        last_login_at,
        created_at
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: user.rows[0],
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Create user
router.post('/', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;
    const tenantId = req.user.tenantId;

    // Check license limit for non-platform admins
    if (req.user.role !== 'platform_admin') {
      const tenant = await pool.query(`SELECT max_users, current_users FROM tenants WHERE id = $1`, [tenantId]);
      if (tenant.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Tenant not found' },
        });
      }

      if (tenant.rows[0].current_users >= tenant.rows[0].max_users) {
        return res.status(403).json({
          success: false,
          error: { message: 'License limit reached' },
        });
      }
    }

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, first name, and last name are required' },
      });
    }

    // Check if email already exists in tenant
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already exists in this tenant' },
      });
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, tenant_id, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active`,
      [email, hashedPassword, firstName, lastName, tenantId, role]
    );

    // Update current users count
    await pool.query(
      `UPDATE tenants SET current_users = current_users + 1 WHERE id = $1`,
      [tenantId]
    );

    res.status(201).json({
      success: true,
      data: {
        user: result.rows[0],
        tempPassword: role !== 'platform_admin' ? tempPassword : undefined,
      },
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Update user
router.put('/:id', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;
    const tenantId = req.user.tenantId;

    // Check if user exists and belongs to tenant
    const user = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const updateFields = [];
    const values = [];

    if (firstName !== undefined) {
      values.push(firstName);
      updateFields.push(`first_name = $${values.length}`);
    }

    if (lastName !== undefined) {
      values.push(lastName);
      updateFields.push(`last_name = $${values.length}`);
    }

    if (role !== undefined) {
      values.push(role);
      updateFields.push(`role = $${values.length}`);
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
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Tenant admin: Delete user
router.delete('/:id', authenticate, authorize('platform_admin', 'tenant_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Check if user exists
    const user = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Delete user
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    // Update current users count
    await pool.query(
      `UPDATE tenants SET current_users = current_users - 1 WHERE id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;