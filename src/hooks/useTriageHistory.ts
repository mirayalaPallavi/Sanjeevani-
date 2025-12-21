import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TriageHistory, TriageResponse, UrgencyLevel } from '@/types/database';

export function useTriageHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<TriageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('triage_history')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData: TriageHistory[] = (data || []).map(item => ({
        ...item,
        ai_response: item.ai_response as unknown as TriageResponse | null,
        urgency: item.urgency as UrgencyLevel
      }));
      
      setHistory(transformedData);
    } catch (error) {
      console.error('Error fetching triage history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTriage = async (
    symptoms: string[],
    description: string,
    response: TriageResponse
  ) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('triage_history')
      .insert([{
        patient_id: user.id,
        symptoms,
        symptom_description: description,
        ai_response: JSON.parse(JSON.stringify(response)),
        predicted_conditions: response.predicted_conditions,
        urgency: response.urgency,
        recommended_specialization: response.recommended_specialization,
      }])
      .select()
      .single();

    if (error) throw error;
    
    const transformedData: TriageHistory = {
      ...data,
      ai_response: data.ai_response as unknown as TriageResponse | null,
      urgency: data.urgency as UrgencyLevel
    };
    
    setHistory(prev => [transformedData, ...prev]);
    return transformedData;
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return { history, isLoading, saveTriage, refetch: fetchHistory };
}
