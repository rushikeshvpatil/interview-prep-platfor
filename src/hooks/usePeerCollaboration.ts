'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PeerRunResult {
  submissionId: string;
  verdict: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  executionTime: number | null;
  memory: number | null;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: 'INTERVIEWER' | 'CANDIDATE';
  senderName?: string | null;
  message: string;
  createdAt: string;
}

interface UsePeerCollaborationProps {
  sessionId: string;
  userId: string;
  role: 'candidate' | 'interviewer';
  userName?: string;
  initialCode?: string;
  initialLanguage?: string;
}

function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    const host = window.location.hostname || 'localhost';
    return `${isHttps ? 'wss' : 'ws'}://${host}:3001`;
  }
  return 'ws://localhost:3001';
}

export function usePeerCollaboration({
  sessionId,
  userId,
  role,
  userName,
  initialCode = '',
  initialLanguage = 'python',
}: UsePeerCollaborationProps) {
  const [liveCode, setLiveCode] = useState<string>(initialCode);
  const [liveLanguage, setLiveLanguage] = useState<string>(initialLanguage);
  const [liveSubmissions, setLiveSubmissions] = useState<PeerRunResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [transport, setTransport] = useState<'websocket' | 'http'>('http');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWsOpenRef = useRef<boolean>(false);
  const sendDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPayloadRef = useRef<{ code: string; language: string } | null>(null);

  // Load chat messages history from database
  const loadChatHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/interview/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('[Chat] Failed to load chat history:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;
    async function initChat() {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/interview/${sessionId}/messages`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setChatMessages(data.messages);
          }
        }
      } catch (err) {
        console.error('[Chat] Failed to load chat history:', err);
      }
    }
    initChat();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // 1. Establish and Maintain WebSocket Connection
  useEffect(() => {
    let isCancelled = false;

    function connectWs() {
      if (isCancelled) return;

      const wsUrl = getWebSocketUrl();

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCancelled) {
            ws.close();
            return;
          }
          isWsOpenRef.current = true;
          setTransport('websocket');
          setConnectionStatus('connected');

          // Send JOIN_ROOM message with initialCode payload for instant synchronization
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              sessionId,
              userId,
              role,
              name: userName || 'Participant',
              payload: {
                initialCode,
                initialLanguage,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if ((data.type === 'CODE_UPDATE' || data.type === 'CODE_INIT') && role === 'interviewer') {
              if (typeof data.code === 'string') setLiveCode(data.code);
              if (typeof data.language === 'string') setLiveLanguage(data.language);
            } else if (data.type === 'RUN_RESULT') {
              setLiveSubmissions((prev) => [data.result, ...prev]);
            } else if (data.type === 'CHAT_MESSAGE') {
              if (data.message && data.message.id) {
                setChatMessages((prev) => {
                  if (prev.some((m) => m.id === data.message.id)) return prev;
                  return [...prev, data.message];
                });
              }
            } else if (data.type === 'PRESENCE_CHANGE') {
              setPeerConnected(data.status === 'online');
            }
          } catch (err) {
            console.error('[WS Client] Message parse error:', err);
          }
        };

        ws.onclose = () => {
          isWsOpenRef.current = false;
          setTransport('http');
          setConnectionStatus('offline');

          // Reconnect with 3s backoff if not unmounted
          if (!isCancelled) {
            reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          isWsOpenRef.current = false;
          setTransport('http');
        };
      } catch (e) {
        console.error('[WS] Connection attempt error:', e);
        setTransport('http');
        if (!isCancelled) {
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        }
      }
    }

    connectWs();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [sessionId, userId, role, userName, initialCode, initialLanguage]);

  // 2. Candidate broadcasts code update with 80ms throttle
  const sendCodeUpdate = useCallback(
    (code: string, language: string) => {
      if (role !== 'candidate') return;

      pendingPayloadRef.current = { code, language };

      if (sendDebounceRef.current) return;

      sendDebounceRef.current = setTimeout(() => {
        sendDebounceRef.current = null;
        if (!pendingPayloadRef.current) return;

        const payloadToSend = pendingPayloadRef.current;
        pendingPayloadRef.current = null;

        if (isWsOpenRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'CODE_UPDATE',
              sessionId,
              userId,
              role: 'candidate',
              payload: payloadToSend,
            })
          );
        }
      }, 80);
    },
    [sessionId, userId, role]
  );

  // 3. Broadcast execution results
  const broadcastRunResult = useCallback(
    (result: PeerRunResult) => {
      if (isWsOpenRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'RUN_RESULT',
            sessionId,
            userId,
            role,
            payload: result,
          })
        );
      }
    },
    [sessionId, userId, role]
  );

  // 4. Send chat message: instant WebSocket broadcast + Database persistence
  const sendChatMessage = useCallback(
    async (messageText: string) => {
      if (!messageText || !messageText.trim()) return;

      const trimmed = messageText.trim();

      // Post to database for persistent transcript
      try {
        const res = await fetch(`/api/interview/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed }),
        });

        if (res.ok) {
          const data = await res.json();
          const createdMsg: ChatMessageItem = data.message;

          // Add locally
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === createdMsg.id)) return prev;
            return [...prev, createdMsg];
          });

          // Broadcast over WebSocket for sub-50ms peer receipt
          if (isWsOpenRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'CHAT_MESSAGE',
                sessionId,
                userId,
                role,
                payload: createdMsg,
              })
            );
          }
        }
      } catch (err) {
        console.error('[Chat] Failed to send chat message:', err);
      }
    },
    [sessionId, userId, role]
  );

  // 5. Fallback HTTP polling for presence/draft if WebSocket is offline
  useEffect(() => {
    if (transport === 'websocket') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/interview/${sessionId}/peer`);
        if (res.ok) {
          const data = await res.json();
          if (role === 'interviewer' && data.draft) {
            setLiveCode((prev) => (prev !== data.draft.code ? data.draft.code : prev));
            setLiveLanguage((prev) => (prev !== data.draft.language ? data.draft.language : prev));
          }
        }
      } catch {
        // ignore polling failures
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, role, transport]);

  return {
    liveCode,
    liveLanguage,
    liveSubmissions,
    chatMessages,
    peerConnected,
    transport,
    connectionStatus,
    sendCodeUpdate,
    broadcastRunResult,
    sendChatMessage,
    loadChatHistory,
  };
}
