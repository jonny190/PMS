const { pool } = require('../db');

// Extract tenant from request headers
const extractTenant = (req) => {
  // Try to get tenant from header first
  const tenantId = req.headers['x-tenant-id'];
  
  // If not in header, try to get from user object (after auth)
  if (!tenantId && req.user) {
    return req.user.tenantId;
  }
  
  return tenantId;
};

const setTenant = (req, res, next) => {
  const tenantId = extractTenant(req);
  
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tenant ID is required' },
    });
  }

  req.tenantId = tenantId;
  next();
};

const enforceTenantAccess = (allowedRoles = ['platform_admin', 'tenant_admin', 'user']) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
    }

    // Platform admins can access any tenant
    if (req.user.role === 'platform_admin') {
      return next();
    }

    // Other roles must access their own tenant
    const tenantId = extractTenant(req) || req.user.tenantId;
    
    if (req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied to this tenant' },
      });
    }

    req.tenantId = tenantId;
    next();
  };
};

// Helper to get tenant-specific data
const getTenantData = async (table, id, tenantId) => {
  const result = await pool.query(
    `SELECT * FROM ${table} WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return result.rows[0];
};

// Helper to filter by tenant in queries
const withTenant = (query, tenantId) => {
  return query.where(`${query.tableName}.tenant_id`, tenantId);
};

module.exports = { setTenant, enforceTenantAccess, getTenantData, withTenant };