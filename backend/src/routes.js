const express = require('express');
const router = express.Router();
const {
  login,
  register,
  me,
} = require('./controllers/authController');
const { authenticate, authorize } = require('./middleware/auth');
const {
  getAllTenants,
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant,
} = require('./controllers/tenantController');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('./controllers/userController');
const {
  getTodayEntry,
  createDayEntry,
  updateDayEntry,
  getDayEntries,
} = require('./controllers/dayEntryController');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('./controllers/taskController');
const {
  getFailureReasons,
  createFailureReason,
  updateFailureReason,
  deleteFailureReason,
} = require('./controllers/failureReasonController');
const {
  getTenantStats,
  getUserStats,
} = require('./controllers/reportingController');
const { setTenant } = require('./middleware/tenant');

// Public routes
router.post('/auth/login', login);
router.post('/auth/register', register);

// Authenticated routes
router.use(authenticate);

// Platform admin routes (no tenant required)
router.get('/platform/tenants', authorize('platform_admin'), getAllTenants);
router.post('/platform/tenants', authorize('platform_admin'), createTenant);
router.get('/platform/tenants/:id', authorize('platform_admin'), getTenant);
router.put('/platform/tenants/:id', authorize('platform_admin'), updateTenant);
router.delete('/platform/tenants/:id', authorize('platform_admin'), deleteTenant);

// Tenant routes (require tenant header)
router.use(setTenant);

// User management (tenant admin only)
router.get('/users', authorize('platform_admin', 'tenant_admin'), getAllUsers);
router.get('/users/:userId', authorize('platform_admin', 'tenant_admin'), getUser);
router.post('/users', authorize('platform_admin', 'tenant_admin'), createUser);
router.put('/users/:userId', authorize('platform_admin', 'tenant_admin'), updateUser);
router.delete('/users/:userId', authorize('platform_admin', 'tenant_admin'), deleteUser);

// Day entries
router.get('/day-entries/today', getTodayEntry);
router.post('/day-entries', createDayEntry);
router.put('/day-entries', updateDayEntry);
router.get('/day-entries', getDayEntries);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);

// Failure reasons
router.get('/failure-reasons', getFailureReasons);
router.post('/failure-reasons', createFailureReason);
router.put('/failure-reasons/:reasonId', updateFailureReason);
router.delete('/failure-reasons/:reasonId', deleteFailureReason);

// Reporting
router.get('/reports/tenant-stats', getTenantStats);
router.get('/reports/user-stats', getUserStats);

// Profile route
router.get('/me', me);

module.exports = router;