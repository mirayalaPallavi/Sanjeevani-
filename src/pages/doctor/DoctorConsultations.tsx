import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function DoctorConsultations() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [consultations, setConsultations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConsultations = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select(`
            *,
            patient:patients(
              *,
              profile:profiles(*)
            )
          `)
                    .eq('doctor_id', user.id)
                    .eq('status', 'completed')
                    .order('scheduled_at', { ascending: false });

                if (error) throw error;
                setConsultations(data || []);
            } catch (error) {
                console.error('Error fetching consultations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConsultations();
    }, [user]);

    return (
        <Layout>
            <div className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Video className="h-8 w-8 text-primary" />
                        {t('doctor.consultation_history_title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('doctor.consultation_history_desc')}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : consultations.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{t('doctor.no_consultations_found')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {consultations.map((consult) => (
                            <Card key={consult.id} className="hover:bg-muted/30 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{consult.patient?.profile?.full_name}</h3>
                                                <Badge variant="outline">{t('doctor.completed')}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(consult.scheduled_at), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            {consult.notes && (
                                                <p className="text-sm mt-3 line-clamp-2 text-muted-foreground italic">
                                                    "{consult.notes}"
                                                </p>
                                            )}
                                        </div>
                                        <Link
                                            to={`/consultation/${consult.id}`}
                                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                                        >
                                            {t('doctor.view_details')} <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
