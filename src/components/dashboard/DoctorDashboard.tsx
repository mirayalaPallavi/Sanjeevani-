import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  Video,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function DoctorDashboard() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const { appointments, updateAppointment, isLoading } = useAppointments();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Auto-enable availability on login
  useEffect(() => {
    const checkAndSetAvailability = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('is_available, is_approved')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsAvailable(data.is_available);

          // If not available or not approved, auto-enable
          if (!data.is_available || !data.is_approved) {
            await supabase
              .from('doctors')
              .update({ is_available: true, is_approved: true })
              .eq('user_id', user.id);
            setIsAvailable(true);
          }
        } else {
          // Record missing: Create it!
          console.log('Creating missing doctor record for:', user.id);
          const { error: insertError } = await supabase
            .from('doctors')
            .insert([{
              user_id: user.id,
              license_number: 'PENDING',
              specialization: 'General',
              is_available: true,
              is_approved: true
            }]);

          if (insertError) throw insertError;
          setIsAvailable(true);
        }
      } catch (err) {
        console.error('Error handling doctor availability:', err);
      }
    };

    checkAndSetAvailability();
  }, [user]);

  const toggleAvailability = async () => {
    if (!user || isAvailable === null) return;
    setIsUpdating(true);

    const newStatus = !isAvailable;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: newStatus, is_approved: true })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsAvailable(newStatus);
      toast({
        title: newStatus ? t('doctor.status_online') : t('doctor.status_offline'),
        description: newStatus ? t('doctor.online_desc') : t('doctor.offline_desc'),
      });
    } catch (err: any) {
      console.error('Error toggling availability:', err);
      toast({
        title: t('doctor.update_failed'),
        description: err.message || t('doctor.update_failed_desc', { defaultValue: "Unable to change availability status." }),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingAppointments = appointments.filter((apt) => apt.status === 'pending');
  const todayAppointments = appointments.filter(
    (apt) =>
      apt.status !== 'cancelled' &&
      isToday(new Date(apt.scheduled_at))
  );
  const upcomingAppointments = appointments.filter(
    (apt) =>
      apt.status !== 'cancelled' &&
      apt.status !== 'completed' &&
      new Date(apt.scheduled_at) >= startOfDay(new Date())
  );

  const handleConfirm = async (id: string) => {
    await updateAppointment(id, { status: 'confirmed' });
  };

  const handleCancel = async (id: string) => {
    await updateAppointment(id, { status: 'cancelled' });
  };

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('doctor.greeting', { name: profile?.full_name ? profile.full_name.split(' ').slice(-1)[0] : 'Doctor' })}
          </h1>
          {!profile && (
            <div className="flex items-center gap-2 mt-2 py-1 px-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20 max-w-fit">
              <AlertCircle className="h-4 w-4" />
              <span>Profile missing in database. Run the SQL fix!</span>
            </div>
          )}
          <p className="text-muted-foreground mt-1">
            {t('doctor.welcome_desc')}
          </p>
        </div>

        <Card className={`border-2 ${isAvailable ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'} min-w-[240px]`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isAvailable ? 'bg-success text-white' : 'bg-destructive text-white'} shadow-lg animate-pulse`}>
                  {isAvailable ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-base font-extrabold leading-none text-foreground">{isAvailable ? t('doctor.available') : t('doctor.offline')}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-bold">{t('doctor.booking_status')}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isAvailable ? "outline" : "default"}
                onClick={toggleAvailability}
                disabled={isUpdating}
                className={!isAvailable ? "bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 shadow-xl border-none" : "font-black px-8 border-2"}
              >
                {isAvailable ? t('doctor.go_offline') : t('doctor.go_online')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingAppointments.length}</p>
                <p className="text-xs text-muted-foreground">{t('doctor.pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-xs text-muted-foreground">{t('doctor.today')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                <p className="text-xs text-muted-foreground">{t('doctor.upcoming')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(appointments.map((a) => a.patient_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">{t('doctor.patients')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('doctor.pending_approvals')}</CardTitle>
            <CardDescription>{t('doctor.pending_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
            ) : pendingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">{t('doctor.all_caught_up')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAppointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {apt.patient?.profile?.full_name || 'Patient'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.scheduled_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <Badge variant="secondary">pending</Badge>
                    </div>
                    {apt.reason && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {apt.reason}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="flex-1"
                      >
                        <Link to={`/consultation-chat/${apt.id}`}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {t('doctor.chat')}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(apt.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('doctor.confirm')}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(apt.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('doctor.todays_schedule')}</CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments">
                {t('dashboard.view_all')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('doctor.no_appointments_today')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-bold">
                        {format(new Date(apt.scheduled_at), 'h:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.scheduled_at), 'a')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {apt.patient?.profile?.full_name || 'Patient'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.reason || 'General consultation'}
                      </p>
                    </div>
                    <Badge
                      variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                    >
                      {apt.status}
                    </Badge>
                    {apt.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/consultation-chat/${apt.id}`}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {t('doctor.chat')}
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link to={`/consultation/${apt.id}`}>
                            <Video className="h-4 w-4 mr-1" />
                            {t('doctor.join')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
