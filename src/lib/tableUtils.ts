import { CellAlignment } from '@/components/admin/TableEditorModal';

export interface TableData {
  cells: string[][];
  alignments: CellAlignment[];
  hasHeader: boolean;
  style: TableStyle;
}

export interface TableStyle {
  headerStyle: 'default' | 'highlighted' | 'bold-only';
  rowStyle: 'plain' | 'striped';
  borderStyle: 'all' | 'header-only' | 'none';
  density: 'compact' | 'normal' | 'spacious';
}

export const DEFAULT_TABLE_STYLE: TableStyle = {
  headerStyle: 'default',
  rowStyle: 'plain',
  borderStyle: 'all',
  density: 'normal',
};

export interface TableTemplate {
  id: string;
  name: string;
  description: string;
  cells: string[][];
  hasHeader: boolean;
  alignments: CellAlignment[];
}

export const TABLE_TEMPLATES: TableTemplate[] = [
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Compare features side by side',
    hasHeader: true,
    alignments: ['left', 'center', 'center'],
    cells: [
      ['Feature', 'Option A', 'Option B'],
      ['Price', '$10', '$20'],
      ['Support', 'Email', '24/7 Chat'],
      ['Storage', '10GB', '100GB'],
    ],
  },
  {
    id: 'pricing',
    name: 'Pricing',
    description: 'Display pricing tiers',
    hasHeader: true,
    alignments: ['left', 'center', 'center', 'center'],
    cells: [
      ['Feature', 'Basic', 'Pro', 'Enterprise'],
      ['Users', '1', '5', 'Unlimited'],
      ['Storage', '5GB', '50GB', '500GB'],
      ['Price', 'Free', '$9/mo', '$49/mo'],
    ],
  },
  {
    id: 'specs',
    name: 'Specifications',
    description: 'Property and value pairs',
    hasHeader: true,
    alignments: ['left', 'left'],
    cells: [
      ['Property', 'Value'],
      ['Dimensions', '10 x 20 x 5 inches'],
      ['Weight', '2.5 lbs'],
      ['Material', 'Aluminum'],
      ['Color', 'Silver'],
    ],
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Time-based events',
    hasHeader: true,
    alignments: ['center', 'left', 'left'],
    cells: [
      ['Time', 'Event', 'Location'],
      ['9:00 AM', 'Registration', 'Lobby'],
      ['10:00 AM', 'Keynote', 'Main Hall'],
      ['12:00 PM', 'Lunch', 'Cafeteria'],
      ['2:00 PM', 'Workshop', 'Room A'],
    ],
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Task status tracking',
    hasHeader: true,
    alignments: ['left', 'center', 'left'],
    cells: [
      ['Task', 'Status', 'Notes'],
      ['Setup environment', '✓', 'Completed'],
      ['Configure database', '✓', 'Completed'],
      ['Deploy application', '○', 'In progress'],
      ['Run tests', '○', 'Pending'],
    ],
  },
];

/**
 * Parse markdown table back into structured data
 */
export function parseMarkdownTable(markdown: string): TableData | null {
  const lines = markdown.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return null;
  
  // Check if it's a valid markdown table
  const separatorLine = lines[1];
  if (!separatorLine.includes('---')) return null;
  
  // Parse cells
  const parseLine = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1) // Remove empty first and last
      .map(cell => cell.trim());
  };
  
  // Parse alignments from separator
  const parseAlignments = (separator: string): CellAlignment[] => {
    return separator
      .split('|')
      .slice(1, -1)
      .map(cell => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
      });
  };
  
  const headerCells = parseLine(lines[0]);
  const alignments = parseAlignments(lines[1]);
  const dataCells = lines.slice(2).map(parseLine);
  
  return {
    cells: [headerCells, ...dataCells],
    alignments,
    hasHeader: true,
    style: DEFAULT_TABLE_STYLE,
  };
}

/**
 * Generate markdown table from structured data
 */
export function generateMarkdownTable(data: TableData): string {
  const { cells, alignments, hasHeader } = data;
  
  if (cells.length === 0 || cells[0].length === 0) return '';
  
  const lines: string[] = [];

  // Header row
  if (hasHeader && cells.length > 0) {
    const headerCells = cells[0].map((cell) => cell || 'Header');
    lines.push('| ' + headerCells.join(' | ') + ' |');
  } else {
    const headers = Array(cells[0].length)
      .fill(null)
      .map((_, i) => `Column ${i + 1}`);
    lines.push('| ' + headers.join(' | ') + ' |');
  }
  
  // Separator row with alignments
  const separators = alignments.map((align) => {
    switch (align) {
      case 'left':
        return ':---';
      case 'center':
        return ':---:';
      case 'right':
        return '---:';
      default:
        return '---';
    }
  });
  lines.push('| ' + separators.join(' | ') + ' |');
  
  // Data rows
  const dataRows = hasHeader ? cells.slice(1) : cells;
  dataRows.forEach((row) => {
    const rowCells = row.map((cell) => cell || ' ');
    lines.push('| ' + rowCells.join(' | ') + ' |');
  });
  
  return lines.join('\n');
}

/**
 * Parse tab-separated values (from Excel/Google Sheets)
 */
export function parseTSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map(line => line.split('\t').map(cell => cell.trim()));
}

/**
 * Detect if content is likely from a spreadsheet
 */
export function isSpreadsheetContent(text: string): boolean {
  // Contains tabs and multiple lines, likely from spreadsheet
  return text.includes('\t') && text.includes('\n');
}

/**
 * Find markdown table in content around a given position
 */
export function findTableAtPosition(content: string, position: number): { start: number; end: number; markdown: string } | null {
  // Convert content to plain text if it contains HTML
  const plainContent = content.replace(/<[^>]+>/g, '');
  
  // Find all markdown tables in content
  const tableRegex = /\|.+\|[\r\n]+\|[-:| ]+\|[\r\n]+(\|.+\|[\r\n]*)*/g;
  let match;
  
  while ((match = tableRegex.exec(plainContent)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    
    // Check if position is within or near this table
    if (position >= start - 10 && position <= end + 10) {
      return {
        start,
        end,
        markdown: match[0].trim(),
      };
    }
  }
  
  return null;
}
