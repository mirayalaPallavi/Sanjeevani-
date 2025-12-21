import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Video, CheckCircle, XCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function DoctorAppointments() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<(Appointment & { patient: any })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        if (!user) return;
        try {
            // First get the doctor's ID
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!doctorData) return;

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          patient:patients(
            *,
            profile:profiles(*)
          )
        `)
                .eq('doctor_id', doctorData.id)
                .order('scheduled_at', { ascending: true });

            if (error) throw error;
            setAppointments((data as any) || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setAppointments(prev =>
                prev.map(apt => apt.id === id ? { ...apt, status } : apt)
            );

            toast({
                title: t('doctor.apt_status_updated', { status: t(`common.${status}`, { defaultValue: status }) }),
                description: t(`doctor.apt_${status}_desc`, { defaultValue: `The appointment has been ${status}.` }),
                variant: status === 'confirmed' ? "default" : "destructive"
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('doctor.apt_update_failed', { defaultValue: "Failed to update appointment." }),
                variant: "destructive"
            });
        }
    };

    const pending = appointments.filter(a => a.status === 'pending');
    const confirmed = appointments.filter(a => a.status === 'confirmed');

    if (loading) return <div className="p-8 text-center">{t('doctor.apt_loading')}</div>;

    return (
        <div className="container py-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{t('doctor.apt_requests_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('doctor.manage_schedule')}</p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="pending">{t('doctor.pending')} ({pending.length})</TabsTrigger>
                    <TabsTrigger value="confirmed">{t('doctor.confirmed_badge')} ({confirmed.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pending.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                {t('doctor.no_pending_req')}
                            </CardContent>
                        </Card>
                    ) : (
                        pending.map(apt => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                onConfirm={() => handleStatusUpdate(apt.id, 'confirmed')}
                                onCancel={() => handleStatusUpdate(apt.id, 'cancelled')}
                                isPending
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="confirmed" className="space-y-4">
                    {confirmed.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                {t('doctor.no_confirmed_apt')}
                            </CardContent>
                        </Card>
                    ) : (
                        confirmed.map(apt => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                isPending={false}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AppointmentCard({ appointment, onConfirm, onCancel, isPending }: {
    appointment: any,
    onConfirm?: () => void,
    onCancel?: () => void,
    isPending: boolean
}) {
    const { t } = useTranslation();
    const date = new Date(appointment.scheduled_at);
    const patientProfile = appointment.patient?.profile;

    return (
        <Card>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{patientProfile?.full_name || t('doctor.unknown_patient')}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(date, 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(date, 'h:mm a')}
                            </span>
                        </div>
                        {appointment.reason && (
                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded-md">
                                {t('doctor.reason_label')}: {appointment.reason}
                            </p>
                        )}
                        {/* Show video link for confirmed appointments */}
                        {!isPending && appointment.video_room_url && (
                            <div className="mt-3">
                                <Button asChild size="sm" className="gap-2">
                                    <Link to={`/consultation/${appointment.id}`}>
                                        <Video className="h-4 w-4" />
                                        {t('doctor.start_consultation')}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {isPending && (
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Button onClick={onCancel} variant="outline" className="flex-1 md:flex-none border-destructive text-destructive hover:bg-destructive/10">
                            {t('doctor.reject')}
                        </Button>
                        <Button onClick={onConfirm} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
                            {t('doctor.confirm')}
                        </Button>
                    </div>
                )}

                {!isPending && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50">
                        {t('doctor.confirmed_badge')}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}
