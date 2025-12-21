import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CallRecord {
  id: string;
  user_id: string;
  appointment_id: string | null;
  call_type: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  participants: string[];
  status: string;
  created_at: string;
}

export function useCallRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('call_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching call records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecord = async (appointmentId?: string, callType = 'video') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('call_records')
        .insert({
          user_id: user.id,
          appointment_id: appointmentId || null,
          call_type: callType,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      setRecords((prev) => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating call record:', error);
      toast({ title: 'Error', description: 'Failed to create call record', variant: 'destructive' });
      return null;
    }
  };

  const updateRecord = async (id: string, updates: Partial<CallRecord>) => {
    try {
      const { error } = await supabase
        .from('call_records')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    } catch (error) {
      console.error('Error updating call record:', error);
    }
  };

  const endCall = async (id: string, transcript?: string, summary?: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;

    const endedAt = new Date().toISOString();
    const durationSeconds = Math.floor(
      (new Date(endedAt).getTime() - new Date(record.started_at).getTime()) / 1000
    );

    await updateRecord(id, {
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      transcript,
      summary,
      status: 'completed',
    });
  };

  return { records, isLoading, createRecord, updateRecord, endCall, refetch: fetchRecords };
}
