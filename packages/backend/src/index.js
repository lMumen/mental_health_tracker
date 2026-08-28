import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { getDb } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import logRoutes from './routes/logRoutes.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './middleware/auth.js';

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
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.user.id);
  console.log(`User connected to room: ${socket.user.id}`);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend server listening on http://localhost:${PORT}`));