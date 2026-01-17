import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Minus, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CellAlignment = 'left' | 'center' | 'right';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
  initialRows?: number;
  initialCols?: number;
}

export default function TableEditorModal({
  isOpen,
  onClose,
  onInsert,
  initialRows = 3,
  initialCols = 3,
}: TableEditorModalProps) {
  const [hasHeader, setHasHeader] = useState(true);
  const [cells, setCells] = useState<string[][]>([]);
  const [alignments, setAlignments] = useState<CellAlignment[]>([]);

  // Initialize cells when modal opens
  useEffect(() => {
    if (isOpen) {
      const newCells = Array(initialRows)
        .fill(null)
        .map(() => Array(initialCols).fill(''));
      setCells(newCells);
      setAlignments(Array(initialCols).fill('left'));
    }
  }, [isOpen, initialRows, initialCols]);

  const rows = cells.length;
  const cols = cells[0]?.length || 0;

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newCells = cells.map((row, ri) =>
      row.map((cell, ci) => (ri === rowIndex && ci === colIndex ? value : cell))
    );
    setCells(newCells);
  };

  const addRow = () => {
    if (rows >= 20) return;
    setCells([...cells, Array(cols).fill('')]);
  };

  const removeRow = (rowIndex: number) => {
    if (rows <= 1) return;
    setCells(cells.filter((_, i) => i !== rowIndex));
  };

  const addColumn = () => {
    if (cols >= 10) return;
    setCells(cells.map((row) => [...row, '']));
    setAlignments([...alignments, 'left']);
  };

  const removeColumn = (colIndex: number) => {
    if (cols <= 1) return;
    setCells(cells.map((row) => row.filter((_, i) => i !== colIndex)));
    setAlignments(alignments.filter((_, i) => i !== colIndex));
  };

  const setColumnAlignment = (colIndex: number, alignment: CellAlignment) => {
    const newAlignments = [...alignments];
    newAlignments[colIndex] = alignment;
    setAlignments(newAlignments);
  };

  const generateMarkdown = (): string => {
    if (rows === 0 || cols === 0) return '';

    const lines: string[] = [];
    const startRow = hasHeader ? 1 : 0;

    // Header row
    if (hasHeader && rows > 0) {
      const headerCells = cells[0].map((cell) => cell || 'Header');
      lines.push('| ' + headerCells.join(' | ') + ' |');
    } else {
      // Create placeholder headers
      const headers = Array(cols)
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
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsert(markdown);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="hasHeader"
                  checked={hasHeader}
                  onCheckedChange={setHasHeader}
                />
                <Label htmlFor="hasHeader" className="text-sm">
                  First row is header
                </Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
                disabled={cols >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={rows >= 20}
              >
                <Plus className="h-4 w-4 mr-1" />
                Row
              </Button>
            </div>
          </div>

          {/* Table Editor */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Column alignment controls */}
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-1 w-10"></th>
                  {Array(cols)
                    .fill(null)
                    .map((_, colIndex) => (
                      <th key={colIndex} className="p-2 min-w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant={alignments[colIndex] === 'left' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setColumnAlignment(colIndex, 'left')}
                          >
                            <AlignLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={alignments[colIndex] === 'center' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setColumnAlignment(colIndex, 'center')}
                          >
                            <AlignCenter className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={alignments[colIndex] === 'right' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setColumnAlignment(colIndex, 'right')}
                          >
                            <AlignRight className="h-3 w-3" />
                          </Button>
                          {cols > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeColumn(colIndex)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      hasHeader && rowIndex === 0 && 'bg-muted/30'
                    )}
                  >
                    <td className="p-1 text-center">
                      {rows > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeRow(rowIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="p-1">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          placeholder={
                            hasHeader && rowIndex === 0
                              ? `Header ${colIndex + 1}`
                              : `Cell ${rowIndex + 1},${colIndex + 1}`
                          }
                          className={cn(
                            'min-w-[100px]',
                            hasHeader && rowIndex === 0 && 'font-semibold'
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Markdown Preview
            </Label>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
              {generateMarkdown() || 'No table content yet'}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
