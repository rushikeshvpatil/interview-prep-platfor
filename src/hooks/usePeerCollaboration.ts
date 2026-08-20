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
  const [peerConnected, setPeerConnected] = useState<boolean>(false);
  const [transport, setTransport] = useState<'websocket' | 'http'>('http');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWsOpenRef = useRef<boolean>(false);
  const sendDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPayloadRef = useRef<{ code: string; language: string } | null>(null);

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

          // Send JOIN_ROOM message
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              sessionId,
              userId,
              role,
              name: userName || 'Participant',
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
      } catch {
        setTransport('http');
      }
    }

    connectWs();

    return () => {
      isCancelled = true;
      isWsOpenRef.current = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [sessionId, userId, role, userName]);

  // 2. Adaptive HTTP State Sync (Runs as fallback when WS offline, or low-priority background sync)
  useEffect(() => {
    let isMounted = true;

    async function syncPeerState() {
      try {
        const res = await fetch(`/api/interview/${sessionId}/peer`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const sess = data.session;

          if (sess) {
            setPeerConnected(!!sess.interviewer);

            // If WebSocket is not currently connected, use HTTP data
            if (!isWsOpenRef.current) {
              if (role === 'interviewer' && sess.codeDraft) {
                setLiveCode(sess.codeDraft.code);
                setLiveLanguage(sess.codeDraft.language);
              }

              if (sess.submissions) {
                setLiveSubmissions(
                  sess.submissions.map((s: {
                    id: string;
                    verdict: string;
                    stdout: string | null;
                    stderr: string | null;
                    compileOutput: string | null;
                    executionTime: number | null;
                    memory: number | null;
                    createdAt: string;
                  }) => ({
                    submissionId: s.id,
                    verdict: s.verdict,
                    stdout: s.stdout,
                    stderr: s.stderr,
                    compileOutput: s.compileOutput,
                    executionTime: s.executionTime,
                    memory: s.memory,
                    createdAt: s.createdAt,
                  }))
                );
              }
            }
          }
        }
      } catch (e) {
        console.error('Peer sync poll error:', e);
      }
    }

    // Initial sync
    syncPeerState();

    // Fast 800ms polling when WS offline, 5000ms heartbeat when WS active
    const pollInterval = setInterval(() => {
      syncPeerState();
    }, isWsOpenRef.current ? 5000 : 800);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [sessionId, role]);

  // 3. Ultra Low-Latency Candidate Code Broadcasting (<80ms throttle)
  const sendCodeUpdate = useCallback(
    (code: string, language: string) => {
      if (role !== 'candidate') return;

      pendingPayloadRef.current = { code, language };

      if (sendDebounceRef.current) clearTimeout(sendDebounceRef.current);

      sendDebounceRef.current = setTimeout(() => {
        if (!pendingPayloadRef.current) return;
        const { code: c, language: l } = pendingPayloadRef.current;

        // 1. Send via WebSocket if open (Instant <50ms transport)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'CODE_UPDATE',
              sessionId,
              userId,
              role: 'candidate',
              payload: { code: c, language: l },
            })
          );
        }
      }, 80); // 80ms debounce yields ultra-smooth real-time experience
    },
    [sessionId, userId, role]
  );

  // 4. Broadcast execution result to interviewer
  const broadcastRunResult = useCallback(
    (result: PeerRunResult) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'RUN_RESULT',
            sessionId,
            userId,
            payload: result,
          })
        );
      }
    },
    [sessionId, userId]
  );

  return {
    liveCode,
    liveLanguage,
    liveSubmissions,
    peerConnected,
    transport,
    connectionStatus,
    sendCodeUpdate,
    broadcastRunResult,
  };
}
