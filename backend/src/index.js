require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
// __dirname = <repo>/backend/src — so build is at <repo>/frontend/build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '..', '..', 'frontend', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Bind to 0.0.0.0 so Railway's proxy can reach the process
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Interview Trainer API running on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://0.0.0.0:${PORT}/health`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   Model:  ${process.env.WATSONX_MODEL_ID || 'ibm/granite-3-3-8b-instruct'}\n`);
});

module.exports = app;
