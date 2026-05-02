// server.js - Main server file
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const dotenv = require('dotenv');

// Routes
const conversationsRoutes = require('./routes/conversations');
const agentsRoutes = require('./routes/agents');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const analyticsRoutes = require('./routes/analytics');
const metricsRoutes = require('./routes/metrics');
const interveneRoutes = require('./routes/intervene');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// WebSocket handlers
const socketHandler = require('./websocket/socketHandler');

// Config
dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zangoh';

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api/conversations', conversationsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/intervene', interveneRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', socketHandler);

const { MongoMemoryServer } = require('mongodb-memory-server');

async function startServer() {
  let uri = MONGODB_URI;
  if (uri.includes('localhost') || uri.includes('mongodb:27017')) {
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log(`Using in-memory MongoDB at ${uri}`);
  }

  mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed the database if using in-memory db
    if (uri.includes('127.0.0.1')) {
      const seedDatabase = require('./utils/seed');
      await seedDatabase(uri, false);
    }
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});









