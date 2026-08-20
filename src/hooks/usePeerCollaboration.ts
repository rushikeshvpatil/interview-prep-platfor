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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. WebSocket Layer
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    let ws: WebSocket | null = null;

    if (wsUrl) {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          ws?.send(
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
            if (data.type === 'CODE_UPDATE' && role === 'interviewer') {
              if (typeof data.code === 'string') setLiveCode(data.code);
              if (typeof data.language === 'string') setLiveLanguage(data.language);
            } else if (data.type === 'RUN_RESULT') {
              setLiveSubmissions((prev) => [data.result, ...prev]);
            } else if (data.type === 'PRESENCE_CHANGE') {
              setPeerConnected(data.status === 'online');
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          setConnectionStatus('offline');
        };
      } catch (err) {
        console.warn('WebSocket connection failed, falling back to HTTP sync:', err);
      }
    }

    // 2. HTTP State Sync Fallback (Runs seamlessly in serverless / local dev)
    let isMounted = true;
    async function syncPeerState() {
      try {
        const res = await fetch(`/api/interview/${sessionId}/peer`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const sess = data.session;

          if (sess) {
            // Check if interviewer has joined
            setPeerConnected(!!sess.interviewer);
            setConnectionStatus('connected');

            // Interviewer receives candidate's latest code
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
      } catch (e) {
        console.error('Peer sync poll error:', e);
      }
    }

    // Initial sync
    syncPeerState();

    // Regular interval sync (every 1.5 seconds)
    pollTimerRef.current = setInterval(syncPeerState, 1500);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [sessionId, userId, role, userName]);

  // Broadcast code update from candidate to interviewer
  const sendCodeUpdate = useCallback(
    (code: string, language: string) => {
      if (role !== 'candidate') return;

      // Send through WebSocket if available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'CODE_UPDATE',
            sessionId,
            userId,
            role: 'candidate',
            payload: { code, language },
          })
        );
      }
    },
    [sessionId, userId, role]
  );

  // Broadcast execution result to interviewer
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
    connectionStatus,
    sendCodeUpdate,
    broadcastRunResult,
  };
}
