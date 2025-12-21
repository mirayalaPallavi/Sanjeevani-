import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Shield,
  Database,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PendingDoctor {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string;
  created_at: string;
  full_name: string;
  email: string;
}

interface SystemStats {
  totalPatients: number;
  totalDoctors: number;
  pendingApprovals: number;
  totalAppointments: number;
  completedConsultations: number;
  activeChats: number;
  emergencyTriages: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'triage' | 'registration';
  description: string;
  timestamp: string;
  severity?: string;
}

const urgencyDistribution = [
  { name: 'Low', value: 45, color: 'hsl(152, 76%, 40%)' },
  { name: 'Medium', value: 30, color: 'hsl(38, 95%, 50%)' },
  { name: 'High', value: 20, color: 'hsl(0, 84%, 60%)' },
  { name: 'Emergency', value: 5, color: 'hsl(0, 80%, 55%)' },
];

const weeklyData = [
  { day: 'Mon', appointments: 12, triages: 24 },
  { day: 'Tue', appointments: 19, triages: 32 },
  { day: 'Wed', appointments: 15, triages: 28 },
  { day: 'Thu', appointments: 22, triages: 35 },
  { day: 'Fri', appointments: 18, triages: 30 },
  { day: 'Sat', appointments: 8, triages: 15 },
  { day: 'Sun', appointments: 5, triages: 12 },
];

export function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats>({
    totalPatients: 0,
    totalDoctors: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    completedConsultations: 0,
    activeChats: 0,
    emergencyTriages: 0,
  });
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Fetch pending doctors with profiles
      const { data: doctors } = await supabase.from('doctors').select('*').eq('is_approved', false);
      const userIds = (doctors || []).map(d => d.user_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const validDoctors: PendingDoctor[] = (doctors || [])
        .filter(d => profileMap.has(d.user_id))
        .map(d => ({
          ...d,
          full_name: profileMap.get(d.user_id)!.full_name,
          email: profileMap.get(d.user_id)!.email,
        }));
      
      setPendingDoctors(validDoctors);

      // Fetch counts
      const [patientsCount, doctorsCount, appointmentsCount, consultationsCount, chatsCount, emergencyCount] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('consultations').select('*', { count: 'exact', head: true }).not('ended_at', 'is', null),
        supabase.from('chat_history').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('triage_history').select('*', { count: 'exact', head: true }).eq('urgency', 'emergency'),
      ]);

      setStats({
        totalPatients: patientsCount.count || 0,
        totalDoctors: doctorsCount.count || 0,
        pendingApprovals: validDoctors.length,
        totalAppointments: appointmentsCount.count || 0,
        completedConsultations: consultationsCount.count || 0,
        activeChats: chatsCount.count || 0,
        emergencyTriages: emergencyCount.count || 0,
      });

      // Fetch recent activity
      const { data: triageData } = await supabase
        .from('triage_history')
        .select('id, created_at, urgency, symptoms')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [
        ...(triageData || []).map((t) => ({
          id: t.id,
          type: 'triage' as const,
          description: `Symptom check: ${t.symptoms?.slice(0, 2).join(', ')}`,
          timestamp: t.created_at,
          severity: t.urgency,
        })),
        ...(appointmentData || []).map((a) => ({
          id: a.id,
          type: 'appointment' as const,
          description: `Appointment ${a.status}`,
          timestamp: a.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const handleApprove = async (doctorId: string) => {
    try {
      await supabase.from('doctors').update({ is_approved: true }).eq('id', doctorId);
      toast({ title: 'Doctor Approved', description: 'The doctor can now start consultations.' });
      fetchStats();
    } catch {
      toast({ title: 'Error', description: 'Failed to approve doctor.', variant: 'destructive' });
    }
  };

  const handleReject = async (doctorId: string, userId: string) => {
    try {
      await supabase.from('doctors').delete().eq('id', doctorId);
      await supabase.from('user_roles').update({ role: 'patient' }).eq('user_id', userId);
      toast({ title: 'Application Rejected' });
      fetchStats();
    } catch {
      toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            System overview and management
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                <p className="text-xs text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Stethoscope className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDoctors}</p>
                <p className="text-xs text-muted-foreground">Doctors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emergency/10">
                <AlertTriangle className="h-5 w-5 text-emergency" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emergencyTriages}</p>
                <p className="text-xs text-muted-foreground">Emergency Triages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Pending Doctor Approvals</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pendingApprovals} doctor(s) waiting for approval
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                Action Required
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals
            {stats.pendingApprovals > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Weekly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Activity</CardTitle>
                <CardDescription>Appointments and symptom checks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-muted-foreground" fontSize={12} />
                    <YAxis className="text-muted-foreground" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="appointments" fill="hsl(174, 72%, 40%)" name="Appointments" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="triages" fill="hsl(200, 80%, 50%)" name="Symptom Checks" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Urgency Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Triage Urgency Distribution</CardTitle>
                <CardDescription>Breakdown of symptom check severities</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={urgencyDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {urgencyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="flex flex-wrap justify-center gap-4">
                  {urgencyDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Phone className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedConsultations}</p>
                  <p className="text-sm text-muted-foreground">Completed Consultations</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-info" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeChats}</p>
                  <p className="text-sm text-muted-foreground">Active Chats (24h)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Doctor Approvals</CardTitle>
              <CardDescription>Review and approve new doctor registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDoctors.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{doctor.full_name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{doctor.specialization}</Badge>
                          <Badge variant="secondary">License: {doctor.license_number}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(doctor.id, doctor.user_id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doctor.id)}
                          className="gradient-primary border-0"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'triage' ? 'bg-info/10' :
                          activity.type === 'appointment' ? 'bg-success/10' :
                          'bg-primary/10'
                        }`}>
                          {activity.type === 'triage' && <Activity className="h-4 w-4 text-info" />}
                          {activity.type === 'appointment' && <Calendar className="h-4 w-4 text-success" />}
                          {activity.type === 'registration' && <Users className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {activity.severity && (
                          <Badge className={`text-xs ${
                            activity.severity === 'low' ? 'bg-success/10 text-success' :
                            activity.severity === 'medium' ? 'bg-warning/10 text-warning' :
                            activity.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                            'bg-emergency text-emergency-foreground'
                          }`}>
                            {activity.severity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
