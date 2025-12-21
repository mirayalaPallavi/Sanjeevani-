import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Video, Loader2, ArrowLeft, Clock, User, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AppointmentStatus } from '@/types/database';

export default function Consultation() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [otherProfile, setOtherProfile] = useState<any>(null);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    if (!appointmentId) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      
      setAppointment({ ...data, status: data.status as AppointmentStatus });
      setNotes(data.notes || '');
      if (data.video_room_url) setVideoUrl(data.video_room_url);

      // Fetch the other person's profile
      const otherUserId = role === 'doctor' ? data.patient_id : data.doctor_id;
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', otherUserId).single();
      setOtherProfile(profile);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Unable to load appointment.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createVideoRoom = async () => {
    if (!appointment) return;
    setIsJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-video-room', {
        body: { appointmentId: appointment.id },
      });
      if (error) throw error;
      await supabase.from('appointments').update({ video_room_url: data.url }).eq('id', appointment.id);
      setVideoUrl(data.url);
      window.open(data.url, '_blank');
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to start video call.', variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  const joinVideoRoom = () => { if (videoUrl) window.open(videoUrl, '_blank'); };

  const saveNotes = async () => {
    if (!appointment) return;
    setIsSavingNotes(true);
    try {
      await supabase.from('appointments').update({ notes }).eq('id', appointment.id);
      toast({ title: 'Notes Saved' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setIsSavingNotes(false); }
  };

  const completeConsultation = async () => {
    if (!appointment) return;
    try {
      await supabase.from('appointments').update({ status: 'completed', notes }).eq('id', appointment.id);
      toast({ title: 'Consultation Completed' });
      navigate('/appointments');
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  if (!appointment) return <Layout><div className="container py-8 text-center"><h1 className="text-2xl font-bold">Appointment Not Found</h1><Button onClick={() => navigate('/appointments')} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></div></Layout>;

  const isDoctor = role === 'doctor';

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate('/appointments')} className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" />Video Consultation</CardTitle></CardHeader>
              <CardContent>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Video className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium mb-4">{videoUrl ? 'Video Room Ready' : 'Start Your Consultation'}</p>
                    <Button onClick={videoUrl ? joinVideoRoom : createVideoRoom} disabled={isJoining} size="lg">
                      {isJoining ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Video className="h-5 w-5 mr-2" />}
                      {videoUrl ? 'Join Video Call' : 'Start Video Call'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Consultation Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} disabled={!isDoctor} />
                {isDoctor && <div className="flex gap-2 mt-4"><Button variant="outline" onClick={saveNotes} disabled={isSavingNotes}>{isSavingNotes && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Notes</Button><Button onClick={completeConsultation}>Complete Consultation</Button></div>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Appointment Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">{isDoctor ? <User className="h-6 w-6 text-primary" /> : <Stethoscope className="h-6 w-6 text-primary" />}</div>
                  <div><p className="font-medium">{isDoctor ? '' : 'Dr. '}{otherProfile?.full_name || 'Unknown'}</p></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(appointment.scheduled_at), 'EEEE, MMMM d, yyyy h:mm a')}</span></div>
                </div>
                {appointment.reason && <div><p className="text-sm font-medium">Reason</p><p className="text-sm text-muted-foreground">{appointment.reason}</p></div>}
                <Badge className={appointment.status === 'confirmed' ? 'bg-success/10 text-success' : ''}>{appointment.status}</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
