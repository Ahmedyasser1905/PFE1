import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import errorHandler from './middlewares/error.js';
import { langMiddleware } from './middlewares/lang.middleware.js';

// Auth routes
import authRoutes from './routes/auth/auth.route.js';
import planRoutes from './routes/auth/plans.routes.js';
import subscriptionRoutes from './routes/auth/subscription.route.js';
import settingRoutes from './routes/auth/settings.js';

// External service routes
import materialRoutes from './routes/externalService/materials.routes.js';
import serviceRoutes from './routes/externalService/services.route.js';

import unitsRouter from './routes/units.routes.js';
// Estimation module
import estimationRoutes from './routes/calculation/routes.js';

// AI routes
import chatRoutes from './routes/Ai/chat.route.js';

// Admin modules (categories / formulas / fields / outputs / coefficients)
import modulesRouter from './routes/modules.routes.js';

// Admin dashboard + subscribers
import adminRouter from './routes/admin.routes.js';

// ─── Blogger ────────────────────────────────────────────
import blogRoutes from './routes/blog/blog.routes.js';
import uploadRoutes from './routes/blog/upload.routes.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// React Native / APK clients don't send an Origin header (or send "null"),
// so we must allow ALL origins. This is safe for a mobile-only backend.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  credentials: false,   // must be false when origin is '*'
}));
// NOTE: app.options('*', cors()) removed — Express 5 path-to-regexp v8
// rejects '*' as an invalid pattern. The cors() middleware above already
// handles OPTIONS pre-flight for all origins.
app.use(express.json());

// ─── Language detection (must come before all routes) ─────────────────────────
app.use(langMiddleware);

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', planRoutes);
app.use('/api', subscriptionRoutes);

// ─── Admin settings ───────────────────────────────────────────────────────────
app.use('/api/settings', settingRoutes);

// ─── External services ────────────────────────────────────────────────────────
app.use('/api/materials', materialRoutes);
app.use('/api/services', serviceRoutes);

// ─── Estimation engine ────────────────────────────────────────────────────────
app.use('/api', estimationRoutes);

// ─── AI Chat ──────────────────────────────────────────────────────────────────
app.use('/api/ai', chatRoutes);

// ─── Admin: modules (categories / formulas / formula outputs / fields …) ─────
app.use('/api/admin/modules', modulesRouter);
app.use('/api/units', unitsRouter);

// ─── Admin: dashboard stats + subscribers ─────────────────────────────────────
app.use('/api/admin', adminRouter);

app.use('/api', blogRoutes);
app.use('/api', uploadRoutes);

// ─── Health Check / Root Welcome (must be BEFORE error handler) ───────────────
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Apex API is running successfully!' });
});

// ─── 404 fallback (before error handler) ──────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
