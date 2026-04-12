"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import { Loader2, AlertCircle, RefreshCw, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

export default function KnowledgeGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledgeGraph();
      // Assume data.nodes and data.edges exist from Neo4j endpoint
      const backendNodes = data?.nodes || [];
      const backendEdges = data?.edges || [];

      if (backendNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      // Basic Circular Layout logic since positions might not be provided
      const radius = Math.max(250, backendNodes.length * 20); 
      const centerX = (typeof window !== 'undefined' ? window.innerWidth : 800) / 2.5;
      const centerY = (typeof window !== 'undefined' ? window.innerHeight : 600) / 2.5;

      const newNodes = backendNodes.map((n, i) => {
        const angle = (i / backendNodes.length) * 2 * Math.PI;
        return {
          id: String(n.id || n.name || i),
          position: { 
            x: centerX + radius * Math.cos(angle), 
            y: centerY + radius * Math.sin(angle) 
          },
          data: { label: n.label || n.id || n.name || 'Entity' },
          style: {
            background: 'var(--surface-color)',
            backdropFilter: 'blur(16px)',
            color: '#fff',
            border: '1px solid var(--accent-primary)',
            borderRadius: '99px',
            padding: '10px 20px',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }
        };
      });

      const newEdges = backendEdges.map((e, i) => ({
        id: `e-${i}-${e.source}-${e.target}`,
        source: String(e.source),
        target: String(e.target),
        label: e.type || e.relationship || 'LINK',
        animated: true,
        style: { stroke: 'rgba(139, 92, 246, 0.7)', strokeWidth: 2 },
        labelStyle: { fill: '#e6e9f0', fontWeight: 600, fontSize: 10 },
        labelBgStyle: { fill: '#0b0d12', color: '#fff', padding: 2, borderRadius: 4 },
      }));

      setNodes(newNodes);
      setEdges(newEdges);

    } catch (err) {
      setError(err.message || "Failed to load Knowledge Graph from Neo4j.");
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-gradient-to-br from-[#0b0d12]/90 to-[#13161c]/90 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
      {/* Header Spotlight */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <div>
          <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2 drop-shadow-md">
             Global Graph Map
          </h2>
          <p className="text-white/60 text-xs mt-1 drop-shadow-md backdrop-blur-sm px-2 py-0.5 rounded-md bg-black/20 inline-block border border-white/5">
             Visualizing mapped entities from Neo4j
          </p>
        </div>
        
        <button 
          onClick={fetchGraph}
          disabled={isLoading}
          className="pointer-events-auto p-3 rounded-xl glass-panel hover:bg-white/10 transition-colors border border-white/20 shadow-xl flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
          title="Sync from Database"
        >
           <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-accent-primary' : 'text-white'}`} />
        </button>
      </div>

      <div className="w-full h-full relative z-10">
        {isLoading && nodes.length === 0 ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
               <Loader2 className="w-12 h-12 animate-spin text-accent-secondary mb-4 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
               <span className="text-white font-medium drop-shadow-md tracking-wide">QUERYING GRAPH DATABASE</span>
           </div>
        ) : nodes.length === 0 ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-30 opacity-70">
               <Network className="w-16 h-16 text-white mb-6 animate-pulse" />
               <span className="text-white text-lg font-medium tracking-wide">The Map is Empty</span>
               <span className="text-white/60 text-sm mt-3 max-w-md text-center leading-relaxed">
                 Waiting for document uploads. The AI orchestration layer will automatically populate entities and edges here.
               </span>
           </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            className="w-full h-full"
          >
            <Background color="rgba(255,255,255,0.03)" gap={28} size={2} />
            <Controls className="bg-black/50 border border-white/10 rounded-lg overflow-hidden m-4 shadow-xl fill-white text-white pointer-events-auto" />
          </ReactFlow>
        )}
      </div>

      {/* Floating Error Banner */}
      <AnimatePresence>
        {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-red-950/95 border border-red-500/50 backdrop-blur-xl text-white p-4 rounded-xl flex items-center justify-between shadow-[0_15px_50px_rgba(239,68,68,0.3)] z-30"
            >
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wide">Graph Rendering Error</span>
                  <span className="text-xs text-red-200 mt-0.5">{error}</span>
                </div>
              </div>
              <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100 transition-colors p-2 cursor-pointer bg-white/5 rounded-lg hover:bg-red-500/20">
                &times;
              </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
