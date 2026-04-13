"use client";

import { UploadCloud, FileText, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/utils/cn';
import { useDocuments } from '@/hooks/useDocuments';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function DocumentsView() {
  const {
    documents,
    isLoading,
    isUploading,
    error,
    setError,
    uploadDocuments,
    deleteDocument,
  } = useDocuments();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await uploadDocuments(files);
    e.target.value = null;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Documents</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Upload and manage your knowledge base
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Upload Area */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer mb-8',
            isUploading
              ? 'border-accent/30 bg-accent-muted'
              : 'border-border hover:border-accent/40 hover:bg-accent-muted/50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
            accept=".pdf,.txt,.docx"
          />
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <span className="text-sm font-medium text-foreground">Uploading...</span>
              <span className="text-xs text-foreground-muted mt-1">
                Extracting text, building vectors and knowledge graph
              </span>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-foreground-muted mb-3" />
              <span className="text-sm font-medium text-foreground">
                Click to upload documents
              </span>
              <span className="text-xs text-foreground-muted mt-1">
                PDF, Word, or text files
              </span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-between">
            <span className="text-sm text-danger">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-danger hover:text-danger/80 ml-3 cursor-pointer text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Document List */}
        {isLoading ? (
          <div className="flex items-center gap-3 text-foreground-muted py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents yet"
            description="Upload your first document to start building the knowledge graph."
          />
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:border-border-hover transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>

                  {doc.status === 'completed' && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-foreground-muted">
                        {doc.chunk_count || 0} chunks
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {doc.entity_count || 0} entities
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {doc.relationship_count || 0} relations
                      </span>
                    </div>
                  )}

                  {doc.status === 'failed' && doc.error && (
                    <p className="text-xs text-danger/80 mt-1 truncate">{doc.error}</p>
                  )}
                </div>

                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-foreground-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
