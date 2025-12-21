import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  session_id: string;
  messages: ChatMessage[];
  severity: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const parsed = (data || []).map((s) => ({
        ...s,
        messages: (s.messages as unknown as ChatMessage[]) || [],
      }));
      
      setSessions(parsed);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = useCallback(async (language = 'en') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          messages: [] as unknown as Json,
          language,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        ...data,
        messages: [],
      };

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }, [user]);

  const addMessage = useCallback(async (sessionId: string, message: ChatMessage) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedMessages = [...session.messages, { ...message, timestamp: new Date().toISOString() }];

    try {
      const { error } = await supabase
        .from('chat_history')
        .update({ messages: updatedMessages as unknown as Json })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: updatedMessages } : s))
      );
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }, [sessions]);

  const updateSeverity = useCallback(async (sessionId: string, severity: string) => {
    try {
      await supabase.from('chat_history').update({ severity }).eq('id', sessionId);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, severity } : s))
      );
    } catch (error) {
      console.error('Error updating severity:', error);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await supabase.from('chat_history').delete().eq('id', sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, []);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading,
    createSession,
    addMessage,
    updateSeverity,
    deleteSession,
    refetch: fetchSessions,
  };
}
