const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Serve frontend static files (after API routes so /api/* is not shadowed)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

// Run database migrations (idempotent SQL files)
const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory, skipping migrations');
    return;
  }
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }
  console.log('Migrations complete');
};

// Start server
const startServer = async () => {
  try {
    // Wait for database to be reachable (handles startup race with Postgres)
    let attempts = 0;
    while (true) {
      try {
        await pool.query('SELECT 1');
        break;
      } catch (err) {
        attempts += 1;
        if (attempts >= 30) throw err;
        console.log(`DB not ready (attempt ${attempts}), retrying in 2s...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    console.log('Database connected successfully');

    await runMigrations();

    // Run seeds if explicitly requested
    if (process.env.RUN_SEEDS === 'true') {
      console.log('RUN_SEEDS=true, running seed script...');
      try {
        const { seed } = require('./seeds');
        await seed();
      } catch (err) {
        console.error('Seed script error (continuing):', err.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;