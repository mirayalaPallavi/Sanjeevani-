import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  AlertTriangle,
  Phone,
  History,
  Mic,
  MicOff,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useChatHistory, ChatMessage } from '@/hooks/useChatHistory';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import {
  chatMessageSchema,
  detectEmergency,
  getSeverityFromText,
} from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';
import { FeedbackModal } from '@/components/FeedbackModal';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const severityBadges: Record<string, { color: string; icon: string }> = {
  low: { color: 'bg-success/10 text-success border-success/20', icon: '🟢' },
  medium: { color: 'bg-warning/10 text-warning border-warning/20', icon: '🟠' },
  high: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: '🔴' },
  emergency: { color: 'bg-emergency text-emergency-foreground', icon: '🚨' },
};

export function AIChatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    addMessage,
    updateSeverity,
  } = useChatHistory();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your health assistant. I can help you with general health questions, navigate the app, or guide you to the right resources. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [severity, setSeverity] = useState<string>('low');
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Speech recognition
  const {
    transcript,
    isListening,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load session messages when switching
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find((s) => s.id === currentSessionId);
      if (session && session.messages.length > 0) {
        setMessages(session.messages);
        setSeverity(session.severity);
      }
    }
  }, [currentSessionId, sessions]);

  const startNewSession = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your health assistant. How can I help you today?",
        },
      ]);
      setSeverity('low');
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !isOnline) return;

    // Validate input
    const validation = chatMessageSchema.safeParse(input);
    if (!validation.success) {
      toast({
        title: 'Invalid message',
        description: validation.error.errors[0]?.message,
        variant: 'destructive',
      });
      return;
    }

    const sanitizedInput = validation.data;

    // Check for emergency
    if (detectEmergency(sanitizedInput)) {
      setSeverity('emergency');
      toast({
        title: '🚨 Emergency Detected',
        description: 'If this is a medical emergency, please call emergency services immediately.',
        variant: 'destructive',
      });
      if (currentSessionId) updateSeverity(currentSessionId, 'emergency');
    } else {
      const newSeverity = getSeverityFromText(sanitizedInput);
      if (
        ['high', 'emergency'].includes(newSeverity) ||
        (['medium'].includes(newSeverity) && severity === 'low')
      ) {
        setSeverity(newSeverity);
        if (currentSessionId) updateSeverity(currentSessionId, newSeverity);
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: sanitizedInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create session if needed
    if (!currentSessionId && user) {
      await createSession();
    }

    let assistantContent = '';
    abortControllerRef.current = new AbortController();

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (resp.status === 402) {
          throw new Error('Service temporarily unavailable.');
        }
        throw new Error('Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantContent };
                return newMsgs;
              });
            }
          } catch {
            // Incomplete JSON
          }
        }
      }

      // Save to history
      if (currentSessionId) {
        await addMessage(currentSessionId, userMsg);
        await addMessage(currentSessionId, { role: 'assistant', content: assistantContent });
      }

      setRetryCount(0);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;

      console.error('Chat error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to process your request.';

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: `I'm sorry, ${errorMessage} Please try again.`,
        },
      ]);

      // Auto-retry logic
      if (retryCount < 2) {
        setRetryCount((prev) => prev + 1);
        toast({
          title: 'Connection issue',
          description: `Retrying... (${retryCount + 1}/3)`,
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    input,
    isLoading,
    isOnline,
    messages,
    currentSessionId,
    user,
    createSession,
    addMessage,
    updateSeverity,
    severity,
    retryCount,
    toast,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating Button with pulse animation */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 md:h-16 md:w-16 rounded-full z-50 transition-all duration-300',
          'gradient-primary shadow-xl hover:shadow-2xl hover:scale-110 border-0',
          'animate-pulse-glow',
          severity === 'emergency' && 'gradient-emergency',
          isOpen && 'scale-0 opacity-0'
        )}
        size="icon"
        aria-label="Open health assistant chat"
      >
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
      </Button>

      {/* Chat Window - Mobile responsive */}
      <div
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden transition-all duration-300',
          'bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl',
          // Mobile: full screen
          'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[560px] md:rounded-3xl',
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        )}
        role="dialog"
        aria-label="Health assistant chat"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">Health Assistant</span>
            {severity !== 'low' && (
              <Badge className={cn('text-xs', severityBadges[severity]?.color)}>
                {severityBadges[severity]?.icon} {severity}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isOnline && (
              <Badge variant="destructive" className="text-xs mr-2">
                <WifiOff className="h-3 w-3 mr-1" /> Offline
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="View chat history"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emergency Banner */}
        {severity === 'emergency' && (
          <div className="bg-emergency text-emergency-foreground p-3 flex items-center gap-2 animate-pulse">
            <Phone className="h-5 w-5" />
            <span className="text-sm font-medium">
              Emergency detected! Call 911 or your local emergency number.
            </span>
          </div>
        )}

        {showHistory ? (
          // History View
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              <Button onClick={startNewSession} className="w-full mb-4">
                Start New Chat
              </Button>
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No chat history</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={cn('text-xs', severityBadges[session.severity]?.color)}>
                        {severityBadges[session.severity]?.icon} {session.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.messages[session.messages.length - 1]?.content.slice(0, 50)}...
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          // Messages View
          <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
            <div className="space-y-3 md:space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {msg.content || (
                      <span className="inline-flex items-center gap-1">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse animation-delay-200">●</span>
                        <span className="animate-pulse animation-delay-400">●</span>
                      </span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <div className="p-3 md:p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isListening) {
                stopListening();
              }
              sendMessage();
            }}
            className="flex gap-2"
          >
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                variant={isListening ? 'destructive' : 'outline'}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    resetTranscript();
                    startListening();
                  }
                }}
                disabled={!isOnline}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                className={cn(isListening && 'animate-pulse')}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? 'Listening...' : isOnline ? 'Ask me anything...' : 'Offline - check connection'}
              disabled={isLoading || !isOnline}
              className="flex-1"
              maxLength={2000}
              aria-label="Type your message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim() || !isOnline}
              aria-label="Send message"
              className="gradient-primary border-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {isListening ? '🎤 Voice input active' : `${input.length}/2000`}
            </p>
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="text-xs text-primary hover:underline"
            >
              Send Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        consultationType="chat"
        sessionId={currentSessionId || undefined}
      />
    </>
  );
}
