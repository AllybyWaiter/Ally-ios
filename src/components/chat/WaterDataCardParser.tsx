import { memo, useMemo } from "react";
import { DataCard, DataCardPayload } from "./DataCard";

interface WaterDataCardParserProps {
  content: string;
  aquariumName?: string;
}

// Common parameter patterns to detect in AI responses
// More flexible patterns to catch various AI response formats
const PARAMETER_PATTERNS: Record<string, { regex: RegExp; unit: string }> = {
  'pH': { regex: /pH[:\s]+(\d+\.?\d*)|pH\s+(?:is|at|of)\s+(\d+\.?\d*)|(\d+\.?\d*)\s*pH/i, unit: '' },
  'Ammonia': { regex: /ammonia[:\s]+(\d+\.?\d*)|ammonia\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Nitrite': { regex: /nitrite[:\s]+(\d+\.?\d*)|nitrite\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Nitrate': { regex: /nitrate[:\s]+(\d+\.?\d*)|nitrate\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Alkalinity': { regex: /alkalinity[:\s]+(\d+\.?\d*)|alkalinity\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:dKH)?/i, unit: 'dKH' },
  'Calcium': { regex: /calcium[:\s]+(\d+\.?\d*)|calcium\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Magnesium': { regex: /magnesium[:\s]+(\d+\.?\d*)|magnesium\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Salinity': { regex: /salinity[:\s]+(\d+\.?\d*)|salinity\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:SG|ppt)?/i, unit: 'SG' },
  'Temperature': { regex: /temperature[:\s]+(\d+\.?\d*)|temperature\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:°?F)?/i, unit: '°F' },
  'Phosphate': { regex: /phosphate[:\s]+(\d+\.?\d*)|phosphate\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
  'Free Chlorine': { regex: /(?:free\s+)?chlorine[:\s]+(\d+\.?\d*)|chlorine\s+(?:is|at|of)\s+(\d+\.?\d*)\s*(?:ppm)?/i, unit: 'ppm' },
};

// Status keywords to detect
const STATUS_PATTERNS = {
  good: /\(good\)|\bgood\b|✓|healthy|stable|normal|optimal/i,
  warning: /\(warning\)|⚠|warning|elevated|high|low|attention|monitor/i,
  critical: /\(critical\)|🔴|critical|dangerous|toxic|lethal/i,
};

function getStatusFromContext(text: string, paramName: string): 'good' | 'warning' | 'critical' {
  // Look for status indicators near the parameter name
  const paramIndex = text.toLowerCase().indexOf(paramName.toLowerCase());
  if (paramIndex === -1) return 'good';

  // Check 50 chars before and after the parameter
  const context = text.slice(Math.max(0, paramIndex - 30), paramIndex + 50).toLowerCase();

  if (STATUS_PATTERNS.critical.test(context)) return 'critical';
  if (STATUS_PATTERNS.warning.test(context)) return 'warning';
  return 'good';
}

function parseParametersFromContent(content: string): DataCardPayload['parameters'] {
  const params: DataCardPayload['parameters'] = [];

  for (const [name, { regex, unit }] of Object.entries(PARAMETER_PATTERNS)) {
    const match = content.match(regex);
    if (match) {
      // Find the first non-null capture group (handles alternation patterns)
      const valueStr = match[1] || match[2] || match[3];
      if (valueStr) {
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          params.push({
            name,
            value,
            unit,
            status: getStatusFromContext(content, name),
          });
        }
      }
    }
  }

  return params;
}

function shouldShowDataCard(content: string, params: DataCardPayload['parameters']): boolean {
  // Show card if we found 2+ parameters
  if (params.length >= 2) return true;

  // Or if the content explicitly talks about water tests/parameters with at least 1 param
  const waterTestKeywords = /water test|parameters|test results|readings|levels|tank.*doing|how.*tank|status|health/i;
  if (waterTestKeywords.test(content) && params.length >= 1) return true;

  return false;
}

export const WaterDataCardParser = memo(({ content, aquariumName }: WaterDataCardParserProps) => {
  const cardData = useMemo(() => {
    const params = parseParametersFromContent(content);

    if (!shouldShowDataCard(content, params)) {
      return null;
    }

    return {
      card_type: 'latest_test' as const,
      title: 'Water Parameters',
      aquarium_name: aquariumName || 'Your Tank',
      timestamp: new Date().toISOString(),
      parameters: params,
    };
  }, [content, aquariumName]);

  if (!cardData) return null;

  return (
    <div className="my-3 not-prose">
      <DataCard card={cardData} />
    </div>
  );
});

WaterDataCardParser.displayName = "WaterDataCardParser";
