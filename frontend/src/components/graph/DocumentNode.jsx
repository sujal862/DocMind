"use client";

import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';

export default function DocumentNode({ data, selected }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold
        border transition-all cursor-pointer
        ${selected
          ? 'bg-accent/20 border-accent text-accent shadow-[0_0_12px_rgba(59,130,246,0.25)]'
          : 'bg-accent/8 border-accent/30 text-accent hover:bg-accent/15'
        }
      `}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-accent/50 !border-0" />
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate max-w-[140px]">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-accent/50 !border-0" />
    </div>
  );
}
