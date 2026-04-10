const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' },
      });
    }

    // Find user by email
    const userResult = await pool.query(
      `SELECT 
        u.id, 
        u.email, 
        u.password_hash, 
        u.role, 
        u.tenant_id,
        u.is_active,
        t.slug as tenant_slug
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'User account is disabled' },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    // Verify tenant ID matches if provided
    if (tenantId && user.tenant_id !== tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantSlug: user.tenant_slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login time
    await pool.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
          tenantSlug: user.tenant_slug,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

// Register endpoint (for platform admin to create first users)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantId, role = 'user' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: { message: 'All fields are required' },
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already exists' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, tenant_id, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, tenant_id`,
      [email, hashedPassword, firstName, lastName, tenantId, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;