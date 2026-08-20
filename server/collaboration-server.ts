import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  role: 'candidate' | 'interviewer' | 'observer';
  name?: string;
}

const PORT = parseInt(process.env.WS_PORT || '3001', 10);
const wss = new WebSocketServer({ port: PORT });

// Map: sessionId -> Set of ClientConnection
const rooms = new Map<string, Set<ClientConnection>>();

console.log(`[WebSocket Server] Interview Collaboration Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  let clientInfo: ClientConnection | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, sessionId, userId, role, name, payload } = data;

      switch (type) {
        case 'JOIN_ROOM': {
          if (!sessionId || !userId) return;

          clientInfo = {
            ws,
            sessionId,
            userId,
            role: role || 'observer',
            name: name || 'Participant',
          };

          if (!rooms.has(sessionId)) {
            rooms.set(sessionId, new Set());
          }

          const room = rooms.get(sessionId)!;
          room.add(clientInfo);

          // Broadcast presence update
          broadcastToRoom(sessionId, {
            type: 'PRESENCE_CHANGE',
            userId,
            role: clientInfo.role,
            name: clientInfo.name,
            status: 'online',
            totalParticipants: room.size,
          });

          console.log(`[WS] ${clientInfo.name} (${clientInfo.role}) joined session: ${sessionId}`);
          break;
        }

        case 'CODE_UPDATE': {
          if (!clientInfo) return;

          // STRICT AUTHORIZATION: ONLY Candidate is permitted to broadcast code changes!
          if (clientInfo.role !== 'candidate') {
            console.warn(`[WS Security] Blocked unauthorized code update from role: ${clientInfo.role}`);
            return;
          }

          // Broadcast to interviewers & observers
          broadcastToRoom(
            clientInfo.sessionId,
            {
              type: 'CODE_UPDATE',
              code: payload?.code,
              language: payload?.language,
              timestamp: new Date().toISOString(),
            },
            ws // Exclude sender
          );
          break;
        }

        case 'RUN_RESULT': {
          if (!clientInfo) return;

          // Broadcast execution results to interviewers
          broadcastToRoom(clientInfo.sessionId, {
            type: 'RUN_RESULT',
            result: payload,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'HEARTBEAT': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[WS Error] Malformed message:', err);
    }
  });

  ws.on('close', () => {
    if (clientInfo) {
      const { sessionId, userId, role, name } = clientInfo;
      const room = rooms.get(sessionId);
      if (room) {
        room.delete(clientInfo);
        if (room.size === 0) {
          rooms.delete(sessionId);
        } else {
          broadcastToRoom(sessionId, {
            type: 'PRESENCE_CHANGE',
            userId,
            role,
            name,
            status: 'offline',
            totalParticipants: room.size,
          });
        }
      }
      console.log(`[WS] ${name} (${role}) disconnected from session: ${sessionId}`);
    }
  });
});

function broadcastToRoom(sessionId: string, messageObj: object, excludeWs?: WebSocket) {
  const room = rooms.get(sessionId);
  if (!room) return;

  const payload = JSON.stringify(messageObj);
  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(payload);
    }
  }
}
