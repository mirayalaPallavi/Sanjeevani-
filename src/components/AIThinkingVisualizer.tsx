import { useEffect, useState } from 'react';
import { Brain, Sparkles, Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIThinkingVisualizerProps {
  isThinking: boolean;
  symptoms?: string[];
}

const thinkingSteps = [
  { icon: Search, text: "Analyzing symptoms...", delay: 0 },
  { icon: Brain, text: "Processing medical knowledge...", delay: 1500 },
  { icon: Activity, text: "Evaluating urgency levels...", delay: 3000 },
  { icon: Sparkles, text: "Generating recommendations...", delay: 4500 },
];

export function AIThinkingVisualizer({ isThinking, symptoms = [] }: AIThinkingVisualizerProps) {
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
