"use client";

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import EntityNode from './EntityNode';
import DocumentNode from './DocumentNode';

const NODE_TYPES = {
  entityNode: EntityNode,
  documentNode: DocumentNode,
};

export default function GraphCanvas({
  initialNodes,
  initialEdges,
  onNodeClick,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when parent data changes (refresh, new document, etc.)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event, node) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const miniMapNodeColor = useCallback((node) => {
    return node.data?.isDocument ? '#3b82f6' : '#4b5563';
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="w-full h-full"
    >
      <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={miniMapNodeColor}
        maskColor="rgba(0,0,0,0.6)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
