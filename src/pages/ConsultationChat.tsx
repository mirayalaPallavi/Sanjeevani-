import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, ArrowLeft, Loader2, User, Stethoscope, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function ConsultationChat() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { consultation, messages, isLoading, error, sendMessage } = useChat(id);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if ((!consultation && !isLoading) || error) {
        return (
            <Layout>
                <div className="container py-12 text-center max-w-md mx-auto">
                    <div className="bg-destructive/10 p-6 rounded-2xl border-2 border-destructive/20 mb-6">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-destructive mb-2">
                            {error ? t('chat.chat_error') : t('chat.consultation_not_found')}
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            {error || t('chat.consultation_not_found_desc')}
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => window.location.reload()} variant="outline">
                                {t('chat.try_again')}
                            </Button>
                            <Button onClick={() => navigate(-1)} variant="ghost">
                                <ArrowLeft className="mr-2 h-4 w-4" /> {t('chat.go_back')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-6 max-w-4xl mx-auto h-[calc(100vh-8rem)]">
                <Card className="h-full flex flex-col shadow-xl border-2">
                    <CardHeader className="border-b bg-muted/30 py-4 px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Stethoscope className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">
                                            {t('chat.consultation_session')}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {t('chat.active_consultation')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground italic">{t('chat.no_messages')}</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.sender_id === user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isOwn
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-muted text-foreground rounded-tl-none border'
                                                        }`}
                                                >
                                                    <p className="text-[15px] leading-relaxed">{msg.message}</p>
                                                    <p
                                                        className={`text-[10px] mt-1 opacity-70 ${isOwn ? 'text-right' : 'text-left'
                                                            }`}
                                                    >
                                                        {format(new Date(msg.created_at), 'h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-muted/20">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    placeholder={t('chat.type_message')}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 border-2 focus-visible:ring-primary"
                                    disabled={isSending}
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className="shadow-lg">
                                    {isSending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
