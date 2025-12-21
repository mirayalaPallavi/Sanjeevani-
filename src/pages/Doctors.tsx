import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useDoctors } from '@/hooks/useDoctors';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Stethoscope,
  Search,
  Star,
  Clock,
  Calendar as CalendarIcon,
  Loader2,
  Filter,
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, setHours, setMinutes } from 'date-fns';

const specializations = [
  'All Specializations',
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Psychiatrist',
  'Orthopedist',
  'Gynecologist',
  'ENT Specialist',
  'Ophthalmologist',
];

const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

export default function Doctors() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { doctors, isLoading } = useDoctors();
  const { createAppointment } = useAppointments();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState(
    searchParams.get('specialization') || 'All Specializations'
  );
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        doctor.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialization =
        selectedSpecialization === 'All Specializations' ||
        doctor.specialization === selectedSpecialization;
      return matchesSearch && matchesSpecialization;
    });
  }, [doctors, searchQuery, selectedSpecialization]);

  const handleBookAppointment = async () => {
    if (!user) {
      toast({
        title: t('patient.login_required'),
        description: t('patient.login_desc'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: t('patient.info_required'),
        description: t('patient.datetime_required'),
        variant: 'destructive',
      });
      return;
    }

    setIsBooking(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      await createAppointment(selectedDoctor, scheduledAt, reason);

      toast({
        title: t('patient.booking_success_title'),
        description: t('patient.booking_success_desc'),
      });

      setDialogOpen(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime('');
      setReason('');
    } catch (error: any) {
      console.error('Booking Error:', error);
      toast({
        title: t('patient.booking_failed'),
        description: error.message || t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const doctor = doctors.find((d) => d.user_id === selectedDoctor);

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            {t('patient.find_doctors_title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('patient.find_doctors_desc')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('patient.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedSpecialization}
            onValueChange={setSelectedSpecialization}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec === 'All Specializations' ? t('patient.all_specializations') : spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{t('patient.no_doctors_found')}</h3>
              <p className="text-muted-foreground">
                {t('patient.adjust_filters')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={doctor.profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {doctor.profile.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Dr. {doctor.profile.full_name}
                      </CardTitle>
                      <CardDescription>{doctor.specialization}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {doctor.qualification && (
                      <p className="text-muted-foreground">{doctor.qualification}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span>{doctor.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({doctor.total_reviews})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{doctor.experience_years} {t('patient.yrs_exp')}</span>
                      </div>
                    </div>
                    {doctor.bio && (
                      <p className="text-muted-foreground line-clamp-2">
                        {doctor.bio}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary">
                        {doctor.consultation_fee && doctor.consultation_fee > 0 ? `₹${doctor.consultation_fee}/${t('patient.session')}` : t('patient.free')}
                      </Badge>
                      <Dialog
                        open={dialogOpen && selectedDoctor === doctor.user_id}
                        onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) setSelectedDoctor(doctor.user_id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {t('patient.book_btn')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              {t('patient.book_with')} Dr. {doctor.profile.full_name}
                            </DialogTitle>
                            <DialogDescription>
                              {t('patient.select_date_time_desc', { defaultValue: 'Select a date and time for your consultation' })}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                {t('patient.select_date')}
                              </label>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) =>
                                  date < new Date() || date > addDays(new Date(), 30)
                                }
                                className="rounded-md border pointer-events-auto"
                              />
                            </div>
                            {selectedDate && (
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  {t('patient.select_time')}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                  {timeSlots.map((time) => (
                                    <Button
                                      key={time}
                                      variant={
                                        selectedTime === time
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="sm"
                                      onClick={() => setSelectedTime(time)}
                                    >
                                      {time}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                {t('patient.visit_reason')} <span className="text-destructive">*</span>
                              </label>
                              <Textarea
                                placeholder={t('patient.reason_placeholder')}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                              />
                            </div>
                            <Button
                              onClick={handleBookAppointment}
                              disabled={isBooking || !selectedDate || !selectedTime || !reason.trim()}
                              className="w-full"
                            >
                              {isBooking ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {t('patient.confirm_booking')}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
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
