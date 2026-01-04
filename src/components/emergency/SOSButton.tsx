import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Loader2, MapPin } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

interface SOSButtonProps {
    variant?: 'floating' | 'header';
    className?: string;
}

export function SOSButton({ variant = 'floating', className }: SOSButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { user, role } = useAuth();
    const { toast } = useToast();

    if (role === 'doctor') return null;

    const triggerSOS = async () => {
        // ... (Keep existing triggerSOS logic exactly as is)
        setIsLoading(true);

        if (!navigator.geolocation) {
            toast({
                title: "Error",
                description: "Geolocation is not supported by your browser",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Direct DB Insert (More reliable for local dev than Edge Functions)
                    // @ts-ignore - Table exists in migration but types need generation
                    const { error } = await supabase
                        .from('sos_events')
                        .insert({
                            user_id: user.id,
                            user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
                            latitude,
                            longitude,
                            emergency_type: 'Medical Emergency',
                            status: 'active'
                        });

                    if (error) throw error;

                    // Send Realtime Broadcast (Fallback for DB events)
                    const channel = supabase.channel('sos_alerts');
                    channel.subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            channel.send({
                                type: 'broadcast',
                                event: 'sos',
                                payload: {
                                    id: crypto.randomUUID(), // Temp ID
                                    user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
                                    latitude,
                                    longitude,
                                    emergency_type: 'Medical Emergency',
                                    created_at: new Date().toISOString()
                                }
                            });
                        }
                    });

                    toast({
                        title: "SOS Signal Sent",
                        description: "Doctors have been alerted with your location. Help is on the way.",
                        className: "bg-red-600 text-white border-none",
                    });

                } catch (error: any) {
                    console.error('SOS Error:', error);
                    toast({
                        title: "Failed to send SOS",
                        description: error.message || error.details || "Database connection error. Please try again.",
                        variant: "destructive",
                        duration: 5000,
                    });
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                setIsLoading(false);
                toast({
                    title: "Location Access Denied",
                    description: "We need your location to send help. Please enable GPS.",
                    variant: "destructive",
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const isFloating = variant === 'floating';

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size={isFloating ? "icon" : "default"}
                    className={className || (isFloating
                        ? "fixed bottom-2 left-2 md:bottom-4 md:left-4 z-50 h-14 w-14 md:h-16 md:w-16 rounded-full shadow-2xl animate-pulse hover:animate-none bg-red-600 hover:bg-red-700 border-4 border-white/20"
                        : "h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse shadow-lg hover:shadow-red-500/50 transition-all rounded-full"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className={`${isFloating ? "h-6 w-6 md:h-8 md:w-8" : "h-4 w-4 mr-2"} animate-spin`} />
                    ) : (
                        isFloating ? (
                            <div className="flex flex-col items-center justify-center">
                                <AlertCircle className="h-5 w-5 md:h-6 md:w-6" />
                                <span className="text-[8px] md:text-[10px] font-bold mt-0.5">SOS</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>SOS</span>
                            </div>
                        )
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-red-500 border-2">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Confirm Emergency
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will immediately alert nearby doctors and your emergency contacts with your current GPS location.
                        <br /><br />
                        <strong>Use only in case of genuine medical emergency.</strong>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={triggerSOS}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        {isLoading ? "Sending..." : "YES, SEND HELP"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
