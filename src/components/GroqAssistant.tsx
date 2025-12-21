import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, X, Send, Loader2, Bot, User, Heart, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_URL, getGroqHeaders, groqEnabled } from '@/config/groq';
import { useTranslation } from 'react-i18next';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export function GroqAssistant() {
  const { t } = useTranslation();
  const { toast } = useToast();
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
    const base = `You are a healthcare assistant that provides general guidance about symptoms, precautions, and when to seek medical care.\n- Do not diagnose.\n- Encourage contacting professionals for serious concerns.\n- Provide practical, concise, safe steps.\n- If symptoms sound like an emergency, advise calling local emergency services immediately.`;
    if (!emotional) return base + `\nTone: professional, calm, supportive.`;
    return base + `\nTone: empathetic, warm, human-like. Use gentle, caring language and acknowledge feelings while remaining safe and responsible.`;
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
        throw new Error(`Groq error ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      const reply: string = data?.choices?.[0]?.message?.content ?? t('assistant.no_response');

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I’m sorry, something went wrong: ${msg}` },
      ]);
      toast({ title: 'Assistant error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setShowTyping(false);
    }
  }

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
        <div className="flex flex-col p-4 border-b border-white/10 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight">{t('assistant.title')}</span>
                <span className="text-xs opacity-80 font-medium">{t('assistant.subtitle')}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
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
        <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-black/5" ref={scrollRef}>
          <div className="space-y-4 pb-2">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3 animate-fade-in group', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/10 shadow-sm mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:shadow-md',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-bl-sm'
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-600 mt-1">
                    <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                  </div>
                )}
              </div>
            ))}

            {showTyping && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/10 shadow-sm mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-0" />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-150" />
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border-t border-white/20">
          <div className="flex overflow-x-auto gap-2 mb-3 pb-1 no-scrollbar mask-gradient-x">
            {suggestions.map((s, idx) => (
              <Button
                key={idx}
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full text-xs h-7 px-3 flex-shrink-0 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border-transparent hover:border-primary/20 transition-all shadow-sm"
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
            className="relative flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={groqEnabled() ? (emotional ? t('assistant.placeholder_emotional') : t('assistant.placeholder_medical')) : t('assistant.placeholder_no_api')}
              disabled={isLoading || !groqEnabled()}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-4 h-10 placeholder:text-muted-foreground/50"
              maxLength={2000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim() || !groqEnabled()}
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-300",
                !input.trim() ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600" : "gradient-primary shadow-md hover:shadow-lg hover:scale-105"
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
