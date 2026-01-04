import { useEffect, useState } from 'react';
import { Brain, Sparkles, Search, Activity, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIThinkingVisualizerProps {
  isThinking: boolean;
  symptoms?: string[];
  compact?: boolean;
}

const thinkingSteps = [
  { icon: Search, text: "Scanning medical database...", delay: 0 },
  { icon: Brain, text: "Cross-referencing biomarkers...", delay: 1500 },
  { icon: Activity, text: "Synthesizing health insights...", delay: 3000 },
  { icon: Sparkles, text: "Finalizing recommendation...", delay: 4500 },
];

export function AIThinkingVisualizer({ isThinking, symptoms = [], compact = false }: AIThinkingVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedSymptoms, setDisplayedSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (!isThinking) {
      setCurrentStep(0);
      setDisplayedSymptoms([]);
      return;
    }

    // Animate symptoms appearing
    symptoms.forEach((_, index) => {
      setTimeout(() => {
        setDisplayedSymptoms(prev => [...symptoms.slice(0, index + 1)]);
      }, index * 200);
    });

    // Progress through thinking steps
    const intervals = thinkingSteps.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, step.delay);
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [isThinking, symptoms]);

  if (!isThinking) return null;

  if (compact) {
    return (
      <div className="p-3 rounded-2xl border border-primary/20 bg-primary/5 space-y-3 animate-fade-in mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse">
            <Brain className="h-3 w-3" />
          </div>
          <span className="text-xs font-bold text-primary animate-pulse">AI is thinking...</span>
        </div>

        <div className="space-y-2">
          {thinkingSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            if (!isActive && !isComplete) return null;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 transition-all duration-500",
                  isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center",
                  isComplete ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                )}>
                  {isComplete ? <CheckCircle className="h-3 w-3" /> : <step.icon className="h-2.5 w-2.5" />}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{step.text}</span>
                {isActive && (
                  <div className="flex gap-1 ml-auto">
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce delay-75" />
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce delay-150" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Symptom Analysis */}
      <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary animate-pulse" />
          AI is analyzing your symptoms
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {displayedSymptoms.map((symptom, i) => (
            <span
              key={symptom}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm animate-scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {symptom}
            </span>
          ))}
        </div>

        {/* Thinking Steps */}
        <div className="space-y-3">
          {thinkingSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 transition-all duration-500",
                  isActive && "scale-105",
                  !isActive && !isComplete && "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive && "bg-primary text-primary-foreground animate-pulse",
                    isComplete && "bg-success/20 text-success",
                    !isActive && !isComplete && "bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isActive && "text-foreground font-medium",
                    isComplete && "text-success",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                >
                  {step.text}
                </span>
                {isActive && (
                  <div className="flex gap-1 ml-auto">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Neural Network Animation */}
      <div className="relative h-24 rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full opacity-20" viewBox="0 0 400 100">
            {/* Neural network lines */}
            {[...Array(8)].map((_, i) => (
              <line
                key={`line-${i}`}
                x1={50 + (i % 4) * 80}
                y1={20 + Math.floor(i / 4) * 60}
                x2={130 + (i % 4) * 80}
                y2={50}
                stroke="currentColor"
                strokeWidth="1"
                className="animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
            {/* Nodes */}
            {[...Array(12)].map((_, i) => (
              <circle
                key={`node-${i}`}
                cx={50 + (i % 4) * 100}
                cy={20 + Math.floor(i / 4) * 30}
                r="4"
                fill="currentColor"
                className="animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-xs text-muted-foreground mt-1">Processing with Gemini AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
