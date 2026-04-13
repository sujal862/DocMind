"use client";

import { Handle, Position } from '@xyflow/react';

export default function EntityNode({ data, selected }) {
  return (
    <div
      className={`
        px-4 py-2 rounded-full text-xs font-medium
        border transition-all cursor-pointer
        ${selected
          ? 'bg-accent/20 border-accent text-accent shadow-[0_0_12px_rgba(59,130,246,0.25)]'
          : 'bg-surface border-border text-foreground hover:border-border-hover'
        }
      `}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-border !border-0" />
      <span className="truncate max-w-[150px] block">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-border !border-0" />
    </div>
  );
}
