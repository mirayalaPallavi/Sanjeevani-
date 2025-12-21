import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  Video,
  XCircle,
  Loader2,
  Stethoscope,
  User,
  MessageSquare,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { AppointmentStatus } from '@/types/database';

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  completed: 'bg-muted text-muted-foreground border-muted',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Appointments() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { appointments, cancelAppointment, updateAppointment, isLoading } = useAppointments();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const upcomingAppointments = appointments.filter(
    (apt) =>
      (apt.status === 'pending' || apt.status === 'confirmed') &&
      !isPast(new Date(apt.scheduled_at))
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      apt.status === 'completed' ||
      apt.status === 'cancelled' ||
      isPast(new Date(apt.scheduled_at))
  );

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelAppointment(id);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirm = async (id: string) => {
    await updateAppointment(id, { status: 'confirmed' });
  };

  const isDoctor = role === 'doctor';

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              {t('patient.appointments_title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('patient.manage_consultations_desc')}
            </p>
          </div>
          {!isDoctor && (
            <Button asChild>
              <Link to="/doctors">{t('patient.book_new_apt')}</Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              {t('patient.upcoming')} ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t('patient.past')} ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">{t('patient.no_upcoming_apt')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {isDoctor
                      ? t('patient.no_scheduled_doc')
                      : t('patient.book_consultation_desc')}
                  </p>
                  {!isDoctor && (
                    <Button asChild>
                      <Link to="/doctors">{t('nav.find_doctors')}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => {
                  const person = isDoctor ? apt.patient : apt.doctor;
                  const profile = person?.profile;
                  const isUpcoming = isToday(new Date(apt.scheduled_at));

                  return (
                    <Card
                      key={apt.id}
                      className={isUpcoming ? 'border-primary' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {profile?.full_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('') || (isDoctor ? 'P' : 'D')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {isDoctor ? '' : `${t('patient.doctor_label', { defaultValue: 'Dr.' })} `}
                                {profile?.full_name || (isDoctor ? t('patient.patient_label', { defaultValue: 'Patient' }) : t('patient.doctor_label', { defaultValue: 'Doctor' }))}
                              </h3>
                              <Badge className={statusColors[apt.status]}>
                                {t(`doctor.${apt.status}`, { defaultValue: apt.status })}
                              </Badge>
                              {isUpcoming && (
                                <Badge variant="default">{t('patient.today')}</Badge>
                              )}
                            </div>
                            {!isDoctor && apt.doctor && (
                              <p className="text-sm text-muted-foreground">
                                {apt.doctor.specialization}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(apt.scheduled_at), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(apt.scheduled_at), 'h:mm a')}
                              </span>
                            </div>
                            {apt.reason && (
                              <p className="text-sm mt-2">
                                <span className="text-muted-foreground">{t('doctor.reason_label')}: </span>
                                {apt.reason}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {apt.status === 'pending' && isDoctor && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(apt.id)}
                              >
                                {t('doctor.confirm')}
                              </Button>
                            )}
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
                                    {t('patient.video')}
                                  </Link>
                                </Button>
                              </div>
                            )}
                            {apt.status !== 'cancelled' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={cancellingId === apt.id}
                                  >
                                    {cancellingId === apt.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('patient.cancel_apt_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('patient.cancel_apt_desc')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('patient.keep_apt')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancel(apt.id)}
                                    >
                                      {t('patient.cancel_apt_title')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">{t('patient.no_past_apt')}</h3>
                  <p className="text-muted-foreground">
                    {t('patient.apt_history_appear')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((apt) => {
                  const person = isDoctor ? apt.patient : apt.doctor;
                  const profile = person?.profile;

                  return (
                    <Card key={apt.id} className="opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {profile?.full_name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('') || (isDoctor ? 'P' : 'D')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {isDoctor ? '' : `${t('patient.doctor_label', { defaultValue: 'Dr.' })} `}
                                {profile?.full_name || (isDoctor ? t('patient.patient_label', { defaultValue: 'Patient' }) : t('patient.doctor_label', { defaultValue: 'Doctor' }))}
                              </h3>
                              <Badge className={statusColors[apt.status]}>
                                {t(`doctor.${apt.status}`, { defaultValue: apt.status })}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(apt.scheduled_at), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(apt.scheduled_at), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
