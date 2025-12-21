import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Stethoscope, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/database';

export default function RoleSelection() {
    const { t } = useTranslation();
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = async (role: AppRole) => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Check if role already exists
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingRole) {
                // If role exists but we are here, just redirect
                await refreshProfile();
                navigate('/dashboard');
                return;
            }

            // 2. Insert new role
            const { error } = await supabase
                .from('user_roles')
                .insert([{ user_id: user.id, role }]);

            if (error) throw error;

            // 3. Create specific profile entry based on role
            if (role === 'patient') {
                const { error: patientError } = await supabase
                    .from('patients')
                    .insert([{ user_id: user.id }]);
                if (patientError) console.error('Error creating patient profile:', patientError);
                // Continue anyway, basic role is set
            } else if (role === 'doctor') {
                // Doctors might need manual approval, but we create the entry
                const { error: doctorError } = await supabase
                    .from('doctors')
                    .insert([{
                        user_id: user.id,
                        license_number: 'PENDING-' + user.id.slice(0, 8), // Placeholder
                        specialization: 'General',
                        experience_years: 0,
                        consultation_fee: 0,
                        is_approved: true, // Auto-approve for demo
                        is_available: true,
                        available_days: [],
                        available_from: '09:00',
                        available_to: '17:00',
                        rating: 0,
                        total_reviews: 0
                    }]);
                if (doctorError) console.error('Error creating doctor profile:', doctorError);
            }

            // 4. Refresh and redirect
            await refreshProfile();

            toast({
                title: t('auth.welcome'),
                description: t('auth.selection_success', { role: t(`auth.role_${role}`, { defaultValue: role }) }),
            });

            navigate('/dashboard');

        } catch (error) {
            console.error('Role selection error:', error);
            let errorMessage = error.message || t('auth.role_save_failed', { defaultValue: "Failed to save your role. Please try again." });
            if (errorMessage.includes('schema cache')) {
                errorMessage = "Database table 'user_roles' is missing. Please follow the SQL fix instructions in the chat.";
            }
            toast({
                title: t('common.error', { defaultValue: "Error" }),
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">{t('auth.role_title')}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {t('auth.role_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => handleRoleSelect('patient')}
                            disabled={loading}
                            className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-muted hover:border-primary/50 bg-card hover:bg-primary/5 transition-all duration-300"
                        >
                            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('auth.i_am_patient')}</h3>
                            <p className="text-center text-muted-foreground text-sm">
                                {t('auth.patient_role_desc')}
                            </p>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                        </button>

                        <button
                            onClick={() => handleRoleSelect('doctor')}
                            disabled={loading}
                            className="group relative flex flex-col items-center p-8 rounded-2xl border-2 border-muted hover:border-primary/50 bg-card hover:bg-primary/5 transition-all duration-300"
                        >
                            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Stethoscope className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('auth.i_am_doctor')}</h3>
                            <p className="text-center text-muted-foreground text-sm">
                                {t('auth.doctor_role_desc')}
                            </p>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground pt-4">
                        {t('auth.role_unchangeable')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
