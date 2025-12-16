/**
 * Training Data Export Utilities
 * 
 * Formatters for exporting AI training data in various formats.
 */

import type { TrainingDataEntry } from '@/infrastructure/queries/feedback';

export interface TrainingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface JSONLEntry {
  messages: TrainingMessage[];
  rating: string;
  feature: string;
  feedback_text?: string;
  timestamp: string;
}

/**
 * Export training data as JSONL format (OpenAI fine-tuning compatible)
 */
export function exportAsJSONL(data: TrainingDataEntry[]): string {
  const lines = data
    .filter(entry => entry.user_message && entry.assistant_message)
    .map(entry => {
      const jsonlEntry: JSONLEntry = {
        messages: [
          { role: 'user', content: entry.user_message! },
          { role: 'assistant', content: entry.assistant_message! }
        ],
        rating: entry.rating,
        feature: entry.feature,
        timestamp: entry.created_at
      };
      
      if (entry.feedback_text) {
        jsonlEntry.feedback_text = entry.feedback_text;
      }
      
      return JSON.stringify(jsonlEntry);
    });

  return lines.join('\n');
}

/**
 * Export training data as CSV format
 */
export function exportAsCSV(data: TrainingDataEntry[]): string {
  const headers = [
    'timestamp',
    'feature',
    'rating',
    'user_message',
    'assistant_message',
    'feedback_text',
    'context'
  ];

  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(entry => [
    entry.created_at,
    entry.feature,
    entry.rating,
    escapeCSV(entry.user_message),
    escapeCSV(entry.assistant_message),
    escapeCSV(entry.feedback_text),
    escapeCSV(entry.context ? JSON.stringify(entry.context) : null)
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Download file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export training data with specified format
 */
export function exportTrainingData(
  data: TrainingDataEntry[],
  format: 'jsonl' | 'csv',
  options?: { filenamePrefix?: string }
) {
  const timestamp = new Date().toISOString().split('T')[0];
  const prefix = options?.filenamePrefix || 'training-data';
  
  if (format === 'jsonl') {
    const content = exportAsJSONL(data);
    downloadFile(content, `${prefix}-${timestamp}.jsonl`, 'application/json');
  } else {
    const content = exportAsCSV(data);
    downloadFile(content, `${prefix}-${timestamp}.csv`, 'text/csv');
  }
}
