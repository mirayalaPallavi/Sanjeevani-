import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function DoctorPatients() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            if (!user) return;
            try {
                // Fetch appointments to get list of patients
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
                        id,
                        patient_id,
                        patient_profile:profiles!patient_id(
                            full_name,
                            email,
                            avatar_url
                        ),
                        scheduled_at
                    `)
                    .eq('doctor_id', user.id)
                    .order('scheduled_at', { ascending: false });

                if (error) throw error;

                // Group by patient_id to get unique patients
                const uniquePatientsMap = new Map();
                data?.forEach((apt: any) => {
                    if (!uniquePatientsMap.has(apt.patient_id)) {
                        uniquePatientsMap.set(apt.patient_id, {
                            id: apt.id, // Latest appointment ID for chat link
                            user_id: apt.patient_id,
                            profile: apt.patient_profile,
                            lastAppointment: apt.scheduled_at
                        });
                    }
                });

                setPatients(Array.from(uniquePatientsMap.values()));
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [user]);

    return (
        <Layout>
            <div className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <User className="h-8 w-8 text-primary" />
                        {t('doctor.my_patients_title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('doctor.consulted_patients_desc')}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : patients.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('doctor.no_patients_found')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {patients.map((patient) => {
                            const profile = patient.profile;
                            return (
                                <Card key={patient.user_id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                                                <AvatarImage src={profile?.avatar_url || undefined} />
                                                <AvatarFallback className="bg-primary/5 text-primary">
                                                    {profile?.full_name?.split(' ').map((n: any) => n[0]).join('') || 'P'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg line-clamp-1">{profile?.full_name || t('doctor.anonymous')}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{profile?.email}</p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{t('doctor.last_seen', { date: format(new Date(patient.lastAppointment), 'MMM d, yyyy') })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button variant="outline" size="sm" asChild className="w-full">
                                                <Link to={`/consultation-chat/${patient.id}`}>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    {t('doctor.open_chat')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
}
