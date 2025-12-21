import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, AppointmentStatus } from '@/types/database';

export function useAppointments() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) {
      setAppointments([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch appointments with profiles in one go for better performance
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient_profile:profiles!patient_id(full_name, avatar_url),
          doctor_profile:profiles!doctor_id(full_name, avatar_url)
        `)
        .or(role === 'patient' ? `patient_id.eq.${user.id}` : `doctor_id.eq.${user.id}`)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const transformedData: Appointment[] = (data || []).map(item => ({
        ...item,
        status: item.status as AppointmentStatus,
        // Map profiles to the expected nested structure for the UI
        patient: { profile: item.patient_profile } as any,
        doctor: { profile: item.doctor_profile } as any
      }));

      setAppointments(transformedData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (
    doctorId: string,
    scheduledAt: Date,
    reason?: string,
    triageId?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        scheduled_at: scheduledAt.toISOString(),
        reason,
        triage_id: triageId,
      })
      .select()
      .single();

    if (error) throw error;

    await fetchAppointments();
    return data;
  };

  const updateAppointment = async (
    appointmentId: string,
    updates: Partial<Pick<Appointment, 'status' | 'notes' | 'video_room_url'>>
  ) => {
    const { error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId);

    if (error) throw error;
    await fetchAppointments();
  };

  const cancelAppointment = async (appointmentId: string) => {
    await updateAppointment(appointmentId, { status: 'cancelled' });
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    refetch: fetchAppointments,
  };
}
