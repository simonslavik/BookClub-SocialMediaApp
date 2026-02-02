import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from './middleware/authMiddleware.js';

// Routes
import bookClubRoutes from './routes/bookClubRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// WebSocket setup
import { setupWebSocket } from './websocket/index.js';
import { activeBookClubs } from './websocket/types.js';
import { setActiveBookClubs } from './controllers/bookClubController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

// Share active bookclubs with controller
setActiveBookClubs(activeBookClubs);

// Health check
app.get('/health', async (req, res) => {
  const totalBookClubs = await prisma.bookClub.count();
  res.json({ 
    status: 'healthy',
    service: 'bookclub-service',
    totalBookClubs,
    activeBookClubs: activeBookClubs.size,
    totalActiveClients: Array.from(activeBookClubs.values()).reduce(
      (sum: number, club) => sum + club.clients.size, 
      0
    )
  });
});

// Routes
app.use('/bookclubs', bookClubRoutes);
app.use('/bookclubs/:bookClubId/rooms', roomRoutes);
app.use('/bookclubs/:bookClubId/events', eventRoutes);
app.use('/invites', inviteRoutes);
app.use('/upload', uploadRoutes);

// Also mount event routes at top level for update/delete by eventId
import { updateEvent, deleteEvent } from './controllers/eventController.js';
app.patch('/events/:eventId', authMiddleware, updateEvent);
app.delete('/events/:eventId', authMiddleware, deleteEvent);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 BookClub Service running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`💾 Connected to database`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
