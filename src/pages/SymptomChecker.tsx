import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { useTriageHistory } from '@/hooks/useTriageHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  Plus,
  X,
  Stethoscope,
  Phone,
  Clock,
  CheckCircle,
  History,
  Brain,
  WifiOff,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AIThinkingVisualizer } from '@/components/AIThinkingVisualizer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GROQ_API_URL, getSymptomGroqHeaders, groqSymptomEnabled } from '@/config/groq';
import { TriageResponse, UrgencyLevel } from '@/types/database';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CallbackScheduler } from '@/components/CallbackScheduler';
import { offlineSymptoms } from '@/data/offlineSymptoms';


const commonSymptomKeys = [
  'headache',
  'fever',
  'cough',
  'fatigue',
  'nausea',
  'sore_throat',
  'body_aches',
  'dizziness',
  'chest_pain',
  'shortness_of_breath',
  'abdominal_pain',
  'back_pain',
];

const urgencyColors: Record<UrgencyLevel, string> = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  emergency: 'bg-emergency text-emergency-foreground',
};

const urgencyIcons: Record<UrgencyLevel, typeof CheckCircle> = {
  low: CheckCircle,
  medium: Clock,
  high: AlertTriangle,
  emergency: Phone,
};

export default function SymptomChecker() {
  const { t } = useTranslation();
  const { history, saveTriage } = useTriageHistory();
  const { toast } = useToast();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const addSymptom = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      addSymptom(customSymptom.trim());
      setCustomSymptom('');
    }
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast({
        title: t('symptom.no_symptoms_selected', { defaultValue: 'No symptoms selected' }),
        description: t('symptom.select_at_least_one', { defaultValue: 'Please select at least one symptom to analyze.' }),
        variant: 'destructive',
      });
      return;
    }

    if (!groqSymptomEnabled()) {
      toast({
        title: t('symptom.api_config_missing_title'),
        description: t('symptom.api_config_missing_desc'),
        variant: 'destructive',
      });
      setResult(null);
    }

    const runOfflineAnalysis = () => {
      const lowerSymptoms = selectedSymptoms.map(s => s.toLowerCase());
      const lowerDesc = description.toLowerCase();

      // Find matches in dataset
      let bestMatch = null;
      let maxScore = 0;

      for (const item of offlineSymptoms) {
        let score = 0;
        for (const kw of item.keywords) {
          if (lowerSymptoms.some(s => s.includes(kw)) || lowerDesc.includes(kw)) {
            score++;
          }
        }
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item.response;
        }
      }

      const fallbackResponse: TriageResponse = bestMatch || {
        urgency: 'medium',
        confidence: 50,
        predicted_conditions: ['Undetermined (Offline Analysis)'],
        recommended_specialization: 'General Physician',
        advice: 'We are unable to perform a full AI analysis offline. Based on your inputs, please consult a general physician for a proper evaluation.',
        warning_signs: ['Worsening symptoms', 'New unexplained symptoms'],
        self_care_tips: ['Rest', 'Hydration', 'Monitor symptoms']
      };

      // Force warnings for specific high-risk keywords even if not best match
      const emergencyKeywords = ['chest pain', 'unable to breathe', 'unconscious', 'stroke', 'heart attack'];
      if (lowerSymptoms.some(s => emergencyKeywords.some(ek => s.includes(ek)))) {
        fallbackResponse.urgency = 'emergency';
        fallbackResponse.advice += ' POTENTIAL EMERGENCY DETECTED.';
      }

      return fallbackResponse;
    };

    const systemPrompt = `You are an expert AI medical triage assistant. Analyze the following symptoms and patient description.
    
    Output MUST be valid JSON strictly matching this structure:
    {
      "urgency": "low" | "medium" | "high" | "emergency",
      "confidence": number, // 0-100
      "predicted_conditions": string[],
      "recommended_specialization": string,
      "advice": string,
      "warning_signs": string[],
      "self_care_tips": string[], // Include specific home remedies here
      "follow_up_questions": string[],
      "reasoning": string
    }

    Guidelines:
    - "urgency": "emergency" if life-threatening (chest pain, severe breathlessness, stroke signs).
    - "self-care_tips": Provide actionable HOME REMEDIES and lifestyle changes.
    - "confidence": Estimate based on symptom specificity.
    - "advice": Clear, concise next steps.
    - Do not output markdown, only raw JSON.`;

    const userContent = `Symptoms: ${selectedSymptoms.join(', ')}\nAdditional Description: ${description || 'None provided'}`;

    try {
      const isOnline = navigator.onLine;
      if (!isOnline || !groqSymptomEnabled()) {
        console.log('Running offline analysis...');
        const offlineResult = runOfflineAnalysis();
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResult(offlineResult);
        toast({
          title: isOnline ? t('symptom.offline_analysis_title') : t('symptom.you_are_offline_title'),
          description: isOnline ? t('symptom.offline_analysis_desc') : t('symptom.you_are_offline_desc'),
          variant: 'default',
        });
        return;
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: getSymptomGroqHeaders(),
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) throw new Error('No content in response');

      const triageResult: TriageResponse = JSON.parse(content);
      setResult(triageResult);

      // Save to history (optional, keeping local state mostly but can attempt to save if Supabase is still used for history)
      try {
        await saveTriage(selectedSymptoms, description, triageResult);
      } catch (err) {
        console.warn('Failed to save history:', err);
        // Don't block UI if history save fails
      }

      if (triageResult.urgency === 'emergency') {
        toast({
          title: `⚠️ ${t('symptom.emergency_alert')}`,
          description: t('symptom.emergency_desc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Triage error:', error);

      // Fallback on error too
      const offlineResult = runOfflineAnalysis();
      setResult(offlineResult);

      toast({
        title: t('symptom.network_issue_title'),
        description: t('chat.chat_error'),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setDescription('');
    setResult(null);
  };

  const UrgencyIcon = result ? urgencyIcons[result.urgency] : CheckCircle;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              {t('symptom.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('symptom.description')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-2" />
            {t('symptom.history')}
          </Button>
        </div>

        {showHistory ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('symptom.history_title')}</CardTitle>
              <CardDescription>{t('symptom.history_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('symptom.no_history')}
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={urgencyColors[item.urgency]}>
                          {item.urgency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm mb-2">
                        <strong>{t('symptom.selected_symptoms')}:</strong> {item.symptoms.join(', ')}
                      </p>
                      {item.predicted_conditions && (
                        <p className="text-sm text-muted-foreground">
                          <strong>{t('symptom.conditions_label')}:</strong>{' '}
                          {item.predicted_conditions.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : result ? (
          // Results View
          <div className="space-y-6 animate-fade-in">
            {/* Urgency Card */}
            <Card className={`border-2 ${result.urgency === 'emergency' ? 'border-emergency animate-pulse' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-full ${urgencyColors[result.urgency]}`}>
                    <UrgencyIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold capitalize">
                        {result.urgency} {t('symptom.urgency')}
                      </h2>
                      {result.confidence !== undefined && (
                        <Badge variant="outline" className="text-sm">
                          {result.confidence}% {t('dashboard.confidence')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{result.advice}</p>
                    {result.reasoning && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        <Brain className="h-3 w-3 inline mr-1" />
                        {result.reasoning}
                      </p>
                    )}
                  </div>
                </div>

                {result.urgency === 'emergency' && (
                  <div className="mt-4 p-4 bg-emergency/10 rounded-lg border border-emergency/20">
                    <div className="flex items-center gap-2 text-emergency font-semibold">
                      <Phone className="h-5 w-5" />
                      {t('symptom.call_emergency')}
                    </div>
                    <p className="text-sm mt-1">
                      {t('symptom.emergency_desc')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confidence Bar */}
            {result.confidence !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('symptom.confidence')}</span>
                    <span className="text-sm text-muted-foreground">{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        result.confidence >= 80 ? "bg-success" :
                          result.confidence >= 60 ? "bg-warning" : "bg-destructive"
                      )}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.confidence >= 80 ? t('symptom.confidence_high') :
                      result.confidence >= 60 ? t('symptom.confidence_moderate') :
                        t('symptom.confidence_low')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Follow-up Questions */}
            {result.follow_up_questions && result.follow_up_questions.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    {t('symptom.additional_questions')}
                  </CardTitle>
                  <CardDescription>
                    {t('symptom.improve_accuracy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.follow_up_questions.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary font-medium">{idx + 1}.</span>
                        <span className="text-sm">{question}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Possible Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('symptom.possible_conditions')}</CardTitle>
                <CardDescription>
                  {t('symptom.not_diagnoses')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.predicted_conditions.map((condition) => (
                    <Badge key={condition} variant="secondary" className="text-sm">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Specialist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  {t('symptom.recommended_specialist')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{result.recommended_specialization}</p>
                <Button asChild className="mt-4">
                  <Link to={`/doctors?specialization=${encodeURIComponent(result.recommended_specialization)}`}>
                    {t('symptom.find_doctors')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Warning Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('symptom.warning_signs')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {result.warning_signs.map((sign) => (
                    <li key={sign} className="text-sm">{sign}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Self Care Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-success flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {t('symptom.self_care')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {result.self_care_tips.map((tip) => (
                    <li key={tip} className="text-sm">{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                {t('symptom.start_new')}
              </Button>
              <Button asChild className="flex-1 gradient-primary border-0">
                <Link to="/doctors">{t('common.book_appointment')}</Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <CallbackScheduler />
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t('symptom.disclaimer')}
            </p>
          </div>
        ) : (
          // Input Form
          <div className="space-y-6">
            {/* Selected Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>{t('symptom.selected_symptoms')}</CardTitle>
                <CardDescription>
                  {t('symptom.selected_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSymptoms.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t('dashboard.no_symptoms_selected')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="default"
                        className="pr-1 cursor-pointer"
                      >
                        {symptom}
                        <button
                          onClick={() => removeSymptom(symptom)}
                          className="ml-1 p-0.5 hover:bg-primary-foreground/20 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Common Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>{t('symptom.common_symptoms')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {commonSymptomKeys.map((key) => {
                    const symptom = t(`symptom.common_symptoms_list.${key}`);
                    return (
                      <Badge
                        key={key}
                        variant={
                          selectedSymptoms.includes(symptom)
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          selectedSymptoms.includes(symptom)
                            ? removeSymptom(symptom)
                            : addSymptom(symptom)
                        }
                      >
                        {symptom}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Custom Symptom */}
            <Card>
              <CardHeader>
                <CardTitle>{t('symptom.add_custom')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('symptom.type_symptom')}
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                  />
                  <Button onClick={addCustomSymptom} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t('symptom.additional_details')}</CardTitle>
                <CardDescription>
                  {t('symptom.details_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={t('symptom.details_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            {isAnalyzing ? (
              <AIThinkingVisualizer isThinking={true} symptoms={selectedSymptoms} />
            ) : (
              <Button
                onClick={analyzeSymptoms}
                disabled={selectedSymptoms.length === 0}
                className="w-full h-12 text-lg"
              >
                <Brain className="h-5 w-5 mr-2" />
                {t('symptom.analyze_with_ai')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
