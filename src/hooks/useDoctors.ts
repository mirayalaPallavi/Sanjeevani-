import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Doctor, Profile } from '@/types/database';

interface DoctorWithProfile extends Doctor {
  profile?: Profile;
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_approved', true)
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (doctorsError) throw doctorsError;

      // Fetch profiles for doctors
      const userIds = (doctorsData || []).map(d => d.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

      const transformedData: DoctorWithProfile[] = (doctorsData || []).map(doctor => ({
        ...doctor,
        profile: profileMap.get(doctor.user_id),
      }));
      
      setDoctors(transformedData.filter(d => d.profile));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDoctorsBySpecialization = (specialization: string) => {
    return doctors.filter(
      (doctor) => doctor.specialization.toLowerCase() === specialization.toLowerCase()
    );
  };

  const searchDoctors = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.profile?.full_name.toLowerCase().includes(lowerQuery) ||
        doctor.specialization.toLowerCase().includes(lowerQuery)
    );
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return { doctors, isLoading, getDoctorsBySpecialization, searchDoctors, refetch: fetchDoctors };
}
