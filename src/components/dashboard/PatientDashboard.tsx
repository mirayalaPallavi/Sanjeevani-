import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { useTriageHistory } from '@/hooks/useTriageHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Calendar,
  FileText,
  MapPin,
  Stethoscope,
  Clock,
  AlertTriangle,
  ArrowRight,
  Video,
} from 'lucide-react';
import { format } from 'date-fns';

const quickActions = [
  {
    titleKey: 'dashboard.actions.symptom_title',
    descriptionKey: 'dashboard.actions.symptom_desc',
    icon: Activity,
    href: '/symptom-checker',
    color: 'bg-primary',
  },
  {
    titleKey: 'dashboard.actions.book_title',
    descriptionKey: 'dashboard.actions.book_desc',
    icon: Calendar,
    href: '/doctors',
    color: 'bg-accent',
  },
  {
    titleKey: 'dashboard.actions.reports_title',
    descriptionKey: 'dashboard.actions.reports_desc',
    icon: FileText,
    href: '/reports',
    color: 'bg-success',
  },
  {
    titleKey: 'dashboard.actions.nearby_title',
    descriptionKey: 'dashboard.actions.nearby_desc',
    icon: MapPin,
    href: '/nearby',
    color: 'bg-warning',
  },
];

const urgencyColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  emergency: 'bg-emergency text-emergency-foreground',
};

export function PatientDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { history: triageHistory, isLoading: triageLoading } = useTriageHistory();

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== 'cancelled' && apt.status !== 'completed'
  );

  const recentTriage = triageHistory.slice(0, 3);

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard.greeting')}, {profile?.full_name?.split(' ')[0] || 'Patient'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.help_today')}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div
                  className={`${action.color} p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{t(action.titleKey)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(action.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('dashboard.upcoming_appointments')}</CardTitle>
              <CardDescription>{t('dashboard.scheduled_consultations')}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments">
                {t('dashboard.view_all')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('dashboard.no_upcoming')}</p>
                <Button asChild className="mt-4">
                  <Link to="/doctors">{t('dashboard.book_consultation')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Dr. {apt.doctor?.profile?.full_name || 'Doctor'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(apt.scheduled_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <Badge
                      variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                    >
                      {apt.status}
                    </Badge>
                    {apt.status === 'confirmed' && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/consultation/${apt.id}`}>
                          <Video className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Symptom Checks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('dashboard.recent_symptom_checks')}</CardTitle>
              <CardDescription>{t('dashboard.triage_history_desc')}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/symptom-checker">
                {t('dashboard.new_check')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {triageLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : recentTriage.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('dashboard.no_symptom_checks')}</p>
                <Button asChild className="mt-4">
                  <Link to="/symptom-checker">{t('dashboard.start_symptom_check')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTriage.map((triage) => (
                  <div
                    key={triage.id}
                    className="p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {triage.urgency === 'emergency' && (
                          <AlertTriangle className="h-4 w-4 text-emergency" />
                        )}
                        <Badge className={urgencyColors[triage.urgency]}>
                          {triage.urgency}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(triage.created_at), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t('dashboard.symptoms')}: </span>
                      {triage.symptoms.slice(0, 3).join(', ')}
                      {triage.symptoms.length > 3 && '...'}
                    </p>
                    {triage.recommended_specialization && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('dashboard.recommended')}: {triage.recommended_specialization}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
