'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

export interface ChatMessage {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: string;
}

interface AIMessageFeedProps {
  sessionId: string;
  isSessionActive: boolean;
  currentCode: string;
  language: string;
  onUnreadChange?: (count: number) => void;
  isActiveTab: boolean;
}

export function AIMessageFeed({
  sessionId,
  isSessionActive,
  currentCode,
  language,
  onUnreadChange,
  isActiveTab,
}: AIMessageFeedProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function loadTranscript() {
      try {
        setInitialLoading(true);
        const res = await fetch(`/api/interview/${sessionId}/ai/message`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load AI transcript:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadTranscript();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (isHint = false) => {
    if ((!inputText.trim() && !isHint) || loading || !isSessionActive) return;

    const userText = inputText;
    setInputText('');
    setLoading(true);

    // Optimistically add candidate message
    const tempCandidateMsg: ChatMessage = {
      role: 'candidate',
      content: isHint
        ? 'Could you please provide a gentle conceptual hint on how to approach or optimize this problem?'
        : userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempCandidateMsg]);

    try {
      const res = await fetch(`/api/interview/${sessionId}/ai/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userText,
          currentCode,
          language,
          isHintRequest: isHint,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        if (!isActiveTab) {
          onUnreadChange?.(1);
        }
      }
    } catch (err) {
      console.error('Failed to send message to AI interviewer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold text-foreground">AI Technical Interviewer (Gemini)</span>
        </div>
        <span className="text-[11px] text-muted-foreground">Voice of Senior Tech Lead</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {initialLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs">Connecting with AI Interviewer...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p className="text-xs">No conversation history yet. Send a message to start explaining your approach!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAI = msg.role === 'interviewer' || msg.role === 'system';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {isAI ? 'Interviewer' : 'You'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed text-xs ${
                    isAI
                      ? 'rounded-tl-xs bg-muted/60 text-foreground border border-border/80 shadow-2xs whitespace-pre-wrap'
                      : 'rounded-tr-xs bg-primary text-primary-foreground shadow-2xs whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-start space-y-1">
            <div className="rounded-2xl rounded-tl-xs bg-muted/60 border border-border/80 p-3.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Interviewer is reviewing your response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-3 space-y-2">
        {/* Quick action buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!isSessionActive || loading}
            onClick={() => handleSendMessage(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover disabled:opacity-50 cursor-pointer"
          >
            <span>💡 Request Progressive Hint</span>
          </button>
          <span className="text-[10px] text-muted-foreground">Explain approach before coding</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(false);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            disabled={!isSessionActive || loading}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isSessionActive
                ? 'Type your thought process, ask clarification, or explain complexity...'
                : 'Interview session ended'
            }
            className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim() || !isSessionActive || loading}
            className="h-8 px-3 text-xs"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
