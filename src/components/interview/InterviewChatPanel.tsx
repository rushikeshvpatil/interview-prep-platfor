'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChatMessageItem } from '@/hooks/usePeerCollaboration';

interface InterviewChatPanelProps {
  sessionId: string;
  currentUserId?: string;
  currentUserRole: 'CANDIDATE' | 'INTERVIEWER';
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => Promise<void>;
  isSessionActive: boolean;
}

export function InterviewChatPanel({
  currentUserId,
  currentUserRole,
  messages,
  onSendMessage,
  isSessionActive,
}: InterviewChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !isSessionActive) return;

    const text = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await onSendMessage(text);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-card overflow-hidden">
      {/* Header Info */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Interview Chat
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {currentUserRole === 'INTERVIEWER' ? 'Observing & Leading' : 'Discussing Approach'}
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground text-lg">
              💬
            </div>
            <p className="text-xs font-medium text-foreground">No interview messages yet</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              {currentUserRole === 'INTERVIEWER'
                ? 'Ask the candidate to explain their thought process, clarifying questions, or complexity trade-offs.'
                : 'Discuss your problem-solving approach, clarify requirements, or communicate edge cases with your interviewer.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId ? msg.senderId === currentUserId : msg.senderRole === currentUserRole;
            const isInterviewerMsg = msg.senderRole === 'INTERVIEWER';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Sender name & role badge */}
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {msg.senderName || (isInterviewerMsg ? 'Interviewer' : 'Candidate')}
                  </span>
                  <Badge
                    variant={isInterviewerMsg ? 'warning' : 'success'}
                    className="text-[9px] px-1 py-0"
                  >
                    {isInterviewerMsg ? 'Interviewer' : 'Candidate'}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground/60">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-tr-xs'
                      : isInterviewerMsg
                      ? 'bg-warning/10 border border-warning/30 text-foreground rounded-tl-xs'
                      : 'bg-muted/40 border border-border text-foreground rounded-tl-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="space-y-2"
        >
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              disabled={!isSessionActive}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !isSessionActive
                  ? 'Interview session has ended.'
                  : currentUserRole === 'INTERVIEWER'
                  ? 'Type question to candidate... (e.g. "What is the time complexity?")'
                  : 'Type response or ask clarifying questions... (Enter to send)'
              }
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">
              Press <kbd className="font-mono bg-muted/40 px-1 py-0.5 rounded border border-border">Enter</kbd> to send
            </span>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputText.trim() || isSending || !isSessionActive}
              className="h-7 px-3 text-xs font-semibold cursor-pointer"
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
