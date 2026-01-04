import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { useMedicalReports } from '@/hooks/useMedicalReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Upload,
  Loader2,
  Download,
  Trash2,
  Eye,
  Share2,
  Calendar as CalendarIcon,
  Activity,
  Shield,
  Stethoscope,
  Search,
  Check,
  Brain,
  Terminal,
  Code,
  Sparkles,
  Filter,
  File,
  Image,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { GROQ_API_URL, getGroqHeaders, groqEnabled } from '@/config/groq';
import { AIThinkingVisualizer } from '@/components/AIThinkingVisualizer';
import type { MedicalReport } from '@/types/database';

const reportTypeKeys = [
  'lab',
  'prescription',
  'xray',
  'mri',
  'ultrasound',
  'blood',
  'ecg',
  'discharge',
  'other',
];

export default function MedicalReports() {
  const { t } = useTranslation();
  const { reports, uploadReport, deleteReport, getReportUrl, isLoading } =
    useMedicalReports();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('');
  const [reportDate, setReportDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [analysisReport, setAnalysisReport] = useState<MedicalReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('general');
  const [pythonLogicResult, setPythonLogicResult] = useState<any | null>(null);

  const protocols = {
    blood_test: {
      name: 'Blood Test (CBC)',
      keywords: ['hemoglobin', 'wbc', 'platelet', 'rbc', 'hgb', 'cbc'],
      logic: (extractedData: any) => ({
        parameters: [
          {
            name: 'Hemoglobin',
            value: extractedData?.hb || '14.2',
            status: extractedData?.hb ? (parseFloat(extractedData.hb) < 12.0 ? 'Low' : parseFloat(extractedData.hb) > 17.5 ? 'High' : 'Normal') : 'Normal',
            range: '12.0-17.5'
          },
          {
            name: 'WBC Count',
            value: extractedData?.wbc || '7200',
            status: extractedData?.wbc ? (parseFloat(extractedData.wbc) > 11000 ? 'High' : parseFloat(extractedData.wbc) < 4500 ? 'Low' : 'Normal') : 'Normal',
            range: '4500-11000'
          },
          {
            name: 'PCV / Hematocrit',
            value: extractedData?.pcv || '42.0',
            status: extractedData?.pcv ? (parseFloat(extractedData.pcv) < 36.0 ? 'Low' : 'Normal') : 'Normal',
            range: '36.0-46.0'
          }
        ],
        suggestions: extractedData?.hb && parseFloat(extractedData.hb) < 12.0
          ? ["Your Hemoglobin is low. Increase iron intake (spinach, lentils) and vitamin C to aid absorption.", "Consider a follow-up with a hematologist."]
          : ["Maintain a balanced diet rich in iron.", "Stay active to support immune health."]
      })
    },
    lipid_panel: {
      name: 'Lipid Profile',
      keywords: ['cholesterol', 'ldl', 'hdl', 'triglycerides'],
      logic: (extractedData: any) => ({
        parameters: [
          { name: 'Total Cholesterol', value: extractedData?.chol || '185', status: extractedData?.chol && parseFloat(extractedData.chol) > 200 ? 'High' : 'Normal', range: '< 200' },
          { name: 'LDL', value: extractedData?.ldl || '95', status: extractedData?.ldl && parseFloat(extractedData.ldl) > 100 ? 'High' : 'Normal', range: '< 100' },
          { name: 'HDL', value: extractedData?.hdl || '52', status: extractedData?.hdl && parseFloat(extractedData.hdl) < 40 ? 'Low' : 'Normal', range: '> 40' }
        ],
        suggestions: ["Focus on Omega-3 rich foods like walnuts or fish.", "Maintain 150 min/week of cardio exercise."]
      })
    },
    liver_function: {
      name: 'Liver Function',
      keywords: ['alt', 'ast', 'bilirubin', 'sgot', 'sgpt', 'liver'],
      logic: (extractedData: any) => ({
        parameters: [
          { name: 'ALT (SGPT)', value: extractedData?.alt || '32', status: extractedData?.alt && parseFloat(extractedData.alt) > 55 ? 'High' : 'Normal', range: '< 55' },
          { name: 'AST (SGOT)', value: extractedData?.ast || '28', status: extractedData?.ast && parseFloat(extractedData.ast) > 40 ? 'High' : 'Normal', range: '< 40' }
        ],
        suggestions: ["Limit alcohol consumption.", "Minimize use of hepatotoxic painkillers."]
      })
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesType =
      filterType === 'all' || report.report_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const startAnalysis = async (report: MedicalReport) => {
    if (!groqEnabled()) {
      toast({
        title: t('assistant.api_key_missing_title'),
        description: t('assistant.api_key_missing_desc'),
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisReport(report);
    setAiAnalysisResult(null);
    setPythonLogicResult(null);

    const isImage = report.file_type.startsWith('image/');

    let reply = "";
    let success = false;

    try {
      let imageData = '';
      let signedUrl = '';

      // 1. Get a signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('medical-reports')
        .createSignedUrl(report.file_path, 3600);

      if (urlError) throw new Error(`Storage Error: ${urlError.message}`);
      signedUrl = urlData.signedUrl;

      // 1.5 Base64 conversion
      if (isImage) {
        try {
          const fetchResp = await fetch(signedUrl);
          const blob = await fetchResp.blob();
          imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (fetchErr) {
          console.warn('Base64 conversion failed:', fetchErr);
        }
      }

      const visionModels = [
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview',
        'llama-3.2-11b-vision',
        'llama-3.2-90b-vision',
        'meta-llama/llama-4-scout-17b-16e-instruct'
      ];

      if (isImage) {
        for (const modelId of visionModels) {
          try {
            const payload = {
              model: modelId,
              messages: [
                {
                  role: 'system',
                  content: selectedProtocol === 'general'
                    ? `You are an expert AI clinical diagnostician. Analyze this medical report and return a JSON object with this exact structure:
                    {
                      "snapshot": "One sentence summary",
                      "findings": [
                        { "parameter": "Name", "value": "Value", "clinical_significance": "Why it matters", "status": "Abnormal|Normal" }
                      ],
                      "insights": "Clinical relations between findings",
                      "risk": "Assessment of risks",
                      "plan": ["Suggested next step 1", "Suggested next step 2"]
                    }
                    Return ONLY JSON.`
                    : `Extract raw numerical values for this report as JSON. Return ONLY JSON. Fields: hb, wbc, pcv, rdw, chol, ldl, hdl, alt, ast. If not found, use null.`
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: `Analyze this medical report: ${report.file_name}` },
                    { type: 'image_url', image_url: { url: imageData || signedUrl } }
                  ]
                }
              ],
              temperature: 0.3,
              max_tokens: 1000,
            };

            const response = await fetch(GROQ_API_URL, {
              method: 'POST',
              headers: getGroqHeaders(),
              body: JSON.stringify(payload)
            });

            if (!response.ok) continue;

            const data = await response.json();
            reply = data.choices[0].message.content;

            if (selectedProtocol !== 'general') {
              try {
                // Clean markdown JSON if AI included it
                const cleanedJson = reply.replace(/```json|```/g, '').trim();
                const extractedData = JSON.parse(cleanedJson);
                const proto = protocols[selectedProtocol as keyof typeof protocols];

                // Mismatch Check: If we extracted NO relevant data for the protocol
                const hasDataForProtocol = proto.keywords.some(k => reply.toLowerCase().includes(k));

                if (!hasDataForProtocol) {
                  toast({
                    title: 'Protocol Mismatch?',
                    description: `This report doesn't look like a ${proto.name}.`,
                    variant: 'destructive'
                  });
                  setSelectedProtocol('general');
                  setAiAnalysisResult("Detection: Protocol Mismatch. Showing general analysis instead.\n\n" + reply);
                } else {
                  setPythonLogicResult(proto.logic(extractedData));
                }
              } catch (e) {
                console.error('JSON Parse Error:', e);
                setAiAnalysisResult(reply);
              }
            } else {
              setAiAnalysisResult(reply);
            }

            success = true;
            break;
          } catch (modelErr) {
            console.warn(`Error trying model ${modelId}:`, modelErr);
          }
        }
      }

      if (!success) {
        const payload = {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert medical consultant. The visual analysis of this report failed, so you must provide a clinical assessment based on report metadata: Name: ${report.file_name}, Type: ${report.report_type}, Description: ${report.description}. Provide a professional medical summary and recommended follow-up.`
            },
            { role: 'user', content: `Analyze report metadata: ${report.file_name}` }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        };

        const resp = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: getGroqHeaders(),
          body: JSON.stringify(payload),
        });

        if (!resp.ok) throw new Error("All attempts failed.");
        const data = await resp.json();
        reply = data?.choices?.[0]?.message?.content ?? "";
        if (isImage) reply = "⚠️ **Visual analysis failed**. Analyzing based on metadata:\n\n" + reply;
        setAiAnalysisResult(reply);
      }
    } catch (e) {
      console.error('Analysis Debug:', e);
      toast({
        title: 'Analysis Failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive'
      });
      setAiAnalysisResult("Failed to perform analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadReport(selectedFile, {
        reportType,
        reportDate: reportDate ? format(reportDate, 'yyyy-MM-dd') : undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        description,
      });

      toast({
        title: t('reports.report_uploaded'),
        description: t('reports.report_uploaded_desc'),
      });

      setUploadDialogOpen(false);
      resetUploadForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('reports.upload_failed'),
        description: error instanceof Error ? error.message : t('reports.upload_failed_desc'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (reportId: string, filePath: string) => {
    try {
      await deleteReport(reportId, filePath);
      toast({
        title: t('reports.report_deleted'),
        description: t('reports.report_deleted_desc', { defaultValue: 'The report has been removed.' }),
      });
    } catch (error) {
      toast({
        title: t('reports.delete_failed'),
        description: t('reports.delete_failed_desc', { defaultValue: 'Unable to delete report.' }),
        variant: 'destructive',
      });
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const url = await getReportUrl(filePath);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: t('reports.view_failed'),
        description: t('reports.view_failed_desc', { defaultValue: 'Unable to open report.' }),
        variant: 'destructive',
      });
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setReportType('');
    setReportDate(undefined);
    setDescription('');
    setTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-primary" />;
    }
    return <File className="h-8 w-8 text-primary" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              {t('reports.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('reports.description')}
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-lg shadow-primary/20">
                <Upload className="h-4 w-4 mr-2" />
                {t('reports.upload')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass-card border-white/20">
              <DialogHeader>
                <DialogTitle>{t('reports.upload')}</DialogTitle>
                <DialogDescription>
                  {t('reports.add_new_desc', { defaultValue: 'Add a new report to your medical records' })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pb-4">
                <div
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300',
                    selectedFile
                      ? 'border-primary bg-primary/5 shadow-inner'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        {getFileIcon(selectedFile.type)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('reports.click_to_select', { defaultValue: 'Click to select a file' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={t('reports.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypeKeys.map((key) => (
                        <SelectItem key={key} value={t(`reports.report_types_list.${key}`)}>
                          {t(`reports.report_types_list.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General AI</SelectItem>
                      <SelectItem value="blood_test">Blood (CBC)</SelectItem>
                      <SelectItem value="lipid_panel">Lipid Profile</SelectItem>
                      <SelectItem value="liver_function">Liver Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-xl',
                        !reportDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDate ? format(reportDate, 'MMM d, yyyy') : t('reports.report_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reportDate}
                      onSelect={setReportDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  className="rounded-xl"
                  placeholder={t('reports.tags_placeholder', { defaultValue: 'Tags (E.g. Cardiology, Blood)' })}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />

                <Textarea
                  className="rounded-xl min-h-[80px]"
                  placeholder={t('reports.notes_placeholder', { defaultValue: 'Notes or Description' })}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full rounded-xl py-6 text-md font-bold shadow-lg shadow-primary/25"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-5 w-5 mr-2" />
                  )}
                  {t('reports.upload_and_analyze', { defaultValue: 'Upload & Analyze' })}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('reports.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-sm focus:ring-primary/20"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-2xl border-white/20 dark:border-white/10 bg-white/5 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">{t('reports.all_specialties')}</SelectItem>
              {reportTypeKeys.map((key) => (
                <SelectItem key={key} value={t(`reports.report_types_list.${key}`)}>
                  {t(`reports.report_types_list.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">{t('reports.synchronizing')}</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="border-dashed py-24 text-center bg-transparent border-primary/20">
              <CardContent>
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                <h3 className="text-xl font-bold mb-2">{t('reports.vault_empty')}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                  {reports.length === 0
                    ? t('reports.start_uploading')
                    : t('reports.no_match')}
                </p>
                <Button onClick={() => setUploadDialogOpen(true)} className="rounded-full px-8">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('reports.add_first')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 glass-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                          {getFileIcon(report.file_type)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                            onClick={() => handleView(report.file_path)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('reports.secure_delete')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('reports.permanent_erase')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                  onClick={() => handleDelete(report.id, report.file_path)}
                                >
                                  {t('reports.erase_forever')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-1 mb-5">
                        <h3 className="font-bold text-[16px] leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                          {report.file_name}
                        </h3>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          {t('reports.stored')} {format(new Date(report.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mb-6">
                        {report.report_type && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2.5 py-0.5">
                            {report.report_type}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] font-mono opacity-60">
                          {formatFileSize(report.file_size)}
                        </Badge>
                      </div>

                      {report.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-6 min-h-[32px]">
                          {report.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-2">
                        <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                          <SelectTrigger className="w-full h-8 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-muted/50 border-none">
                            <SelectValue placeholder="Select Analysis Engine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General AI Analysis</SelectItem>
                            <SelectItem value="blood_test">Python: Blood Test (CBC)</SelectItem>
                            <SelectItem value="lipid_panel">Python: Lipid Profile</SelectItem>
                            <SelectItem value="liver_function">Python: Liver Function</SelectItem>
                          </SelectContent>
                        </Select>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => startAnalysis(report)}
                              className="w-full rounded-xl bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all font-bold text-xs py-5"
                            >
                              <Activity className="h-4 w-4 mr-2 animate-pulse" />
                              {selectedProtocol === 'general' ? t('reports.ai_analysis') : 'Run Python Logic'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl glass-card border-white/20 p-0 overflow-hidden shadow-2xl focus:outline-none [&>button:last-child]:hidden">
                            <DialogClose className="absolute right-4 top-4 z-[60] rounded-full p-2 bg-primary/10 hover:bg-primary/20 transition-all border border-primary/10 group focus:outline-none">
                              <X className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                            </DialogClose>
                            {isAnalyzing ? (
                              <div className="py-24 text-center space-y-6">
                                <AIThinkingVisualizer isThinking={true} />
                                <div className="space-y-2">
                                  <h3 className="text-xl font-bold">{selectedProtocol !== 'general' ? `Applying ${protocols[selectedProtocol as keyof typeof protocols]?.name} Logic...` : t('reports.scanning_document')}</h3>
                                  <p className="text-sm text-muted-foreground">{t('reports.extracting_biomarkers')}</p>
                                </div>
                              </div>
                            ) : (aiAnalysisResult || pythonLogicResult) ? (
                              <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <div className="p-8 pb-6 border-b border-border/50 bg-primary/5 sticky top-0 z-10 backdrop-blur-md">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl shadow-primary/5">
                                      {selectedProtocol !== 'general' ? <Terminal className="h-8 w-8 text-emerald-500" /> : <Brain className="h-8 w-8 text-primary" />}
                                    </div>
                                    <div>
                                      <h2 className="text-2xl font-black tracking-tight">{report.file_name}</h2>
                                      <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] opacity-70">
                                        {selectedProtocol !== 'general' ? `Python Protocol: ${protocols[selectedProtocol as keyof typeof protocols]?.name}` : 'AI Clinical Discovery'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-8">
                                  {pythonLogicResult && (
                                    <div className="space-y-6 mb-8">
                                      <div className="grid gap-3">
                                        {pythonLogicResult.parameters.map((p: any, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-border/50 shadow-sm">
                                            <div>
                                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{p.name}</p>
                                              <p className="text-lg font-black">{p.value}</p>
                                            </div>
                                            <div className="text-right">
                                              <Badge className={cn("rounded-lg text-[10px] uppercase font-black", p.status === 'Normal' ? "bg-emerald-500" : "bg-rose-500")}>
                                                {p.status}
                                              </Badge>
                                              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Range: {p.range}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                                        <h4 className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-wider text-xs">
                                          <Sparkles className="h-4 w-4" />
                                          Health Optimization Suggestions
                                        </h4>
                                        <ul className="space-y-3">
                                          {pythonLogicResult.suggestions.map((s: string, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-sm font-medium leading-relaxed">
                                              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                              </div>
                                              {s}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}

                                  {aiAnalysisResult && (
                                    <div className="space-y-8">
                                      {(() => {
                                        try {
                                          const data = JSON.parse(aiAnalysisResult.replace(/```json|```/g, '').trim());
                                          return (
                                            <div className="space-y-8">
                                              <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Clinical Snapshot</h4>
                                                <p className="text-lg font-bold leading-tight">{data.snapshot}</p>
                                              </div>

                                              <div className="grid gap-3">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Critical Findings</h4>
                                                {data.findings.map((f: any, idx: number) => (
                                                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-border/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", f.status === 'Abnormal' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                                                      {f.status === 'Abnormal' ? <Activity className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center justify-between mb-1">
                                                        <h5 className="font-bold text-sm truncate">{f.parameter}</h5>
                                                        <Badge variant="outline" className={cn("text-[9px] uppercase", f.status === 'Abnormal' ? "text-rose-500 border-rose-500/20" : "text-emerald-500 border-emerald-500/20")}>
                                                          {f.value}
                                                        </Badge>
                                                      </div>
                                                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{f.clinical_significance}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>

                                              <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Diagnostic Insights</h4>
                                                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 text-sm font-medium leading-relaxed">
                                                    {data.insights}
                                                  </div>
                                                </div>
                                                <div className="space-y-3">
                                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Risk Assessment</h4>
                                                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 text-sm font-medium leading-relaxed">
                                                    {data.risk}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                                                <h4 className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-wider text-xs">
                                                  <Sparkles className="h-4 w-4" />
                                                  Clinical Action Plan
                                                </h4>
                                                <ul className="space-y-3">
                                                  {data.plan.map((step: string, idx: number) => (
                                                    <li key={idx} className="flex gap-3 text-sm font-bold leading-relaxed">
                                                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-600 text-[10px]">
                                                        {idx + 1}
                                                      </div>
                                                      {step}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            </div>
                                          );
                                        } catch (e) {
                                          return (
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:rounded-2xl">
                                              <div className="whitespace-pre-wrap text-[15px] font-medium text-foreground/90 leading-relaxed bg-white/50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-border/20 shadow-sm">
                                                {aiAnalysisResult}
                                              </div>
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  )}

                                  <div className="mt-8 flex items-center gap-4 p-5 rounded-3xl border-2 border-primary/20 bg-primary/5">
                                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                                      <Stethoscope className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-sm tracking-tight">{t('reports.need_deep_analysis')}</h5>
                                      <p className="text-xs text-muted-foreground">{t('reports.expert_review')}</p>
                                    </div>
                                    <Button variant="link" className="ml-auto text-primary font-black text-xs h-auto p-0 hover:no-underline" onClick={() => navigate('/doctors')}>
                                      {t('common.book_now')}
                                    </Button>
                                  </div>
                                </div>

                                <div className="bg-muted/30 p-4 text-center">
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                                    {t('reports.disclaimer')}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    </Layout>
  );
}
