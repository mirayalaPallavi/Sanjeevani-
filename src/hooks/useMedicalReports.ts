import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MedicalReport } from '@/types/database';

export function useMedicalReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching medical reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadReport = async (
    file: File,
    metadata: {
      reportType?: string;
      reportDate?: string;
      tags?: string[];
      description?: string;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-reports')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create report record
    const { data, error } = await supabase
      .from('medical_reports')
      .insert({
        patient_id: user.id,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        report_type: metadata.reportType,
        report_date: metadata.reportDate,
        tags: metadata.tags,
        description: metadata.description,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchReports();
    return data;
  };

  const deleteReport = async (reportId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-reports')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete record
    const { error } = await supabase
      .from('medical_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    await fetchReports();
  };

  const shareReport = async (
    reportId: string,
    shareWithDoctors: boolean,
    doctorIds?: string[]
  ) => {
    const { error } = await supabase
      .from('medical_reports')
      .update({
        is_shared_with_doctors: shareWithDoctors,
        shared_with: doctorIds,
      })
      .eq('id', reportId);

    if (error) throw error;
    await fetchReports();
  };

  const getReportUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  return {
    reports,
    isLoading,
    uploadReport,
    deleteReport,
    shareReport,
    getReportUrl,
    refetch: fetchReports,
  };
}
