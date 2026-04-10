const { pool } = require('../db');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
  const { tenantId } = req;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
              u.created_at, u.updated_at
       FROM users u
       WHERE u.tenant_id = $1
       ORDER BY u.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get users' },
    });
  }
};

const getUser = async (req, res) => {
  const { userId } = req.params;
  const { tenantId } = req;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
              u.created_at, u.updated_at
       FROM users u
       WHERE u.id = $1 AND u.tenant_id = $2`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user' },
    });
  }
};

const createUser = async (req, res) => {
  const { tenantId } = req;
  const { email, password, first_name, last_name, role = 'user' } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      error: { message: 'All fields are required: email, password, first_name, last_name' },
    });
  }

  if (!['user', 'tenant_admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid role. Must be "user" or "tenant_admin"' },
    });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User with this email already exists' },
      });
    }

    // Check license limit
    const licenseResult = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );
    const maxUsers = licenseResult.rows[0].max_users;

    const userCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    const userCount = parseInt(userCountResult.rows[0].count);

    if (userCount >= maxUsers) {
      return res.status(400).json({
        success: false,
        error: { message: 'License limit reached. Cannot create more users.' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, role, tenantId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create user' },
    });
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { tenantId } = req;
  const { email, first_name, last_name, role, is_active } = req.body;

  try {
    // Check if user belongs to tenant
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email) {
      values.push(email);
      updates.push(`email = $${paramIndex++}`);
    }
    if (first_name) {
      values.push(first_name);
      updates.push(`first_name = $${paramIndex++}`);
    }
    if (last_name) {
      values.push(last_name);
      updates.push(`last_name = $${paramIndex++}`);
    }
    if (role) {
      if (!['user', 'tenant_admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid role' },
        });
      }
      values.push(role);
      updates.push(`role = $${paramIndex++}`);
    }
    if (is_active !== undefined) {
      values.push(is_active);
      updates.push(`is_active = $${paramIndex++}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No fields to update' },
      });
    }

    values.push(userId);
    values.push(tenantId);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user' },
    });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  const { tenantId } = req;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete user' },
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};