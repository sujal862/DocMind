"use client";

import { useState, useCallback, useRef } from 'react';
import { api, DEFAULT_USER_ID } from '@/utils/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const idCounter = useRef(0);

  const sendMessage = useCallback(async (query) => {
    if (!query.trim()) return;

    const userMsg = {
      id: `msg-${++idCounter.current}`,
      role: 'user',
      content: query.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const response = await api.sendChatMessage(query.trim(), DEFAULT_USER_ID);

      const assistantMsg = {
        id: `msg-${++idCounter.current}`,
        role: 'assistant',
        content:
          response.answer ||
          response.response ||
          (typeof response === 'string' ? response : 'Could not parse response.'),
        meta: {
          queryType: response.query_type_detected,
          subQueries: response.sub_queries || [],
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to get a response.');
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearError,
  };
}
