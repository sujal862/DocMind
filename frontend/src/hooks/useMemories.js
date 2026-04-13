"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, DEFAULT_USER_ID } from '@/utils/api';

export function useMemories() {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getChatHistory(DEFAULT_USER_ID);
      const results = data?.history?.results || [];
      setMemories(results);
    } catch {
      // Mem0 memories are non-critical — fail silently
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return {
    memories,
    isLoading,
    refreshMemories: fetchMemories,
  };
}
