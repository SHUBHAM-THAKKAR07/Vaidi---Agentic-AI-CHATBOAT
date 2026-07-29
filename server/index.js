// Load .env manually — handles UTF-8 and UTF-16LE (BOM) encodings
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath);
  const isUtf16 = (raw[0] === 0xFF && raw[1] === 0xFE) ||
                  (raw.length > 4 && raw[1] === 0x00 && raw[3] === 0x00);
  const text = isUtf16 ? raw.toString('utf16le') : raw.toString('utf8');
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.replace(/^\uFEFF/, '').trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.substring(0, eq).trim();
    const val = trimmed.substring(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const triageRoutes = require('./routes/triage');
const teleconsultRoutes = require('./routes/teleconsult');
const workerRoutes = require('./routes/worker');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow frontend dev server
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/teleconsult', teleconsultRoutes);
app.use('/api/worker', workerRoutes);

// Health check (moved under /api so it doesn't clash with the frontend route)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vaidi Health API', timestamp: new Date().toISOString() });
});

// ---- Serve the built React app (client/dist) ----
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// Any non-API GET request falls through to the React app (client-side routing)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 404 for unmatched /api/* routes only
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  next();
});

// Global error handler — never expose stack traces
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`✓ Vaidi Health API running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.WATSONX_API_KEY) {
    console.warn('  ⚠ WATSONX_API_KEY not set — AI features will be unavailable');
  }
});