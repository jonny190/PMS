const { pool } = require('../db');
const bcrypt = require('bcrypt');

const getAllTenants = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
             (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
             (SELECT COUNT(*) FROM day_entries d WHERE d.tenant_id = t.id) as day_entry_count
       FROM tenants t
       ORDER BY t.created_at DESC`
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error getting tenants:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get tenants' },
    });
  }
};

const createTenant = async (req, res) => {
  const { name, max_users = 10, domain } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tenant name is required' },
    });
  }

  try {
    // Check if tenant already exists
    const existingTenant = await pool.query(
      'SELECT id FROM tenants WHERE name = $1',
      [name]
    );

    if (existingTenant.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant with this name already exists' },
      });
    }

    const result = await pool.query(
      `INSERT INTO tenants (name, max_users, domain)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, max_users, domain || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating tenant:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create tenant' },
    });
  }
};

const getTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.*, 
             (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
             (SELECT COUNT(*) FROM day_entries d WHERE d.tenant_id = t.id) as day_entry_count
       FROM tenants t
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error getting tenant:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get tenant' },
    });
  }
};

const updateTenant = async (req, res) => {
  const { id } = req.params;
  const { name, max_users } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tenants 
       SET name = COALESCE($1, name), 
           max_users = COALESCE($2, max_users)
       WHERE id = $3
       RETURNING *`,
      [name, max_users, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating tenant:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update tenant' },
    });
  }
};

const deleteTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tenants WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' },
      });
    }

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting tenant:', err);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete tenant' },
    });
  }
};

module.exports = {
  getAllTenants,
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant,
};