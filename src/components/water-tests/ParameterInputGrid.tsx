import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { validateParameter, type ParameterTemplate } from '@/lib/waterTestUtils';
import { formatDecimal } from '@/lib/formatters';
import { fahrenheitToCelsius, getTemperatureUnit, UnitSystem } from '@/lib/unitConversions';

interface ParameterInputGridProps {
  template: ParameterTemplate;
  parameters: Record<string, string>;
  onParameterChange: (name: string, value: string) => void;
  aquariumType: string;
  units: UnitSystem;
}

export function ParameterInputGrid({
  template,
  parameters,
  onParameterChange,
  aquariumType,
  units,
}: ParameterInputGridProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{t('waterTests.testParameters')}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {template.parameters.map((param) => {
          const value = parameters[param.name] || '';

          // Display unit based on user preference
          let displayUnit = param.unit;
          let displayMin = param.range.min;
          let displayMax = param.range.max;

          // Convert temperature display if metric and parameter is in Fahrenheit
          if (param.unit === '°F' && units === 'metric') {
            displayUnit = getTemperatureUnit(units);
            displayMin = fahrenheitToCelsius(param.range.min);
            displayMax = fahrenheitToCelsius(param.range.max);
          }

          // For validation, we need to convert input value to storage unit
          // Guard against NaN from empty string or invalid input
          const parsedValue = value ? parseFloat(value) : null;
          let validationValue = (parsedValue !== null && !isNaN(parsedValue)) ? parsedValue : null;
          
          if (validationValue !== null && param.unit === '°F' && units === 'metric') {
            // Convert from Celsius input to Fahrenheit for validation
            validationValue = (validationValue * 9) / 5 + 32;
          }

          const validation = validationValue !== null
            ? validateParameter(param.name, validationValue, aquariumType)
            : null;

          return (
            <div key={param.name} className="space-y-2">
              <Label htmlFor={param.name}>
                {param.name}
                <span className="text-xs text-muted-foreground ml-2">
                  ({displayUnit})
                </span>
              </Label>
              <Input
                id={param.name}
                type="number"
                step="0.01"
                placeholder={`${formatDecimal(displayMin, 1)} - ${formatDecimal(displayMax, 1)}`}
                value={value}
                onChange={(e) => onParameterChange(param.name, e.target.value)}
              />
              {validation && !validation.isValid && (
                <div className="flex items-start gap-2 text-xs text-warning">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{validation.hint}</span>
                </div>
              )}
              {validation && validation.isValid && value && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('waterTests.withinNormalRange')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
