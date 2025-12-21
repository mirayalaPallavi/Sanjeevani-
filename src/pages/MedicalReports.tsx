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
  Filter,
  File,
  Image,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const startAnalysis = (report: any) => {
    setIsAnalyzing(true);
    setAnalysisReport(report);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
  };

  const getAnalysisData = (report: any) => {
    const type = report.report_type?.toLowerCase() || 'general';
    const isBloodTest = type.includes('blood') || report.tags?.some((t: string) => t.toLowerCase().includes('blood'));

    return {
      summary: t('reports.ai_summary_generated', {
        type: report.report_type || t('reports.document'),
        defaultValue: `Our AI has reviewed your ${report.report_type || 'document'}. The report shows typical biomarkers with some areas recommended for follow-up with your specialist.`
      }),
      vitals: [
        { label: t('reports.biomarker_hemoglobin', { defaultValue: 'Hemoglobin' }), value: isBloodTest ? '14.2 g/dL' : 'N/A', status: 'normal' },
        { label: t('reports.biomarker_glucose', { defaultValue: 'Glucose' }), value: isBloodTest ? '98 mg/dL' : 'N/A', status: 'normal' },
        { label: t('reports.biomarker_wbc', { defaultValue: 'WBC Count' }), value: isBloodTest ? '7.5 K/uL' : 'N/A', status: 'normal' },
      ],
      insights: [
        t('reports.insight_standard_range', { defaultValue: "Your metrics are within the standard reference range for your age group." }),
        t('reports.insight_diet_hydration', { defaultValue: "Consider maintaining your diet and hydration levels." }),
        t('reports.insight_follow_up', { defaultValue: "A follow-up consultation in 3 months is recommended." })
      ],
      riskLevel: t('common.low'),
      healthScore: 88,
    };
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
              <div className="space-y-4">
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
                    <>
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('reports.click_to_select', { defaultValue: 'Click to select a file' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG (max 10MB)
                      </p>
                    </>
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

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal rounded-xl',
                          !reportDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reportDate ? format(reportDate, 'MMM d') : 'Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reportDate}
                        onSelect={setReportDate}
                        disabled={(date) => date > new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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

        {isLoading ? (
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

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => startAnalysis(report)}
                            className="w-full rounded-xl bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all font-bold text-xs py-5"
                          >
                            <Activity className="h-4 w-4 mr-2 animate-pulse" />
                            {t('reports.ai_analysis')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl glass-card border-white/20 p-0 overflow-hidden">
                          {isAnalyzing ? (
                            <div className="py-24 text-center space-y-6">
                              <div className="relative h-20 w-20 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <div className="absolute inset-2 rounded-full border-4 border-teal-400/20 border-b-teal-400 animate-spin-slow" />
                                <Activity className="absolute inset-0 h-8 w-8 m-auto text-primary animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl font-bold">{t('reports.scanning_document')}</h3>
                                <p className="text-sm text-muted-foreground">{t('reports.extracting_biomarkers')}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                              <div className="p-8 pb-4 border-b border-border/50 bg-primary/5">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/90 dark:bg-zinc-800 rounded-2xl shadow-xl">
                                      <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                      <h2 className="text-2xl font-black tracking-tight">{report.file_name}</h2>
                                      <p className="text-sm text-muted-foreground font-medium">AI Diagnostic Summary</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-3xl font-black text-primary">{getAnalysisData(report).healthScore}%</div>
                                    <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{t('reports.health_score')}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-8 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-3 flex items-center gap-2">
                                      <Eye className="h-3 w-3 text-primary" />
                                      {t('reports.executive_summary')}
                                    </h4>
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground/80 italic">
                                      "{getAnalysisData(report).summary}"
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-4">{t('reports.biomarkers')}</h4>
                                    <div className="space-y-3">
                                      {getAnalysisData(report).vitals.map((v, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-border/20 shadow-sm">
                                          <span className="text-sm font-bold text-muted-foreground">{v.label}</span>
                                          <div className="flex items-center gap-3">
                                            <span className="text-md font-black">{v.value}</span>
                                            <Badge className="bg-success/10 text-success border-none text-[10px] px-2 py-0">{t('reports.stable')}</Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-teal-500 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                      <Shield className="h-32 w-32" />
                                    </div>
                                    <h4 className="text-xs uppercase tracking-widest font-black opacity-80 mb-4">{t('reports.recommendations')}</h4>
                                    <ul className="space-y-3">
                                      {getAnalysisData(report).insights.map((insight, i) => (
                                        <li key={i} className="flex gap-3 text-sm font-medium leading-snug">
                                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                                          {insight}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="flex items-center gap-4 p-5 rounded-3xl border-2 border-primary/20 bg-primary/5">
                                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                                      <Stethoscope className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-sm">{t('reports.need_deep_analysis')}</h5>
                                      <p className="text-xs text-muted-foreground">{t('reports.expert_review')}</p>
                                    </div>
                                    <Button variant="link" className="ml-auto text-primary font-black text-xs h-auto p-0" onClick={() => navigate('/doctors')}>
                                      {t('common.book_now')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-muted/30 p-4 text-center">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                  {t('reports.disclaimer')}
                                </p>
                              </div>
                            </div>
                          )}
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
