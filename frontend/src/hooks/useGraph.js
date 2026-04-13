"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import { api } from '@/utils/api';
import { useWorkspace } from '@/context/WorkspaceContext';

export function useGraph() {
  const [rawData, setRawData] = useState({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const { refreshTrigger } = useWorkspace();

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledgeGraph();
      setRawData({
        nodes: data?.nodes || [],
        edges: data?.edges || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load knowledge graph.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph, refreshTrigger]);

  // Compute d3-force layout positions, memoized on raw data
  const { nodes, edges } = useMemo(() => {
    if (rawData.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build node map for d3
    const simNodes = rawData.nodes.map((n) => ({
      id: String(n.id),
      ...n,
    }));

    const nodeIdSet = new Set(simNodes.map((n) => n.id));

    // Only include edges where both source and target exist
    const simEdges = rawData.edges
      .filter((e) => nodeIdSet.has(String(e.source)) && nodeIdSet.has(String(e.target)))
      .map((e, i) => ({
        ...e,
        source: String(e.source),
        target: String(e.target),
        index: i,
      }));

    // Run d3-force simulation synchronously
    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simEdges)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(60))
      .stop();

    // Tick to completion
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }

    // Convert to ReactFlow format
    const rfNodes = simNodes.map((n) => {
      const isDocument = n.labels?.includes('Document');
      return {
        id: n.id,
        type: isDocument ? 'documentNode' : 'entityNode',
        position: { x: n.x || 0, y: n.y || 0 },
        data: {
          label: n.name || n.id || 'Unknown',
          labels: n.labels || [],
          sourceFilenames: n.source_filenames || [],
          sourceFileIds: n.source_file_ids || [],
          isDocument,
        },
      };
    });

    const rfEdges = simEdges.map((e, i) => ({
      id: `e-${i}-${typeof e.source === 'object' ? e.source.id : e.source}-${typeof e.target === 'object' ? e.target.id : e.target}`,
      source: typeof e.source === 'object' ? e.source.id : e.source,
      target: typeof e.target === 'object' ? e.target.id : e.target,
      label: e.type || 'LINK',
      type: 'default',
      animated: e.type === 'MENTIONED_IN',
      style: {
        stroke: e.type === 'MENTIONED_IN' ? '#3b82f680' : '#6366f180',
        strokeWidth: e.type === 'MENTIONED_IN' ? 1 : 1.5,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
      labelBgStyle: {
        fill: '#1e2028',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
      data: {
        sourceLabel: e.source_label,
        targetLabel: e.target_label,
        sourceFilenames: e.source_filenames || [],
      },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [rawData]);

  return {
    nodes,
    edges,
    isLoading,
    error,
    selectedNode,
    setSelectedNode,
    fetchGraph,
  };
}
