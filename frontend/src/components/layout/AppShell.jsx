"use client";

import { useWorkspace } from '@/context/WorkspaceContext';
import AppSidebar from './AppSidebar';
import DocumentsView from '@/components/views/DocumentsView';
import GraphExplorer from '@/components/views/GraphExplorer';
import ChatView from '@/components/views/ChatView';

export default function AppShell() {
  const { activeView } = useWorkspace();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        {/* Keep all views mounted, hide inactive ones with CSS so state is preserved */}
        <div className={activeView === 'documents' ? 'h-full' : 'hidden'}>
          <DocumentsView />
        </div>
        <div className={activeView === 'graph' ? 'h-full' : 'hidden'}>
          <GraphExplorer />
        </div>
        <div className={activeView === 'chat' ? 'h-full' : 'hidden'}>
          <ChatView />
        </div>
      </main>
    </div>
  );
}
