"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/utils/api';
import { useWorkspace } from '@/context/WorkspaceContext';

const TERMINAL_STATUSES = ['completed', 'failed'];
const POLL_INTERVAL = 3000;

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const { refreshTrigger, triggerRefresh } = useWorkspace();
  const pollRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs || []);
      setError(null);
      return docs || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch documents.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling logic: poll when any document is in a non-terminal status
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => !TERMINAL_STATUSES.includes(doc.status)
    );

    if (hasProcessing) {
      pollRef.current = setInterval(async () => {
        const docs = await fetchDocuments();
        const stillProcessing = docs.some(
          (doc) => !TERMINAL_STATUSES.includes(doc.status)
        );
        if (!stillProcessing) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          triggerRefresh();
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [documents.length, fetchDocuments, triggerRefresh]);

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  const uploadDocuments = useCallback(
    async (files) => {
      setIsUploading(true);
      setError(null);
      try {
        await api.uploadDocuments(files);
        await fetchDocuments();
        triggerRefresh();
      } catch (err) {
        setError(err.message || 'Failed to upload document.');
      } finally {
        setIsUploading(false);
      }
    },
    [fetchDocuments, triggerRefresh]
  );

  const deleteDocument = useCallback(
    async (id) => {
      setError(null);
      try {
        await api.deleteDocument(id);
        await fetchDocuments();
        triggerRefresh();
      } catch (err) {
        setError(err.message || 'Failed to delete document.');
      }
    },
    [fetchDocuments, triggerRefresh]
  );

  return {
    documents,
    isLoading,
    isUploading,
    error,
    setError,
    uploadDocuments,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
