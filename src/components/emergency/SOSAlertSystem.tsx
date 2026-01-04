import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Phone, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SOSEvent {
    id: string;
    user_name: string;
    latitude: number;
    longitude: number;
    created_at: string;
    emergency_type: string;
}

export function SOSAlertSystem() {
    const { user, role } = useAuth();
    const [sosEvent, setSosEvent] = useState<SOSEvent | null>(null);
    const { toast } = useToast();

    const playAlertSound = () => {
        // Simple beep sequence
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.type = 'square';
        osc.start();
        osc.stop(ctx.currentTime + 0.5);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            osc2.connect(ctx.destination);
            osc2.frequency.setValueAtTime(600, ctx.currentTime);
            osc2.type = 'square';
            osc2.start();
            osc2.stop(ctx.currentTime + 0.5);
        }, 600);
    };

    useEffect(() => {
        console.log('SOS System Init. User:', user?.email, 'Role:', role);

        if (!user) {
            console.log('SOS System: Not subscribing (User not logged in)');
            return;
        }

        // Re-enable security check
        if (role !== 'doctor' && role !== 'admin') {
            console.log('SOS System: Not subscribing. Current Role:', role);
            return;
        }

        console.log('SOS System: Subscribing to alerts (Role optimized)...');
        // Debug toast removed

        const channel = supabase
            .channel('sos_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sos_events',
                    // filter: `status=eq.active`, -- Removed for broader testing
                },
                (payload) => {
                    console.log('🚨 NEW SOS EVENT (DB) RECEIVED 🚨', payload);
                    setSosEvent(payload.new as SOSEvent);
                    playAlertSound();
                }
            )
            .on(
                'broadcast',
                { event: 'sos' },
                (payload) => {
                    console.log('🚨 NEW SOS EVENT (BROADCAST) RECEIVED 🚨', payload);
                    setSosEvent(payload.payload as SOSEvent);
                    playAlertSound();
                }
            )
            .subscribe((status) => {
                console.log('SOS Subscription Status:', status);
            });

        // POLLING FALLBACK: Query DB every 5 seconds in case Realtime fails
        const pollInterval = setInterval(async () => {
            // @ts-ignore - Table manually created
            const { data, error } = await supabase
                .from('sos_events')
                .select('*')
                .eq('status', 'active')
                .gt('created_at', new Date(Date.now() - 1000 * 60).toISOString()) // Only last 1 minute
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                // Determine if we already saw this event (simple dedupe)
                setSosEvent(prev => {
                    const newEvent = data[0] as unknown as SOSEvent;
                    if (prev && prev.id === newEvent.id) return prev;

                    console.log('🚨 NEW SOS EVENT (POLLING) RECEIVED 🚨', newEvent);
                    playAlertSound();
                    return newEvent;
                });
            }
        }, 5000);

        return () => {
            console.log('SOS System: Unsubscribing');
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [user, role]);

    const handleResolve = async () => {
        if (!sosEvent) return;

        try {
            // @ts-ignore - Table exists in migration but types need generation
            const { error } = await supabase
                .from('sos_events')
                .update({ status: 'resolved' })
                .eq('id', sosEvent.id);

            if (error) throw error;

            toast({
                title: "SOS Resolved",
                description: "The emergency alert has been marked as handled.",
            });
            setSosEvent(null);
        } catch (error) {
            console.error('Error resolving SOS:', error);
            toast({
                title: "Error",
                description: "Failed to mark as resolved.",
                variant: "destructive",
            });
        }
    };

    const openMap = () => {
        if (!sosEvent) return;
        window.open(`https://www.google.com/maps?q=${sosEvent.latitude},${sosEvent.longitude}`, '_blank');
    };

    if (!sosEvent) return null;

    return (
        <Dialog open={!!sosEvent} onOpenChange={(open) => !open && setSosEvent(null)}>
            <DialogContent className="border-4 border-red-500 sm:max-w-md animate-pulse-slow bg-background">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8" />
                        EMERGENCY ALERT
                    </DialogTitle>
                    <DialogDescription className="text-lg font-medium text-foreground mt-2">
                        Patient SOS Triggered
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="font-semibold text-muted-foreground">Patient:</div>
                        <div className="col-span-2 font-bold text-lg">{sosEvent.user_name}</div>

                        <div className="font-semibold text-muted-foreground">Time:</div>
                        <div className="col-span-2 font-mono">
                            {new Date(sosEvent.created_at).toLocaleTimeString()}
                        </div>

                        <div className="font-semibold text-muted-foreground">Type:</div>
                        <div className="col-span-2 capitalize badge badge-outline">{sosEvent.emergency_type}</div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={openMap}
                    >
                        <MapPin className="mr-2 h-4 w-4" />
                        Locate User
                    </Button>
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleResolve}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Resolved
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
