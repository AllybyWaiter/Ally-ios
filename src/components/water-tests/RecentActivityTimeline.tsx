import { useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ChevronRight, Droplets, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatParameter, UnitSystem } from '@/lib/unitConversions';
import { formatRelativeTime } from '@/lib/formatters';

interface TestParameter {
  id?: string;
  parameter_name: string;
  value: number;
  unit: string;
  status?: string | null;
}

interface WaterTest {
  id: string;
  test_date: string;
  confidence?: number | string | null;
  tags?: string[] | null;
  notes?: string | null;
  photo_url?: string | null;
  test_parameters?: TestParameter[] | null;
}

interface RecentActivityTimelineProps {
  tests: WaterTest[];
  units: UnitSystem;
  onTestClick?: (testId: string) => void;
  maxItems?: number;
}

function getDateGroup(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return 'This Week';
  return format(date, 'MMMM yyyy');
}

export function RecentActivityTimeline({
  tests,
  units,
  onTestClick,
  maxItems = 10,
}: RecentActivityTimelineProps) {
  const { t } = useTranslation();

  // Group tests by date
  const groupedTests = useMemo(() => {
    const limited = tests.slice(0, maxItems);
    const groups = new Map<string, WaterTest[]>();

    limited.forEach((test) => {
      const date = new Date(test.test_date);
      const group = getDateGroup(date);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(test);
    });

    return Array.from(groups.entries());
  }, [tests, maxItems]);

  if (tests.length === 0) {
    return (
      <div className="text-center py-12">
        <Droplets className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">{t('waterTests.noTestsRecorded')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('waterTests.recentActivity')}</h3>
        {tests.length > maxItems && (
          <Button variant="ghost" size="sm" className="text-primary">
            {t('common.viewAll')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {groupedTests.map(([group, groupTests]) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                {group}
              </h4>

              <div className="space-y-2">
                {groupTests.map((test, _index) => {
                  const hasWarnings = test.test_parameters?.some(
                    (p) => p.status === 'warning' || p.status === 'critical'
                  );
                  const criticalCount = test.test_parameters?.filter(
                    (p) => p.status === 'critical'
                  ).length || 0;

                  return (
                    <motion.button
                      key={test.id}
                      layout
                      onClick={() => onTestClick?.(test.id)}
                      aria-label={`View water test from ${formatRelativeTime(test.test_date)}${hasWarnings ? ', has warnings' : ''}`}
                      className={cn(
                        'w-full p-4 rounded-xl border text-left transition-all',
                        'hover:bg-muted/50 hover:border-primary/30',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50',
                        hasWarnings ? 'border-warning/30' : 'border-border'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            hasWarnings ? 'bg-warning/10' : 'bg-primary/10'
                          )}
                        >
                          {test.photo_url ? (
                            <Camera
                              className={cn(
                                'w-5 h-5',
                                hasWarnings ? 'text-warning' : 'text-primary'
                              )}
                            />
                          ) : (
                            <Droplets
                              className={cn(
                                'w-5 h-5',
                                hasWarnings ? 'text-warning' : 'text-primary'
                              )}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatRelativeTime(test.test_date)}
                            </span>
                            {test.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {test.confidence}
                              </Badge>
                            )}
                          </div>

                          {/* Parameter summary */}
                          <div className="flex flex-wrap gap-1.5">
                            {test.test_parameters?.slice(0, 4).map((param) => (
                              <span
                                key={param.id}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs',
                                  param.status === 'critical'
                                    ? 'bg-destructive/10 text-destructive'
                                    : param.status === 'warning'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                <span className="font-medium">{param.parameter_name}:</span>
                                <span>{formatParameter(param.value, param.unit, units)}</span>
                              </span>
                            ))}
                            {test.test_parameters?.length > 4 && (
                              <span className="text-xs text-muted-foreground px-2 py-0.5">
                                +{test.test_parameters.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {test.tags && test.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {test.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Status indicator */}
                        <div className="flex-shrink-0">
                          {criticalCount > 0 ? (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          ) : hasWarnings ? (
                            <AlertTriangle className="w-5 h-5 text-warning" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
