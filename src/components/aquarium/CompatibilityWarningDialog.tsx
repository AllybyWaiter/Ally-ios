/**
 * Compatibility Warning Dialog
 * 
 * Displays compatibility warnings when adding new fish to a tank.
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import type { CompatibilityResult, CompatibilityWarning, WarningSeverity } from '@/lib/fishCompatibility';

interface CompatibilityWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CompatibilityResult;
  speciesName: string;
  onProceed: () => void;
  onCancel: () => void;
}

function getSeverityIcon(severity: WarningSeverity) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'high':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'medium':
      return <AlertCircle className="h-5 w-5 text-warning" />;
    case 'low':
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

function getSeverityBadge(severity: WarningSeverity) {
  const variants: Record<WarningSeverity, string> = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-blue-500 text-white',
  };
  
  const labels: Record<WarningSeverity, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  
  return (
    <Badge className={variants[severity]}>
      {labels[severity]}
    </Badge>
  );
}

function WarningCard({ warning }: { warning: CompatibilityWarning }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0 mt-0.5">
        {getSeverityIcon(warning.severity)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{warning.title}</span>
          {getSeverityBadge(warning.severity)}
        </div>
        <p className="text-sm text-muted-foreground">
          {warning.message}
        </p>
      </div>
    </div>
  );
}

export function CompatibilityWarningDialog({
  open,
  onOpenChange,
  result,
  speciesName,
  onProceed,
  onCancel,
}: CompatibilityWarningDialogProps) {
  const criticalWarnings = result.warnings.filter(w => w.severity === 'critical');
  const otherWarnings = result.warnings.filter(w => w.severity !== 'critical');
  const hasCritical = criticalWarnings.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Compatibility Concerns for {speciesName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasCritical 
              ? 'Critical issues were found that may result in fish death or injury.'
              : 'Some concerns were found that you should consider before adding this species.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {/* Show critical warnings first */}
          {criticalWarnings.map((warning, index) => (
            <WarningCard key={`critical-${index}`} warning={warning} />
          ))}
          
          {/* Then other warnings */}
          {otherWarnings.map((warning, index) => (
            <WarningCard key={`other-${index}`} warning={warning} />
          ))}
        </div>

        {/* Compatibility Score */}
        <div className="flex items-center justify-between py-3 border-t">
          <span className="text-sm text-muted-foreground">Compatibility Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  result.score >= 70 ? 'bg-success' :
                  result.score >= 40 ? 'bg-warning' : 'bg-destructive'
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              result.score >= 70 ? 'text-success' :
              result.score >= 40 ? 'text-warning' : 'text-destructive'
            }`}>
              {result.score}%
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          {result.canProceed ? (
            <AlertDialogAction onClick={onProceed} className="bg-warning hover:bg-warning/90">
              Add Anyway
            </AlertDialogAction>
          ) : (
            <AlertDialogAction 
              onClick={onProceed} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Add Despite Risks
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
