const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' },
    });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, t.id as tenant_id, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is inactive' },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          tenant_id: user.tenant_id,
          tenant_name: user.tenant_name,
        },
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to login' },
    });
  }
};

const register = async (req, res) => {
  const { email, password, first_name, last_name, tenant_id, role = 'user' } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      error: { message: 'All fields are required' },
    });
  }

  if (!['user', 'tenant_admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid role' },
    });
  }

  try {
    // Check if tenant exists
    const tenantResult = await pool.query(
      'SELECT id FROM tenants WHERE id = $1',
      [tenant_id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User with this email already exists' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, role, tenant_id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to register' },
    });
  }
};

const me = async (req, res) => {
  const { userId, tenantId } = req;

  try {
    const result = await pool.query(
      `SELECT u.*, t.id as tenant_id, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
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
    console.error('Error getting user profile:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user profile' },
    });
  }
};

module.exports = {
  login,
  register,
  me,
};