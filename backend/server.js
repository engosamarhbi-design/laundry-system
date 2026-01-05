// =====================================================
// نظام إدارة المغاسل - السيرفر الرئيسي
// =====================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// تحميل متغيرات البيئة
dotenv.config();

const app = express();

// =====================================================
// Middleware
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger بسيط
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =====================================================
// Routes
// =====================================================

const servicesRoutes = require('./routes/services');
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const branchesRoutes = require('./routes/branches');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const subscriptionsRoutes = require('./routes/subscriptions');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');
const cashDrawerRoutes = require('./routes/cashDrawer');

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cash-drawer', cashDrawerRoutes);

// =====================================================
// Serve Frontend (if built)
// =====================================================

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));

  // SPA fallback (exclude API routes)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(frontendIndexPath);
  });
}

// =====================================================
// Health Check
// =====================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'نظام إدارة المغاسل يعمل بنجاح',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// Error Handler
// =====================================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

// =====================================================
// Start Server
// =====================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
  =====================================================
  🧺 نظام إدارة المغاسل - API Server
  =====================================================
  ✅ Server running on port ${PORT}
  📍 http://localhost:${PORT}
  📍 API: http://localhost:${PORT}/api
  =====================================================
  `);
});

module.exports = app;
