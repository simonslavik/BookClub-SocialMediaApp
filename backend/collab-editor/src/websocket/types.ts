import { WebSocket } from 'ws';

export interface Client {
  id: string;
  userId: string;
  username: string;
  profileImage?: string | null;
  ws: WebSocket;
  bookClubId?: string;
  roomId?: string;
  isDMConnection?: boolean;
}

export interface ActiveBookClub {
  clients: Map<string, Client>;
}

export const activeBookClubs = new Map<string, ActiveBookClub>();
export const activeDMClients = new Map<string, Client>();

export const broadcastToBookClub = (
  activeClub: ActiveBookClub, 
  message: any, 
  excludeClientId?: string
) => {
  const data = JSON.stringify(message);
  
  activeClub.clients.forEach((client) => {
    if (client.id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
};
