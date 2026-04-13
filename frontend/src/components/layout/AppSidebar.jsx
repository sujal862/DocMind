"use client";

import { useState } from 'react';
import { FileText, Network, MessageSquare, Brain, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useWorkspace } from '@/context/WorkspaceContext';
import { api } from '@/utils/api';

const NAV_ITEMS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

const COLLAPSED_MEMORY_COUNT = 3;

export default function AppSidebar() {
  const { activeView, setActiveView, triggerRefresh, memories } = useWorkspace();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetAll();
      triggerRefresh();
      setShowConfirm(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to reset: ' + (err.message || 'Unknown error'));
    } finally {
      setIsResetting(false);
    }
  };

  const displayedMemories = memoryExpanded
    ? memories
    : memories.slice(0, COLLAPSED_MEMORY_COUNT);
  const hasMore = memories.length > COLLAPSED_MEMORY_COUNT;

  return (
    <aside className="w-[240px] h-full flex flex-col bg-background-secondary border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <span className="text-accent font-bold text-sm">DM</span>
          </div>
          <span className="text-foreground font-semibold text-[15px]">DocMind</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                isActive
                  ? 'bg-accent-muted text-accent'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* AI Memory Section */}
      {memories.length > 0 && (
        <div className="px-4 pb-3 border-t border-border">
          <div className="flex items-center gap-2 py-3">
            <Brain className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
              AI Memory ({memories.length})
            </span>
          </div>
          <div className={cn(
            'space-y-1.5 overflow-y-auto',
            memoryExpanded ? 'max-h-[250px]' : ''
          )}>
            {displayedMemories.map((mem) => (
              <p
                key={mem.id}
                className="text-xs text-foreground-muted leading-relaxed"
                title={mem.memory}
              >
                {memoryExpanded ? mem.memory : (
                  <span className="truncate block">{mem.memory}</span>
                )}
              </p>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setMemoryExpanded(!memoryExpanded)}
              className="flex items-center gap-1 mt-2 text-[11px] text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              {memoryExpanded ? (
                <><ChevronUp className="w-3 h-3" /> Show less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show all ({memories.length})</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Reset Button */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        {showConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-danger font-medium px-1">
              This will delete all documents, graph data, vectors, and AI memory. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-danger text-white text-xs font-medium hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Clearing...</>
                ) : (
                  'Yes, clear all'
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
                className="px-3 py-2 rounded-lg border border-border text-foreground-muted text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-[18px] h-[18px]" />
            Clear All Data
          </button>
        )}
      </div>
    </aside>
  );
}
