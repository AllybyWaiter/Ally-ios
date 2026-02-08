import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Download, 
  ChevronDown, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown,
  Search,
  Filter,
  FileJson,
  FileSpreadsheet,
  MessageSquare,
  Camera,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { fetchTrainingData, type TrainingDataEntry } from '@/infrastructure/queries/feedback';
import { exportTrainingData } from '@/lib/exportTrainingData';
import { queryPresets } from '@/lib/queryConfig';


const featureLabels: Record<string, string> = {
  chat: 'Ally Chat',
  photo_analysis: 'Photo Analysis',
  task_suggestions: 'Task Suggestions',
  ticket_reply: 'Ticket Reply'
};

const featureIcons: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  photo_analysis: <Camera className="h-4 w-4" />,
  task_suggestions: <Sparkles className="h-4 w-4" />,
  ticket_reply: <MessageCircle className="h-4 w-4" />
};

interface ExpandableRowProps {
  entry: TrainingDataEntry;
  onViewDetails: (entry: TrainingDataEntry) => void;
}

function ExpandableRow({ entry, onViewDetails }: ExpandableRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasExpandableContent = entry.user_message || entry.assistant_message || entry.context;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="w-8">
          {hasExpandableContent && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {formatDate(entry.created_at, 'PP')}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {featureIcons[entry.feature]}
            <span>{featureLabels[entry.feature] || entry.feature}</span>
          </div>
        </TableCell>
        <TableCell>
          {entry.rating === 'positive' ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <ThumbsUp className="h-3 w-3 mr-1" />
              Positive
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              <ThumbsDown className="h-3 w-3 mr-1" />
              Negative
            </Badge>
          )}
        </TableCell>
        <TableCell className="max-w-xs truncate">
          {entry.user_message 
            ? entry.user_message.slice(0, 60) + (entry.user_message.length > 60 ? '...' : '')
            : entry.context?.messageContent?.slice(0, 60) || '—'
          }
        </TableCell>
        <TableCell>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewDetails(entry)}
          >
            View Details
          </Button>
        </TableCell>
      </TableRow>
      
      {hasExpandableContent && (
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={6} className="p-4">
              <div className="space-y-3 text-sm">
                {entry.user_message && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">User Message:</p>
                    <p className="bg-background p-2 rounded border">{entry.user_message}</p>
                  </div>
                )}
                {entry.assistant_message && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">AI Response:</p>
                    <p className="bg-background p-2 rounded border whitespace-pre-wrap">
                      {entry.assistant_message.slice(0, 500)}
                      {entry.assistant_message.length > 500 && '...'}
                    </p>
                  </div>
                )}
                {entry.feedback_text && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">User Feedback:</p>
                    <p className="bg-background p-2 rounded border italic">{entry.feedback_text}</p>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export default function AITrainingData() {
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<TrainingDataEntry | null>(null);

  const { data: trainingData, isLoading } = useQuery({
    queryKey: ['ai-training-data', featureFilter, ratingFilter],
    queryFn: () => fetchTrainingData({
      feature: featureFilter !== 'all' ? featureFilter : undefined,
      rating: ratingFilter !== 'all' ? ratingFilter as 'positive' | 'negative' : undefined,
      limit: 500
    }),
    ...queryPresets.analytics,
  });

  const filteredData = useMemo(() => {
    if (!trainingData) return [];
    if (!searchQuery) return trainingData;
    
    const query = searchQuery.toLowerCase();
    return trainingData.filter(entry => 
      entry.user_message?.toLowerCase().includes(query) ||
      entry.assistant_message?.toLowerCase().includes(query) ||
      entry.feedback_text?.toLowerCase().includes(query) ||
      entry.context?.messageContent?.toLowerCase().includes(query)
    );
  }, [trainingData, searchQuery]);

  const stats = useMemo(() => {
    if (!trainingData) return { total: 0, positive: 0, negative: 0, withMessages: 0 };
    return {
      total: trainingData.length,
      positive: trainingData.filter(d => d.rating === 'positive').length,
      negative: trainingData.filter(d => d.rating === 'negative').length,
      withMessages: trainingData.filter(d => d.user_message && d.assistant_message).length
    };
  }, [trainingData]);

  const handleExport = (format: 'jsonl' | 'csv', negativeOnly?: boolean) => {
    const dataToExport = negativeOnly 
      ? filteredData.filter(d => d.rating === 'negative')
      : filteredData;
    
    exportTrainingData(dataToExport, format, {
      filenamePrefix: negativeOnly ? 'negative-feedback' : 'training-data'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Positive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Negative</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.negative}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Full Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withMessages}</div>
            <p className="text-xs text-muted-foreground">Exportable for fine-tuning</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Training Data</CardTitle>
              <CardDescription>Review and export AI feedback for training purposes</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('jsonl')}
                disabled={stats.withMessages === 0}
              >
                <FileJson className="mr-2 h-4 w-4" />
                Export JSONL
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('csv')}
                disabled={filteredData.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('jsonl', true)}
                disabled={stats.negative === 0}
                className="text-amber-600 hover:text-amber-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Negative Only
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={featureFilter} onValueChange={setFeatureFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  <SelectItem value="chat">Ally Chat</SelectItem>
                  <SelectItem value="photo_analysis">Photo Analysis</SelectItem>
                  <SelectItem value="task_suggestions">Task Suggestions</SelectItem>
                  <SelectItem value="ticket_reply">Ticket Reply</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="positive">Positive Only</SelectItem>
                <SelectItem value="negative">Negative Only</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map(entry => (
                    <ExpandableRow 
                      key={entry.id} 
                      entry={entry} 
                      onViewDetails={setSelectedEntry}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No training data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntry && featureIcons[selectedEntry.feature]}
              {selectedEntry && (featureLabels[selectedEntry.feature] || selectedEntry.feature)} Feedback
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && formatDate(selectedEntry.created_at, 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Rating:</span>
                {selectedEntry.rating === 'positive' ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Positive
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Negative
                  </Badge>
                )}
              </div>

              {selectedEntry.user_message && (
                <div>
                  <h4 className="font-medium mb-2">User Message</h4>
                  <div className="bg-muted p-3 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedEntry.user_message}
                  </div>
                </div>
              )}

              {selectedEntry.assistant_message && (
                <div>
                  <h4 className="font-medium mb-2">AI Response</h4>
                  <div className="bg-muted p-3 rounded-lg whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                    {selectedEntry.assistant_message}
                  </div>
                </div>
              )}

              {selectedEntry.feedback_text && (
                <div>
                  <h4 className="font-medium mb-2">User Written Feedback</h4>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-sm italic">
                    "{selectedEntry.feedback_text}"
                  </div>
                </div>
              )}

              {selectedEntry.context && Object.keys(selectedEntry.context).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Context Data</h4>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedEntry.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
