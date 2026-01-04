import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
    Camera,
    Image as ImageIcon,
    Mic,
    MicOff,
    Activity,
    Shield,
    History,
    AlertCircle,
    CameraOff,
    RefreshCw,
    CheckCircle2,
    TrendingUp,
    ChevronRight,
    Info,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AIThinkingVisualizer } from '@/components/AIThinkingVisualizer';

interface AnalysisResult {
    label: string;
    confidence: number;
    severity: 'Mild' | 'Moderate' | 'Severe';
    description: string;
    advice: string[];
    next_steps: string[];
    medications?: string[];
    detected_part?: string;
    is_multi?: boolean;
    all_detected?: string[];
    annotations?: any[];
}

export default function VisualDiagnosis() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('visual_diagnosis_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const saveToHistory = (newResult: AnalysisResult, image: string) => {
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            image,
            result: newResult,
            notes: transcript
        };
        const updatedHistory = [entry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('visual_diagnosis_history', JSON.stringify(updatedHistory));
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            toast({
                title: t('visual.camera_unavailable'),
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive'
            });
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
                runAnalysis(dataUrl);
            }
        }
    };

    const startVoiceRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({
                title: "Voice recognition not supported in this browser",
                variant: "destructive"
            });
            return;
        }

        if (!isRecording) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.start();
            setIsRecording(true);
        } else {
            recognitionRef.current?.stop();
            setIsRecording(false);
        }
    };

    const runAnalysis = async (imageData: string) => {
        setIsAnalyzing(true);
        setResult(null);

        try {
            // Convert dataURL to blob
            const base64Data = imageData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', blob, 'capture.jpg');

            const response = await fetch('http://127.0.0.1:8000/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to analyze image');

            const data = await response.json();
            setResult(data);
            saveToHistory(data, imageData);

            toast({
                title: t('visual.analysis_complete', 'Analysis Complete'),
                description: t('visual.results_ready', 'Visual analysis results are ready.'),
            });
        } catch (err) {
            console.error('Analysis error:', err);
            toast({
                title: t('visual.analysis_failed', 'Analysis Failed'),
                description: t('visual.server_error', 'Could not connect to the offline engine. Ensure the server is running.'),
                variant: 'destructive'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setCapturedImage(dataUrl);
                runAnalysis(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'Mild': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Moderate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Severe': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const clearAnalysis = () => {
        setCapturedImage(null);
        setResult(null);
        setIsAnalyzing(false);
        setIsCameraActive(false);
        toast({
            title: "Analysis Cleared",
            description: "Ready for a new scan.",
        });
    };

    const clearHistory = () => {
        localStorage.removeItem('visual_diagnosis_history');
        setHistory([]);
        toast({
            title: "History Cleared",
            description: "All analysis records have been deleted.",
        });
    };

    return (
        <Layout>
            <div className="container max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-2xl">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            {t('visual.title', 'Visual Diagnosis')}
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            {t('visual.desc', 'Offline AI analysis for skin conditions and injuries')}
                        </p>
                    </div>

                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                        <Badge variant="outline" className="bg-background/50 border-none shadow-sm gap-1.5 px-3 py-1">
                            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Offline Engine Live</span>
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workspace */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden ring-1 ring-border/50">
                            <CardContent className="p-0">
                                <div className="relative aspect-video bg-black/5 flex items-center justify-center overflow-hidden">
                                    {isCameraActive ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : capturedImage ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={capturedImage}
                                                alt="Captured"
                                                className="w-full h-full object-contain"
                                            />
                                            {result?.annotations?.map((ann, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute border-2 border-primary/50 bg-primary/10 animate-pulse rounded-lg"
                                                    style={{
                                                        left: `${ann.x}%`,
                                                        top: `${ann.y}%`,
                                                        width: `${ann.w / 10}%`,
                                                        height: `${ann.h / 10}%`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-12 space-y-4">
                                            <div className="mx-auto w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                                                <ImageIcon className="h-10 w-10 text-primary/40" />
                                            </div>
                                            <div className="max-w-xs mx-auto">
                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    Upload a photo or use your camera to start the analysis
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50">
                                            <div className="text-center space-y-6 max-w-sm px-6">
                                                <AIThinkingVisualizer
                                                    isThinking={true}
                                                />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Neural Scan</p>
                                                    <Progress value={66} className="h-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-border/50 bg-muted/20 flex flex-wrap gap-4">
                                    {!isCameraActive ? (
                                        <>
                                            <Button
                                                size="lg"
                                                className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                                onClick={startCamera}
                                            >
                                                <Camera className="mr-2 h-5 w-5" />
                                                {t('visual.take_photo', 'Take Photo')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="rounded-xl px-8 bg-background/50 hover:bg-background transition-all"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <ImageIcon className="mr-2 h-5 w-5" />
                                                {t('visual.upload_photo', 'Upload Photo')}
                                            </Button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                            />
                                            {(capturedImage || result) && (
                                                <Button
                                                    variant="destructive"
                                                    size="lg"
                                                    className="rounded-xl px-8 ml-auto"
                                                    onClick={clearAnalysis}
                                                >
                                                    <X className="mr-2 h-5 w-5" />
                                                    Clear Analysis
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="secondary"
                                                className="rounded-xl px-8 shadow-lg transition-all"
                                                onClick={capturePhoto}
                                            >
                                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                                                {t('visual.capture', 'Capture Photo')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="lg"
                                                className="rounded-xl"
                                                onClick={stopCamera}
                                            >
                                                <X className="mr-2 h-5 w-5" />
                                                {t('visual.stop_camera', 'Stop')}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results Sidebar/Drawer Equivaluent in main area */}
                        {result && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-none shadow-xl bg-card/30 backdrop-blur-md ring-1 ring-border/50">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-2xl font-black">{result.label}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={cn("font-bold uppercase tracking-wider text-[10px]", getSeverityColor(result.severity))}>
                                                        {result.severity}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground mr-1">•</span>
                                                    <span className="text-xs font-bold text-primary">
                                                        {(result.confidence * 100).toFixed(0)}% Confidence
                                                    </span>
                                                </CardDescription>
                                            </div>
                                            <div className="p-2 bg-primary/5 rounded-lg">
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                                            {result.description}
                                        </p>
                                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
                                            <Info className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-bold text-foreground">
                                                {t('visual.detected_part', 'Body Part')}: {result.detected_part}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl bg-primary/[0.03] backdrop-blur-md ring-1 ring-primary/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-black flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            {t('visual.care_advice', 'Care Guide')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="space-y-2">
                                            {result.advice.map((item, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-muted-foreground font-medium">
                                                    <div className="h-5 w-1 bg-primary/20 rounded-full mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="pt-4 border-t border-primary/10">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                                                {t('visual.next_steps', 'Next Steps')}
                                            </h4>
                                            <div className="space-y-2">
                                                {result.next_steps.map((step, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs font-bold p-2 bg-background/50 rounded-lg">
                                                        <ChevronRight className="h-3 w-3 text-primary" />
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {result.medications && result.medications.length > 0 && (
                                            <div className="pt-4 border-t border-primary/10">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                    </svg>
                                                    Recommended Medications
                                                </h4>
                                                <div className="space-y-2">
                                                    {result.medications.map((med, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-xs font-medium p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                                            <span className="text-foreground">{med}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                                                        <Info className="h-3 w-3 shrink-0 mt-0.5" />
                                                        <span>Consult a pharmacist or doctor before taking any medication. Dosages may vary based on age, weight, and medical history.</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex gap-4">
                            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                {t('visual.disclaimer')}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar / Context Section */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Symptom Context / Notes */}
                        <Card className="border-none shadow-xl bg-card/30 backdrop-blur-md ring-1 ring-border/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-black">{t('visual.symptom_notes', 'Symptom Context')}</CardTitle>
                                <CardDescription>Add context like pain level or duration</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="relative">
                                    <Textarea
                                        placeholder="Describe sensation (e.g., itchy, throbbing), when it started..."
                                        className="min-h-[120px] rounded-xl bg-background/40 border-border/50 focus:ring-primary/20"
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                    />
                                    <Button
                                        size="icon"
                                        variant={isRecording ? "destructive" : "secondary"}
                                        className={cn(
                                            "absolute bottom-3 right-3 rounded-full shadow-lg transition-all",
                                            isRecording && "animate-pulse"
                                        )}
                                        onClick={startVoiceRecognition}
                                    >
                                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold">{t('visual.progress', 'Healing Progress')}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/20">
                                        Day 1 Tracked
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* History Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <History className="h-5 w-5 text-muted-foreground" />
                                    {t('visual.history', 'Analysis History')}
                                </h3>
                                {history.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={clearHistory}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-border/50">
                                        <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {t('visual.no_history', 'No records yet')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.slice(0, 5).map((entry, index) => (
                                            <div key={entry.id} className="space-y-2">
                                                <div
                                                    className="group p-3 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer flex gap-4 items-center ring-1 ring-border/50"
                                                    onClick={() => setResult(entry.result)}
                                                >
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border/50">
                                                        <img src={entry.image} alt="Thumbnail" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-black truncate">{entry.result.label}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-muted-foreground font-bold italic">
                                                                {new Date(entry.date).toLocaleDateString()}
                                                            </span>
                                                            <Badge className={cn("text-[9px] h-4 font-black uppercase", getSeverityColor(entry.result.severity))}>
                                                                {entry.result.severity}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>

                                                {index === 0 && history.length > 1 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full rounded-xl text-[10px] font-bold uppercase tracking-wider py-1.5 h-auto bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                                                        onClick={() => {
                                                            toast({
                                                                title: t('visual.comparison_generated', 'Comparison Generated'),
                                                                description: t('visual.comparing_with', 'Comparing with ') + new Date(history[1].date).toLocaleDateString(),
                                                            });
                                                        }}
                                                    >
                                                        <TrendingUp className="mr-2 h-3.5 w-3.5" />
                                                        {t('visual.compare_previous', 'Compare with Previous Scan')}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </Layout>
    );
}
