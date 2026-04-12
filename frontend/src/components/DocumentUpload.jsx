"use client";

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

export default function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    setError(null);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    setIsUploading(true);
    setError(null);
    try {
      await api.uploadDocuments(files);
      await fetchDocuments(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = null;
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to delete document.');
    }
  }

  return (
    <div className="flex flex-col w-full h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Knowledge Base</h2>
        <p className="text-white/60 text-sm mt-1">Upload your documents to the intelligent workspace.</p>
      </div>

      {/* Drag & Drop Area */}
      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center mb-8 relative overflow-hidden group border border-white/10 hover:border-accent-primary/50 transition-colors">
        <label className="absolute inset-0 cursor-pointer w-full h-full z-10 flex flex-col items-center justify-center">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading} 
              accept=".pdf,.txt,.docx" 
            />
        </label>
        
        {isUploading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-accent-primary">
                <Loader2 className="w-10 h-10 mb-4 animate-spin text-accent-primary" />
                <span className="font-semibold text-lg">Processing Document...</span>
                <span className="text-white/50 text-sm mt-2 max-w-xs leading-relaxed">
                  Extracting vectors, building knowledge graph entities, and analyzing chunks.
                </span>
            </motion.div>
        ) : (
            <>
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-accent-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Click or drag documents here</h3>
                <p className="text-white/50 mt-2 text-sm max-w-sm leading-relaxed">
                  Supports PDFs, Word, and text files. The AI will automatically chunk, embed, and map relationships.
                </p>
            </>
        )}
      </div>

      {/* Error State Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative z-20"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
                <span className="text-red-200 font-medium text-sm">Error Occurred</span>
                <span className="text-red-300 text-sm">{error}</span>
            </div>
            {/* Close error button */}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">
               &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Indexed Documents</h3>
        {isLoadingDocs ? (
            <div className="flex items-center gap-3 text-white/50 p-4">
                <Loader2 className="w-5 h-5 animate-spin" /> Fetching workspace documents...
            </div>
        ) : documents.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/5 text-white/40">
                No documents found. Upload one above to build the knowledge graph!
            </div>
        ) : (
            <div className="grid gap-3 relative z-20">
              <AnimatePresence>
                {documents.map((doc) => (
                    <motion.div 
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-panel p-4 flex items-center justify-between hover-lift relative"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-foreground text-sm font-medium">{doc.name}</span>
                                <span className="text-white/50 text-xs mt-1 flex items-center gap-1.5">
                                    {doc.status === 'failed' ? (
                                      <><AlertCircle className="w-3 h-3 text-red-400" /> Failed</>
                                    ) : doc.status === 'saving' || doc.status === 'queued' ? (
                                      <><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> Processing...</>
                                    ) : (
                                      <><CheckCircle className="w-3 h-3 text-green-400" /> Indexed</>
                                    )}
                                </span>
                            </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );
}
