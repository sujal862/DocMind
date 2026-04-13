"use client";

import { Bot, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-[75%]', isUser && 'ml-auto flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser ? 'bg-accent' : 'bg-surface border border-border'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-foreground-muted" />
        )}
      </div>

      <div
        className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-white rounded-tr-md'
            : 'bg-surface border border-border text-foreground rounded-tl-md'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {!isUser && message.meta?.queryType && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-border">
            <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-[11px] text-foreground-muted font-medium">
              {message.meta.queryType}
            </span>
            {message.meta.subQueries?.length > 0 && (
              <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-[11px] text-foreground-muted font-medium">
                {message.meta.subQueries.length} sub-queries
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
