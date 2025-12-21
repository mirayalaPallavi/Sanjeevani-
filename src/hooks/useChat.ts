import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, Consultation } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export function useChat(appointmentId: string | undefined) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!appointmentId) return;

        let channel: any;

        const setupChat = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Fetch consultation by appointment_id
                let { data: consult, error: consultError } = await supabase
                    .from('consultations')
                    .select(`
                        *,
                        appointment:appointments(
                            patient_id,
                            doctor_id,
                            reason
                        )
                    `)
                    .eq('appointment_id', appointmentId)
                    .maybeSingle();

                if (consultError) throw consultError;

                if (!consult) {
                    console.log('Consultation not found, attempting to create for appointment:', appointmentId);
                    const { data: newConsult, error: createError } = await supabase
                        .from('consultations')
                        .insert([{ appointment_id: appointmentId }])
                        .select(`
                            *,
                            appointment:appointments(
                                patient_id,
                                doctor_id,
                                reason
                            )
                        `)
                        .maybeSingle();

                    if (createError) {
                        console.error('Error auto-creating consultation:', createError);
                        setError(`Failed to create consultation: ${createError.message}`);
                        setConsultation(null);
                        return;
                    }

                    if (newConsult) {
                        setConsultation(newConsult as any);
                        consult = newConsult;
                    } else {
                        setError('Unable to create consultation record.');
                        setConsultation(null);
                        return;
                    }
                } else {
                    setConsultation(consult as any);
                }

                // If we now have a consult
                if (consult) {
                    // 2. Fetch messages
                    const { data: msgs, error: msgsError } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('consultation_id', consult.id)
                        .order('created_at', { ascending: true });

                    if (msgsError) throw msgsError;
                    setMessages(msgs || []);

                    // 3. Subscribe
                    channel = supabase
                        .channel(`chat:${consult.id}`)
                        .on(
                            'postgres_changes',
                            {
                                event: 'INSERT',
                                schema: 'public',
                                table: 'chat_messages',
                                filter: `consultation_id=eq.${consult.id}`,
                            },
                            (payload) => {
                                const newMessage = payload.new as ChatMessage;
                                setMessages((prev) => {
                                    // 1. If we already have this exact ID, ignore it
                                    if (prev.some(m => m.id === newMessage.id)) return prev;

                                    // 2. Check if this is a real version of one of our optimistic messages
                                    // Look for a message from the same sender, with same content, that starts with 'opt-'
                                    const optimisticIndex = prev.findIndex(m =>
                                        m.id.startsWith('opt-') &&
                                        m.sender_id === newMessage.sender_id &&
                                        m.message === newMessage.message
                                    );

                                    if (optimisticIndex !== -1) {
                                        // Replace the optimistic message with the real one
                                        const newMsgs = [...prev];
                                        newMsgs[optimisticIndex] = newMessage;
                                        return newMsgs;
                                    }

                                    // 3. Otherwise, it's just a new message
                                    return [...prev, newMessage];
                                });
                            }
                        )
                        .subscribe();
                }

            } catch (err: any) {
                console.error('Chat setup error:', err);
                setError(err.message || 'An unexpected error occurred setting up the chat.');
            } finally {
                setIsLoading(false);
            }
        };

        setupChat();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [appointmentId]);

    const sendMessage = async (text: string) => {
        if (!user || !consultation) return;

        // Optimistic update: Add locally first for instant feedback.
        // We prefix the ID with 'opt-' so the subscription listener knows it can be replaced.
        const tempId = `opt-${gen_random_uuid()}`;
        const optimisticMsg: ChatMessage = {
            id: tempId,
            consultation_id: consultation.id,
            sender_id: user.id,
            message: text,
            created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                consultation_id: consultation.id,
                sender_id: user.id,
                message: text,
            });

        if (error) {
            // Remove optimistic message on failure
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            throw error;
        }

        // The subscription will handle the update correctly now by matching sender/message.
    };

    return { consultation, messages, isLoading, error, sendMessage };
}

function gen_random_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
