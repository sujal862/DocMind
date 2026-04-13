import { Inter } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "DocMind | Intelligent Document Workspace",
  description:
    "An intelligent document workspace connecting documents with vectors and knowledge graphs.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
