const express = require('express');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const { notFoundHandler, errorHandler } = require('./common/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
