import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized generic error handler
const handleApiError = (error) => {
  console.error('API Error:', error.response || error.message);
  if (error.response) {
    throw new Error(error.response.data.detail || error.response.data.message || 'Server error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Check if the backend is running.');
  } else {
    throw new Error(error.message || 'Failed to complete the request');
  }
};

export const api = {
  // Documents
  uploadDocuments: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (e) { handleApiError(e); }
  },
  
  getDocuments: async () => {
    try {
      const response = await apiClient.get('/documents');
      return response.data.documents || [];
    } catch (e) { handleApiError(e); }
  },

  deleteDocument: async (id) => {
    try {
      const response = await apiClient.delete(`/documents/${id}`);
      return response.data;
    } catch (e) { handleApiError(e); }
  },

  // Knowledge Graph
  getKnowledgeGraph: async () => {
    try {
      const response = await apiClient.get('/graph');
      return response.data;
    } catch (e) { handleApiError(e); }
  },

  // Chat
  sendChatMessage: async (query) => {
    try {
      const response = await apiClient.post('/chat', { query });
      return response.data;
    } catch (e) { handleApiError(e); }
  },
  
  getChatHistory: async () => {
      try {
          const response = await apiClient.get('/chat/history');
          return response.data;
      } catch (e) { handleApiError(e); }
  }
};
