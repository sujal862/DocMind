import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "DocMind | Intelligent Document Workspace",
  description: "An intelligent document workspace connecting documents with vectors and knowledge graphs.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="h-screen flex text-foreground bg-background overflow-hidden relative">
        
        {/* Sleek Minimal App Sidebar */}
        <aside className="w-16 flex flex-col items-center py-6 border-r border-white/10 bg-[#0b0d12]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400 flex items-center justify-center font-bold text-xl mb-8 hover-lift cursor-pointer">
              DM
            </div>
        </aside>
        
        {/* Global Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#0b0d12] to-[#13161c]">
          {children}
        </main>
      </body>
    </html>
  );
}
