import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { PatientDashboard } from '@/components/dashboard/PatientDashboard';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { role, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {role === 'admin' && <AdminDashboard />}
      {role === 'doctor' && <DoctorDashboard />}
      {role === 'patient' && <PatientDashboard />}
      {!role && (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">{t('common.account_setup_required')}</h2>
          <p className="text-muted-foreground mt-2">{t('common.complete_profile')}</p>
        </div>
      )}
    </Layout>
  );
}
