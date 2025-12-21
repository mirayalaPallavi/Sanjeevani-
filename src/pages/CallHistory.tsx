import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { useCallRecords } from '@/hooks/useCallRecords';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Download, Clock, Calendar, Loader2 } from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { downloadTranscript } from '@/utils/pdfExport';

export default function CallHistory() {
  const { t } = useTranslation();
  const { records: callRecords, isLoading: callsLoading } = useCallRecords();
  const [activeTab, setActiveTab] = useState('calls');

  const formatCallDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    return formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] });
  };

  // Chat history removed

  const exportCallTranscript = (record: typeof callRecords[0]) => {
    if (record.transcript) {
      downloadTranscript(
        record.transcript,
        `call-transcript-${format(new Date(record.started_at), 'yyyy-MM-dd-HHmm')}`
      );
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            {t('history.history_title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('history.view_call_records')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('history.call_records')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calls">
            {callsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : callRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('history.no_call_records')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {callRecords.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.call_type}</Badge>
                            <Badge
                              className={
                                record.status === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-warning/10 text-warning'
                              }
                            >
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(record.started_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatCallDuration(record.duration_seconds)}
                            </span>
                          </div>
                          {record.summary && (
                            <p className="text-sm mt-2">{record.summary}</p>
                          )}
                        </div>
                        {record.transcript && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportCallTranscript(record)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {t('history.transcript')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Chat History removed */}
        </Tabs>
      </div>
    </Layout>
  );
}
