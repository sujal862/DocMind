"use client";

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useWorkspace } from '@/context/WorkspaceContext';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import EmptyState from '@/components/ui/EmptyState';

export default function ChatView() {
  const { messages, isTyping, error, sendMessage, clearError } = useChat();
  const { refreshMemories } = useWorkspace();
  const scrollRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Refresh memories after assistant response
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      refreshMemories();
    }
  }, [messages.length, refreshMemories]);

  const handleSend = (query) => {
    sendMessage(query);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Chat</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Ask questions about your uploaded documents
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && !isTyping ? (
          <EmptyState
            icon={MessageSquare}
            title="Start a conversation"
            description="Ask me to summarize, compare, or find relationships across your documents."
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[75%]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-surface border border-border">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-surface border border-border">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-foreground-muted/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-foreground-muted/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-foreground-muted/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-8 mb-2 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-between">
          <span className="text-sm text-danger">{error}</span>
          <button
            onClick={clearError}
            className="text-danger hover:text-danger/80 ml-3 cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} isTyping={isTyping} />
    </div>
  );
}
