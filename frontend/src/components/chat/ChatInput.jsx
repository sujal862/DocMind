"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function ChatInput({ onSend, isTyping }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border shrink-0">
      <div className="flex items-end gap-2 bg-surface border border-border rounded-xl px-4 py-2 focus-within:border-accent/40 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          placeholder="Ask about your documents..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-[#6b7280] outline-none resize-none py-1.5 max-h-[160px] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer',
            input.trim() && !isTyping
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'bg-transparent text-foreground-muted'
          )}
        >
          {isTyping ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
