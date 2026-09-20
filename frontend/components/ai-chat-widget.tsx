'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendChatMessage } from '@/lib/ai';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const starterPrompts = ['What can you do?', 'What should I reorder this week?', 'Do I have overdue invoices?'];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am your IntelliBiz AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(starterPrompts);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isTyping) return;

    setMessages(prev => [...prev, { id: `${Date.now()}-user`, role: 'user', content }]);
    setInput('');
    setSuggestions([]);
    setIsTyping(true);

    try {
      const { reply, suggestions: next } = await sendChatMessage(content);
      setMessages(prev => [...prev, { id: `${Date.now()}-ai`, role: 'assistant', content: reply }]);
      setSuggestions(next);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}-err`, role: 'assistant', content: "Sorry, I couldn't reach the assistant just now. Please try again in a moment." }
      ]);
      setSuggestions(starterPrompts);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex h-[500px] w-[350px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white/80 shadow-[0_30px_70px_-20px_rgba(15,23,42,0.3)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80 sm:w-[400px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/50 p-4 dark:border-white/10 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-600 dark:text-cyan-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">IntelliBiz AI</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Online
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('flex max-w-[85%] gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-auto', msg.role === 'user' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400')}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user' 
                        ? 'rounded-br-sm bg-slate-950 text-white dark:bg-white dark:text-slate-950' 
                        : 'rounded-bl-sm border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex w-full justify-start">
                  <div className="flex max-w-[85%] gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 mt-auto">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3.5 dark:border-white/10 dark:bg-slate-800">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
              {suggestions.length > 0 && !isTyping && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI assistant..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  <Send className="h-4 w-4 -ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
