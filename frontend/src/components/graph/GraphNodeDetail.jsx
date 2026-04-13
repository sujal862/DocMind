"use client";

import { X, FileText, Link2, Tag } from 'lucide-react';

export default function GraphNodeDetail({ node, edges, onClose }) {
  if (!node) return null;

  const { data } = node;
  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  return (
    <div className="w-[300px] h-full border-l border-border bg-background-secondary flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{data.label}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            {data.labels?.map((lbl) => (
              <span
                key={lbl}
                className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-[11px] text-foreground-muted font-medium"
              >
                <Tag className="w-2.5 h-2.5" />
                {lbl}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Source Documents */}
      {data.sourceFilenames?.length > 0 && (
        <div className="p-4 border-b border-border">
          <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2.5">
            Source Documents
          </h4>
          <div className="space-y-1.5">
            {data.sourceFilenames.map((fname, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{fname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2.5">
          Connections ({connectedEdges.length})
        </h4>
        {connectedEdges.length === 0 ? (
          <p className="text-xs text-foreground-muted">No connections</p>
        ) : (
          <div className="space-y-2">
            {connectedEdges.map((edge) => {
              const isSource = edge.source === node.id;
              const otherLabel = isSource
                ? edge.data?.targetLabel || edge.target
                : edge.data?.sourceLabel || edge.source;
              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 text-xs text-foreground-muted bg-surface rounded-lg px-3 py-2"
                >
                  <Link2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {isSource ? '' : `${otherLabel} `}
                    <span className="text-accent font-medium">{edge.label}</span>
                    {isSource ? ` ${otherLabel}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
