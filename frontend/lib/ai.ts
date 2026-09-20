import { apiFetch } from '@/lib/auth';
import type { AiInsight } from '@/lib/dashboard-data';

export type ChatReply = { reply: string; suggestions: string[] };

const CHAT_SESSION_KEY = 'intellibiz-chat-session';

function chatSessionId(): string {
  try {
    const existing = window.localStorage.getItem(CHAT_SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(CHAT_SESSION_KEY, id);
    return id;
  } catch {
    return 'anonymous';
  }
}

export async function sendChatMessage(content: string): Promise<ChatReply> {
  const response = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId: chatSessionId(), content })
  });
  if (!response.ok) {
    throw new Error(`Chat request failed (${response.status})`);
  }
  const data = await response.json();
  return {
    reply: String(data?.aiMessage?.content ?? ''),
    suggestions: Array.isArray(data?.suggestions) ? data.suggestions : []
  };
}

export async function fetchInsights(): Promise<AiInsight[]> {
  const response = await apiFetch('/api/ai/insights');
  if (!response.ok) {
    throw new Error(`Insights request failed (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected insights response');
  }
  return data;
}
