import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, X, Send, Loader2, Bot, User, Heart, Sparkles, ChevronDown, FileText } from 'lucide-react';
import { AIThinkingVisualizer } from './AIThinkingVisualizer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_URL, getGroqHeaders, groqEnabled } from '@/config/groq';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export function GroqAssistant() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'assistant',
    content: t('assistant.greeting'),
  }]);
  const [emotional, setEmotional] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTyping, setShowTyping] = useState(false);

  const suggestions = [
    t('assistant.suggestions.sore_throat'),
    t('assistant.suggestions.fever'),
    t('assistant.suggestions.stomach_pain'),
    t('assistant.suggestions.anxiety'),
  ];

  useEffect(() => {
    if (!groqEnabled()) {
      toast({
        title: t('assistant.api_key_missing_title'),
        description: t('assistant.api_key_missing_desc'),
        variant: 'destructive',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, showTyping]);

  const systemPrompt = useMemo(() => {
    const base = `You are "Sanjeevani", a warm, empathetic, and premium health companion inspired by August AI.

GUIDELINES:
1. **Tone**: Warm, supportive, and acknowledging. Use emojis and premium markdown formatting.
2. **Role**: Act as a health coach and empathetic listener. Provide general wellness insights and help users navigate their health journey.
3. **Safety**: Never provide a diagnosis or medical prescription. If someone is in pain or distressed, acknowledge their feelings first.
4. **Knowledge**: Use your general medical knowledge to explain health concepts simply.`;

    if (!emotional) return base + `\nTone: Supportive, clear, professional yet friendly.`;
    return base + `\nTone: Empathetic, very warm. Reflect feelings before giving helpful info.`;
  }, [emotional]);

  async function send() {
    const content = input.trim();
    if (!content || isLoading) return;
    setInput('');

    const userMsg: ChatMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setShowTyping(true);

    try {
      if (!groqEnabled()) {
        throw new Error('Groq API key is not set');
      }

      const payload = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          userMsg,
        ],
        temperature: emotional ? 0.9 : 0.5,
        max_tokens: 400,
        stream: false,
      } as const;

      const resp = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: getGroqHeaders(),
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Groq error ${resp.status}: ${text} `);
      }

      const data = await resp.json();
      const reply: string = data?.choices?.[0]?.message?.content ?? t('assistant.no_response');

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I’m sorry, something went wrong: ${msg} ` },
      ]);
      toast({ title: 'Assistant error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  }

  if (role === 'doctor') return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 md:h-16 md:w-16 rounded-full z-50 transition-all duration-300',
          'gradient-primary shadow-xl hover:shadow-2xl hover:scale-110 border-0',
          'animate-pulse-glow',
          isOpen && 'scale-0 opacity-0'
        )}
        size="icon"
        aria-label={t('assistant.open_assistant')}
      >
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
      </Button>

      <div
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden transition-all duration-500 ease-in-out',
          'bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl',
          'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[600px] md:rounded-3xl',
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-20 pointer-events-none'
        )}
        role="dialog"
        aria-label="Groq assistant chat"
      >
        {/* Header */}
        <div className="flex flex-col p-5 border-b border-white/10 bg-gradient-to-br from-emerald-600 via-teal-600 to-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl animate-pulse" />

          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xl border border-white/30 group">
                <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">Sanjeevani</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest opacity-90 font-black">Live & Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
              aria-label={t('assistant.close_chat')}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative z-10 flex items-center justify-between bg-white/10 rounded-xl p-2.5 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-full transition-colors", emotional ? "bg-rose-500/20 text-rose-200" : "bg-blue-500/20 text-blue-200")}>
                {emotional ? <Heart className="h-3.5 w-3.5 fill-rose-400" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
              <span className="text-xs font-medium">{t('assistant.emotional_support')}</span>
            </div>
            <Switch
              checked={emotional}
              onCheckedChange={setEmotional}
              className="data-[state=checked]:bg-rose-400 data-[state=unchecked]:bg-slate-400"
            />
          </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 px-4 py-6 bg-gradient-to-b from-transparent to-black/5" ref={scrollRef}>
          <div className="space-y-6 pb-8">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3 animate-fade-in group', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-lg mt-1 group-hover:scale-110 transition-transform">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[88%] rounded-[24px] px-5 py-4 text-[14.5px] shadow-sm transition-all duration-300 hover:shadow-xl relative',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none border border-white/10'
                      : 'bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-800/50 rounded-tl-sm text-foreground/90 font-medium'
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-600 mt-1 shadow-sm">
                    <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AIThinkingVisualizer isThinking={true} compact={true} />
              </div>
            )}

            {showTyping && !isLoading && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-lg mt-1 group-hover:scale-110 transition-transform">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white dark:bg-zinc-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[24px] rounded-tl-sm px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-0" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-150" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-5 bg-white/70 dark:bg-black/40 backdrop-blur-3xl border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex overflow-x-auto gap-2.5 mb-4 pb-1 no-scrollbar mask-gradient-x scroll-smooth">
            {suggestions.map((s, idx) => (
              <Button
                key={idx}
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full text-[11px] font-bold h-8 px-4 flex-shrink-0 bg-white/95 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-emerald-100 dark:border-zinc-700 hover:border-emerald-300 transition-all shadow-sm text-foreground"
                onClick={() => setInput(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="relative flex items-center gap-3 bg-white dark:bg-zinc-950 p-2 rounded-3xl border-2 border-emerald-50 dark:border-emerald-900/20 shadow-xl focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={groqEnabled() ? (emotional ? "Share your feelings..." : "Message Sanjeevani...") : t('assistant.placeholder_no_api')}
              disabled={isLoading || !groqEnabled()}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-4 h-11 text-[15px] placeholder:text-muted-foreground/30 font-medium"
              maxLength={2000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim() || !groqEnabled()}
              className={cn(
                "h-10 w-10 rounded-2xl transition-all duration-500",
                !input.trim() ? "bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700" : "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-110 active:scale-95 border-0"
              )}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
