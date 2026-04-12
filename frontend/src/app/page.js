import DocumentUpload from '../components/DocumentUpload';
import KnowledgeGraph from '../components/KnowledgeGraph';
import ChatInterface from '../components/ChatInterface';

export default function DashboardPage() {
  return (
    <div className="flex flex-col lg:flex-row w-full h-full p-4 gap-4 overflow-hidden relative">
      
      {/* Background Decorative Glow (Aesthetics) */}
      <div className="absolute top-10 left-20 w-96 h-96 bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Left Sidebar: Document Management */}
      <div className="w-full lg:w-[350px] shrink-0 h-[40vh] lg:h-full bg-black/20 rounded-2xl border border-white/5 shadow-xl glass-panel relative z-10">
         <DocumentUpload />
      </div>

      {/* Center Layout: Knowledge Graph Visualization */}
      <div className="flex-1 h-[50vh] lg:h-full min-w-0 relative z-10">
         <KnowledgeGraph />
      </div>

      {/* Right Sidebar: Chat & Query Engine */}
      <div className="w-full lg:w-[400px] shrink-0 h-[50vh] lg:h-full z-10">
         <ChatInterface />
      </div>
      
    </div>
  );
}
