import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  role: 'candidate' | 'interviewer' | 'observer';
  name?: string;
  isAlive?: boolean;
}

interface CachedRoomState {
  code: string;
  language: string;
  lastUpdated: string;
}

const PORT = parseInt(process.env.WS_PORT || '3001', 10);
const wss = new WebSocketServer({ port: PORT });

// Map: sessionId -> Set of ClientConnection
const rooms = new Map<string, Set<ClientConnection>>();
// Map: sessionId -> Cached code state
const roomCodeState = new Map<string, CachedRoomState>();

console.log(`[WebSocket Server] Interview Collaboration Server running on port ${PORT}`);

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
            isAlive: true,
          };

          if (!rooms.has(sessionId)) {
            rooms.set(sessionId, new Set());
          }

          const room = rooms.get(sessionId)!;
          room.add(clientInfo);

          // If joining as candidate, cache their initial code if provided
          if (clientInfo.role === 'candidate' && payload?.initialCode) {
            roomCodeState.set(sessionId, {
              code: payload.initialCode,
              language: payload.initialLanguage || 'python',
              lastUpdated: new Date().toISOString(),
            });

            // Immediately broadcast initial code to any interviewers already in the room
            broadcastToRoom(
              sessionId,
              {
                type: 'CODE_INIT',
                code: payload.initialCode,
                language: payload.initialLanguage || 'python',
                timestamp: new Date().toISOString(),
              },
              ws // Exclude the candidate
            );
          }

          // If joining as interviewer and room already has cached candidate code, send it immediately
          if (clientInfo.role === 'interviewer' && roomCodeState.has(sessionId)) {
            const cached = roomCodeState.get(sessionId)!;
            ws.send(
              JSON.stringify({
                type: 'CODE_INIT',
                code: cached.code,
                language: cached.language,
                timestamp: cached.lastUpdated,
              })
            );
          }

          // Broadcast presence update to room
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

          const newCode = typeof payload?.code === 'string' ? payload.code : '';
          const newLang = typeof payload?.language === 'string' ? payload.language : 'python';

          // Update in-memory room cache
          roomCodeState.set(clientInfo.sessionId, {
            code: newCode,
            language: newLang,
            lastUpdated: new Date().toISOString(),
          });

          // Broadcast to interviewers & observers immediately
          broadcastToRoom(
            clientInfo.sessionId,
            {
              type: 'CODE_UPDATE',
              code: newCode,
              language: newLang,
              timestamp: new Date().toISOString(),
            },
            ws // Exclude candidate
          );
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!clientInfo) return;

          // Broadcast chat message to everyone in the room
          broadcastToRoom(clientInfo.sessionId, {
            type: 'CHAT_MESSAGE',
            message: payload,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'RUN_RESULT': {
          if (!clientInfo) return;

          // Broadcast execution results to room
          broadcastToRoom(clientInfo.sessionId, {
            type: 'RUN_RESULT',
            result: payload,
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'PING': {
          if (clientInfo) clientInfo.isAlive = true;
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
      console.log(`[WS] ${name} (${role}) left session: ${sessionId}`);
    }
  });

  ws.on('error', (err) => {
    console.error('[WS Socket Error]:', err.message);
  });
});

// Broadcast helper
function broadcastToRoom(sessionId: string, data: object, excludeWs?: WebSocket) {
  const room = rooms.get(sessionId);
  if (!room) return;

  const messageStr = JSON.stringify(data);
  for (const client of room) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(messageStr);
    }
  }
}

// Heartbeat interval to detect stale/disconnected clients
const heartbeatInterval = setInterval(() => {
  for (const [sessionId, room] of rooms.entries()) {
    for (const client of room) {
      if (!client.isAlive) {
        console.log(`[WS Heartbeat] Terminating inactive connection for ${client.name} in session ${sessionId}`);
        client.ws.terminate();
        room.delete(client);
      } else {
        client.isAlive = false;
        client.ws.ping();
      }
    }
    if (room.size === 0) {
      rooms.delete(sessionId);
    }
  }
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});
