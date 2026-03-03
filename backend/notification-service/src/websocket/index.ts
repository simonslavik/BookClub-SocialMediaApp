import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from '../utils/auth.js';
import { setBroadcastFunction } from '../services/notification.service.js';
import logger from '../utils/logger.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

// Map userId → set of connected sockets (user can have multiple tabs)
const userSockets = new Map<string, Set<AuthenticatedSocket>>();

/**
 * Broadcast data to a specific user (all their connected sockets)
 */
function broadcastToUser(userId: string, data: any) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  const message = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Setup WebSocket server for real-time notification delivery.
 * 
 * Protocol:
 * 1. Client connects to ws://notification-service:3005
 * 2. Client sends: { type: "auth", token: "<JWT>" }
 * 3. Server verifies token, associates socket with userId
 * 4. Server pushes notifications as: { type: "notification", data: {...} }
 * 5. Heartbeat ping/pong every 30s
 */
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  // Register broadcast function so the notification service can push in real-time
  setBroadcastFunction(broadcastToUser);

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());

        if (message.type === 'auth') {
          const result = verifyToken(message.token);
          if (!result.valid || !result.userId) {
            ws.send(JSON.stringify({ type: 'auth-error', message: result.error }));
            ws.close();
            return;
          }

          ws.userId = result.userId;

          // Add to user socket map
          if (!userSockets.has(result.userId)) {
            userSockets.set(result.userId, new Set());
          }
          userSockets.get(result.userId)!.add(ws);

          ws.send(JSON.stringify({ type: 'auth-success' }));
          logger.debug(`WS authenticated: ${result.userId}`);
        }
      } catch (err) {
        logger.error('WS message parse error:', err);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        const sockets = userSockets.get(ws.userId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            userSockets.delete(ws.userId);
          }
        }
      }
    });

    ws.on('error', (err) => {
      logger.error('WS error:', err);
    });
  });

  // Heartbeat — close dead connections every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          const sockets = userSockets.get(ws.userId);
          if (sockets) {
            sockets.delete(ws);
            if (sockets.size === 0) userSockets.delete(ws.userId);
          }
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  logger.info(`🔔 Notification WebSocket server ready on /ws`);

  return wss;
}

/**
 * Get the count of connected users (for metrics/health)
 */
export function getConnectedUserCount() {
  return userSockets.size;
}
