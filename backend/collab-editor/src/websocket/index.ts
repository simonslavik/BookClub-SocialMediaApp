import { WebSocket, WebSocketServer } from 'ws';
import { Client } from './types.js';
import {
  handleJoin,
  handleJoinDM,
  handleSwitchRoom,
  handleChatMessage,
  handleDMMessage,
  handleDeleteDMMessage,
  handleDeleteMessage,
  handlePinMessage,
  handleEditMessage,
  handleDMAddReaction,
  handleDMRemoveReaction,
  handleDisconnect,
  handleStatusUpdate,
  handleViewSection,
  handleSectionActivity,
  handleLoadOlderMessages
} from './handlers.js';
import { handleAddReaction, handleRemoveReaction } from './reactionHandler.js';

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 5000;
const RATE_LIMIT_MAX_MESSAGES = 15;

/** Per-client sliding window rate limiter */
const clientMessageTimestamps = new Map<WebSocket, number[]>();

function isRateLimited(ws: WebSocket): boolean {
  const now = Date.now();
  let timestamps = clientMessageTimestamps.get(ws);
  if (!timestamps) {
    timestamps = [];
    clientMessageTimestamps.set(ws, timestamps);
  }
  // Remove timestamps outside the window
  while (timestamps.length > 0 && timestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    return true;
  }
  timestamps.push(now);
  return false;
}

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WebSocket) => {
    let currentClient: Client | null = null;

    console.log('👤 New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Validate message content length for chat/dm messages
        if ((message.type === 'chat-message' || message.type === 'dm-message') && message.message) {
          if (typeof message.message !== 'string' || message.message.length > MAX_MESSAGE_LENGTH) {
            ws.send(JSON.stringify({ type: 'error', message: `Message content must be a string of at most ${MAX_MESSAGE_LENGTH} characters` }));
            return;
          }
        }

        // Rate limit chat and DM messages
        if (['chat-message', 'dm-message'].includes(message.type)) {
          if (isRateLimited(ws)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Rate limited — slow down' }));
            return;
          }
        }
        
        switch (message.type) {
          case 'join':
            handleJoin(ws, message, (client) => {
              currentClient = client;
            });
            break;
          
          case 'join-dm':
            handleJoinDM(ws, message, (client) => {
              currentClient = client;
            });
            break;
          
          case 'switch-room':
            handleSwitchRoom(message, currentClient);
            break;
          
          case 'load-older-messages':
            handleLoadOlderMessages(message, currentClient);
            break;
          
          case 'chat-message':
            handleChatMessage(message, currentClient);
            break;
          
          case 'dm-message':
            handleDMMessage(message, currentClient);
            break;
          
          case 'delete-dm-message':
            handleDeleteDMMessage(message, currentClient);
            break;
          
          case 'delete-message':
            handleDeleteMessage(message, currentClient);
            break;
          
          case 'pin-message':
            handlePinMessage(message, currentClient);
            break;
          
          case 'edit-message':
            handleEditMessage(message, currentClient);
            break;
          
          case 'add-reaction':
            if (currentClient) handleAddReaction(currentClient, message);
            break;
          
          case 'remove-reaction':
            if (currentClient) handleRemoveReaction(currentClient, message);
            break;
          
          case 'dm-add-reaction':
            handleDMAddReaction(message, currentClient);
            break;
          
          case 'dm-remove-reaction':
            handleDMRemoveReaction(message, currentClient);
            break;
          
          case 'status-update':
            handleStatusUpdate(message, currentClient);
            break;
          
          case 'view-section':
            handleViewSection(message, currentClient);
            break;
          
          case 'section-activity':
            handleSectionActivity(message, currentClient);
            break;
          
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      clientMessageTimestamps.delete(ws);
      if (currentClient) {
        handleDisconnect(currentClient);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};
