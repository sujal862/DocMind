"use client";

import { RefreshCw, Loader2, Network } from 'lucide-react';
import { useGraph } from '@/hooks/useGraph';
import GraphCanvas from '@/components/graph/GraphCanvas';
import GraphNodeDetail from '@/components/graph/GraphNodeDetail';
import EmptyState from '@/components/ui/EmptyState';

export default function GraphExplorer() {
  const {
    nodes,
    edges,
    isLoading,
    error,
    selectedNode,
    setSelectedNode,
    fetchGraph,
  } = useGraph();

  const handleNodeClick = (node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Knowledge Graph</h1>
          <p className="text-foreground-muted text-sm mt-1">
            {nodes.length > 0
              ? `${nodes.length} nodes, ${edges.length} edges`
              : 'Visualize entities and relationships from your documents'}
          </p>
        </div>
        <button
          onClick={fetchGraph}
          disabled={isLoading}
          className="p-2.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh graph"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading && nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="text-sm text-foreground-muted">Loading graph...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-danger mb-2">{error}</p>
              <button
                onClick={fetchGraph}
                className="text-sm text-accent hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Network}
              title="No graph data yet"
              description="Upload documents to automatically extract entities and relationships."
            />
          </div>
        ) : (
          <>
            {/* Graph Canvas */}
            <div className="flex-1 min-w-0">
              <GraphCanvas
                initialNodes={nodes}
                initialEdges={edges}
                onNodeClick={handleNodeClick}
              />
            </div>

            {/* Detail Panel */}
            {selectedNode && (
              <GraphNodeDetail
                node={selectedNode}
                edges={edges}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
