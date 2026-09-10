const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getIsConnected } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/seed', require('./routes/seedRoutes'));

// Enterprise Feature Routes (Additive & Isolated)
app.use('/api/documents', require('./routes/salesDocumentRoutes'));
app.use('/api/inventory-advanced', require('./routes/inventoryAdvancedRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/ledger', require('./routes/customerLedgerRoutes'));
app.use('/api/gst', require('./routes/gstRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Universal Retail POS Backend API',
    mongoConnected: getIsConnected(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Universal Retail POS API Service');
});

// Start Server locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Universal Retail POS Server running on port ${PORT}`);
    console.log(` API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
}

// Export for Vercel Serverless Function
module.exports = app;