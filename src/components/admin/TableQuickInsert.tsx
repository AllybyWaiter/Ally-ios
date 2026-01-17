import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TableQuickInsertProps {
  onSelect: (rows: number, cols: number) => void;
  maxRows?: number;
  maxCols?: number;
}

export default function TableQuickInsert({ 
  onSelect, 
  maxRows = 6, 
  maxCols = 6 
}: TableQuickInsertProps) {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);

  return (
    <div className="p-3">
      <div className="mb-2 text-sm text-muted-foreground text-center">
        {hoveredRow > 0 && hoveredCol > 0 
          ? `${hoveredRow} × ${hoveredCol} table`
          : 'Select table size'}
      </div>
      <div 
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
        onMouseLeave={() => {
          setHoveredRow(0);
          setHoveredCol(0);
        }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols) + 1;
          const col = (index % maxCols) + 1;
          const isHighlighted = row <= hoveredRow && col <= hoveredCol;
          
          return (
            <div
              key={index}
              className={cn(
                'w-5 h-5 border rounded-sm cursor-pointer transition-colors',
                isHighlighted 
                  ? 'bg-primary border-primary' 
                  : 'bg-muted/50 border-border hover:border-primary/50'
              )}
              onMouseEnter={() => {
                setHoveredRow(row);
                setHoveredCol(col);
              }}
              onClick={() => onSelect(row, col)}
            />
          );
        })}
      </div>
    </div>
  );
}
