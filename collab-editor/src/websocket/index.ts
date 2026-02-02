import { WebSocket, WebSocketServer } from 'ws';
import { Client } from './types.js';
import {
  handleJoin,
  handleJoinDM,
  handleSwitchRoom,
  handleChatMessage,
  handleDMMessage,
  handleDisconnect
} from './handlers.js';

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws: WebSocket) => {
    let currentClient: Client | null = null;

    console.log('👤 New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
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
          
          case 'chat-message':
            handleChatMessage(message, currentClient);
            break;
          
          case 'dm-message':
            handleDMMessage(message, currentClient);
            break;
          
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (currentClient) {
        handleDisconnect(currentClient);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};
