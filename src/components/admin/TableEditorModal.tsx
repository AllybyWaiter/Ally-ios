import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Trash2,
  LayoutTemplate,
  Clipboard,
  Eye,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TABLE_TEMPLATES, 
  TableTemplate, 
  TableStyle, 
  DEFAULT_TABLE_STYLE,

  generateMarkdownTable,
  parseTSV,
  isSpreadsheetContent,
  TableData
} from '@/lib/tableUtils';
import { useToast } from '@/hooks/use-toast';

export type CellAlignment = 'left' | 'center' | 'right';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
  initialRows?: number;
  initialCols?: number;
  initialData?: TableData | null;
}

export default function TableEditorModal({
  isOpen,
  onClose,
  onInsert,
  initialRows = 3,
  initialCols = 3,
  initialData = null,
}: TableEditorModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'editor' | 'templates'>('editor');
  const [hasHeader, setHasHeader] = useState(true);
  const [cells, setCells] = useState<string[][]>([]);
  const [alignments, setAlignments] = useState<CellAlignment[]>([]);
  const [style, setStyle] = useState<TableStyle>(DEFAULT_TABLE_STYLE);
  const [showPreview, setShowPreview] = useState(true);
  const [_focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Initialize cells when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing existing table
        setCells(initialData.cells);
        setAlignments(initialData.alignments);
        setHasHeader(initialData.hasHeader);
        setStyle(initialData.style);
      } else {
        // New table
        const newCells = Array(initialRows)
          .fill(null)
          .map(() => Array(initialCols).fill(''));
        setCells(newCells);
        setAlignments(Array(initialCols).fill('left'));
        setStyle(DEFAULT_TABLE_STYLE);
      }
      setActiveTab('editor');
    }
  }, [isOpen, initialRows, initialCols, initialData]);

  const rows = cells.length;
  const cols = cells[0]?.length || 0;

  const getInputRef = (row: number, col: number) => {
    const key = `${row}-${col}`;
    return inputRefs.current.get(key);
  };

  const setInputRef = (row: number, col: number, el: HTMLInputElement | null) => {
    const key = `${row}-${col}`;
    if (el) {
      inputRefs.current.set(key, el);
    } else {
      inputRefs.current.delete(key);
    }
  };

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

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const navigate = (newRow: number, newCol: number) => {
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        const input = getInputRef(newRow, newCol);
        input?.focus();
        setFocusedCell({ row: newRow, col: newCol });
      }
    };

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Move to previous cell
          if (col > 0) {
            navigate(row, col - 1);
          } else if (row > 0) {
            navigate(row - 1, cols - 1);
          }
        } else {
          // Move to next cell
          if (col < cols - 1) {
            navigate(row, col + 1);
          } else if (row < rows - 1) {
            navigate(row + 1, 0);
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (row < rows - 1) {
          navigate(row + 1, col);
        } else {
          // Optionally add a new row
          addRow();
          requestAnimationFrame(() => navigate(row + 1, col));
        }
        break;
      case 'ArrowUp':
        if (e.altKey) {
          e.preventDefault();
          navigate(row - 1, col);
        }
        break;
      case 'ArrowDown':
        if (e.altKey) {
          e.preventDefault();
          navigate(row + 1, col);
        }
        break;
      case 'ArrowLeft':
        if (e.altKey) {
          e.preventDefault();
          navigate(row, col - 1);
        }
        break;
      case 'ArrowRight':
        if (e.altKey) {
          e.preventDefault();
          navigate(row, col + 1);
        }
        break;
    }
  }, [rows, cols]);

  // Handle paste from spreadsheet
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    
    if (isSpreadsheetContent(text)) {
      e.preventDefault();
      const parsedData = parseTSV(text);
      
      if (parsedData.length > 0) {
        setCells(parsedData);
        setAlignments(Array(parsedData[0].length).fill('left'));
        toast({
          title: 'Table imported',
          description: `Imported ${parsedData.length} rows and ${parsedData[0].length} columns from spreadsheet.`,
        });
      }
    }
  }, [toast]);

  // Apply template
  const applyTemplate = (template: TableTemplate) => {
    setCells([...template.cells]);
    setAlignments([...template.alignments]);
    setHasHeader(template.hasHeader);
    setActiveTab('editor');
    toast({
      title: 'Template applied',
      description: `"${template.name}" template loaded. Customize as needed.`,
    });
  };

  const generateMarkdown = (): string => {
    return generateMarkdownTable({
      cells,
      alignments,
      hasHeader,
      style,
    });
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsert(markdown);
    onClose();
  };

  // Render live preview
  const renderPreview = () => {
    if (rows === 0 || cols === 0) return null;

    const densityClasses = {
      compact: 'px-2 py-1 text-sm',
      normal: 'px-4 py-2',
      spacious: 'px-6 py-3',
    };

    return (
      <div className="overflow-x-auto border rounded-lg">
        <table className={cn(
          'w-full border-collapse',
          style.borderStyle === 'none' && 'border-none'
        )}>
          <thead>
            {hasHeader && cells.length > 0 && (
              <tr>
                {cells[0].map((cell, colIndex) => (
                  <th
                    key={colIndex}
                    className={cn(
                      densityClasses[style.density],
                      'font-semibold',
                      style.borderStyle !== 'none' && 'border border-border',
                      style.headerStyle === 'highlighted' && 'bg-primary/10',
                      style.headerStyle === 'default' && 'bg-muted',
                      style.headerStyle === 'bold-only' && 'bg-transparent',
                    )}
                    style={{ textAlign: alignments[colIndex] }}
                  >
                    {cell || 'Header'}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {(hasHeader ? cells.slice(1) : cells).map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={cn(
                  style.rowStyle === 'striped' && rowIndex % 2 === 1 && 'bg-muted/30'
                )}
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      densityClasses[style.density],
                      style.borderStyle === 'all' && 'border border-border',
                      style.borderStyle === 'header-only' && rowIndex === 0 && 'border-t border-border',
                    )}
                    style={{ textAlign: alignments[colIndex] }}
                  >
                    {cell || ' '}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialData ? 'Edit Table' : 'Insert Table'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'templates')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="editor" className="gap-2">
              <AlignLeft className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 overflow-auto py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TABLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="p-4 border rounded-lg text-left hover:border-primary hover:bg-muted/30 transition-colors"
                >
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          {template.cells[0].map((cell, i) => (
                            <th key={i} className="border border-border bg-muted px-2 py-1 text-left">
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {template.cells.slice(1, 3).map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="border border-border px-2 py-1">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="flex-1 overflow-hidden flex flex-col py-4">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
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
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Row style:</Label>
                  <Button
                    variant={style.rowStyle === 'plain' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setStyle({ ...style, rowStyle: 'plain' })}
                  >
                    Plain
                  </Button>
                  <Button
                    variant={style.rowStyle === 'striped' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setStyle({ ...style, rowStyle: 'striped' })}
                  >
                    Striped
                  </Button>
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

            {/* Paste hint */}
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clipboard className="h-3 w-3" />
              Tip: Paste from Excel or Google Sheets to import data. Use Tab to navigate cells.
            </div>

            {/* Table Editor */}
            <div className="flex-1 overflow-auto" onPaste={handlePaste}>
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
                              ref={(el) => setInputRef(rowIndex, colIndex, el)}
                              value={cell}
                              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                              onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
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
            </div>

            {/* Preview Toggle */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground">Preview</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant={showPreview ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Styled
                  </Button>
                  <Button
                    variant={!showPreview ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Markdown
                  </Button>
                </div>
              </div>
              {showPreview ? (
                renderPreview()
              ) : (
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
                  {generateMarkdown() || 'No table content yet'}
                </pre>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            {initialData ? 'Update Table' : 'Insert Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
