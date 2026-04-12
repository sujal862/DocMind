"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Initial load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await api.getChatHistory();
        if (history && history.messages) {
          setMessages(history.messages);
        }
      } catch (err) {
        console.warn("Could not fetch chat history", err);
      }
    };
    fetchHistory();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    setInput('');
    setError(null);
    
    // Add user message to UI immediately
    const newMsg = { role: 'user', content: userQuery, id: Date.now() };
    setMessages((prev) => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const response = await api.sendChatMessage(userQuery);
      
      const botMsg = { 
        role: 'assistant', 
        // Handles multiple formats safely in case the backend payload changes
        content: response.answer || response.response || (typeof response === "string" ? response : 'Sorry, I could not parse the response.'),
        id: Date.now() + 1 
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err.message || 'Failed to connect to AI Engine.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-black/20 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Header Spotlight */}
      <div className="p-5 border-b border-white/5 bg-white/5 shrink-0 flex justify-between items-center z-10 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
            Workspace AI
          </h2>
          <p className="text-white/50 text-xs mt-1">Cross-document synthesis & relationship traversal via Neo4j</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth z-10">
        {messages.length === 0 && !isTyping ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-accent-primary" />
            </div>
            <p className="text-center max-w-sm text-sm leading-relaxed">
              Ask me anything about your uploaded documents. I can summarize, compare, or trace entity relationships intelligently.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id || Math.random()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-accent-secondary' : 'bg-accent-primary'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-accent-secondary/20 text-white border border-accent-secondary/30 rounded-tr-none' : 'glass-panel rounded-tl-none border-t-accent-primary/20'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* Loading Indicator */}
        {isTyping && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-accent-primary flex shrink-0 items-center justify-center shadow-lg">
                 <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl glass-panel rounded-tl-none flex items-center gap-3">
                 <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                 <span className="text-xs text-accent-primary font-medium tracking-wide">ANALYZING QUERIES & GRAPH WORKFLOW...</span>
              </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Error Banner */}
      <AnimatePresence>
        {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-red-950/90 border border-red-500/50 backdrop-blur-md text-white p-3 rounded-xl flex items-center justify-between shadow-[0_10px_40px_rgba(239,68,68,0.2)] z-30"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100 hover:text-red-300 transition-colors cursor-pointer">
                &times;
              </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-[#0b0d12]/80 border-t border-white/5 shrink-0 z-20 backdrop-blur-xl">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask about relationships, comparisons, or summaries..."
            className="w-full bg-black/40 border border-white/10 focus:border-accent-primary/50  focus:ring-2 focus:ring-accent-primary/20 rounded-full pl-6 pr-14 py-4 text-sm text-foreground outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center hover:bg-accent-primary/80 disabled:bg-white/5 disabled:border disabled:border-white/10 disabled:text-white/30 transition-all text-white cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
