"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, DEFAULT_USER_ID } from '@/utils/api';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [activeView, setActiveView] = useState('documents');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const refreshMemories = useCallback(async () => {
    setMemoriesLoading(true);
    try {
      const data = await api.getChatHistory(DEFAULT_USER_ID);
      const results = data?.history?.results || [];
      setMemories(results);
    } catch {
      setMemories([]);
    } finally {
      setMemoriesLoading(false);
    }
  }, []);

  // Fetch memories on mount
  useEffect(() => {
    refreshMemories();
  }, [refreshMemories]);

  return (
    <WorkspaceContext.Provider
      value={{
        activeView,
        setActiveView,
        refreshTrigger,
        triggerRefresh,
        memories,
        memoriesLoading,
        refreshMemories,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
