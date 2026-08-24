'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, TrendingUp, ShieldAlert, Target, Zap } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/dashboard-shell';
import { aiInsights } from '@/lib/dashboard-data';

const categoryIcon = {
  Forecast: TrendingUp,
  Risk: ShieldAlert,
  Opportunity: Target,
  Automation: Zap
} as const;

const categoryAccent = {
  Forecast: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300',
  Risk: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300',
  Opportunity: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
  Automation: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300'
} as const;

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const starterPrompts = [
  'Summarise this week\'s sales performance',
  'Which customers are at risk of churning?',
  'Forecast next month\'s revenue',
  'What should I reorder this week?'
];

export default function AiAssistantPage() {
  const { darkMode } = useDashboardTheme();
  const cardClass = darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/80 shadow-sm';
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hello Asha — I\'m the Ceylon IntelliBiz assistant. Ask me about sales, inventory, forecasts, or customer risk and I\'ll pull the latest signal from your workspace.' }
  ]);
  const [input, setInput] = useState('');

  const respond = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      {
        role: 'assistant',
        text: 'This workspace is wired for a live response once the AI Service (FastAPI) exposes a /insights endpoint — for now here is a preview based on the latest available data: revenue is trending up 18.2% month over month, with the freight-pallet SKU needing a reorder inside 5 days.'
      }
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI</p>
        <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-slate-950'}`}>Assistant &amp; insights</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {aiInsights.map((insight, index) => {
          const Icon = categoryIcon[insight.category];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className={`rounded-[24px] border p-5 ${cardClass}`}
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${categoryAccent[insight.category]}`}>
                  <Icon className="h-3.5 w-3.5" /> {insight.category}
                </span>
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{insight.confidence}% confidence</span>
              </div>
              <h3 className={`mt-3 text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{insight.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{insight.description}</p>
              <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${insight.confidence}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className={`flex flex-col overflow-hidden rounded-[28px] border ${cardClass}`}>
        <div className={`flex items-center gap-2 border-b px-5 py-4 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${darkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-950 text-white'}`}>
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Workspace assistant</p>
            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Grounded in your CRM, orders, and inventory data</p>
          </div>
        </div>

        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  message.role === 'user'
                    ? darkMode
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-950 text-white'
                    : darkMode
                      ? 'bg-white/5 text-slate-200'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className={`flex flex-wrap gap-2 border-t px-5 py-3 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => respond(prompt)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              <Sparkles className="h-3 w-3" /> {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            respond(input);
          }}
          className={`flex items-center gap-2 border-t px-5 py-4 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about revenue, stock, or a customer…"
            className={`flex-1 rounded-full border px-4 py-2.5 text-sm outline-none ${darkMode ? 'border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
          />
          <button
            type="submit"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? 'bg-cyan-400 text-slate-950' : 'bg-slate-950 text-white'}`}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
