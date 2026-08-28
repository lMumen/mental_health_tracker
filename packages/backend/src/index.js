import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { getDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import logRoutes from './routes/logRoutes.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Pass WebSockets instance to Express app
app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/log', logRoutes);
app.use('/api/logs', logRoutes);

// Database initialization
getDb().catch(console.error);

// WebSockets Connection Logic
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(userId);
    console.log(`User connected to room: ${userId}`);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend server listening on http://localhost:${PORT}`));