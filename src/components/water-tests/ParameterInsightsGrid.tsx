import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ParameterCard } from './ParameterCard';
import { UnitSystem } from '@/lib/unitConversions';

interface TestParameter {
  parameter_name: string;
  value: number;
  unit: string;
  status?: string | null;
}

interface WaterTest {
  id: string;
  test_date: string;
  test_parameters?: TestParameter[] | null;
}

interface ParameterInsightsGridProps {
  tests: WaterTest[];
  units: UnitSystem;
  onParameterClick?: (paramName: string) => void;
}

// Priority order for parameters (most critical first)
const PARAMETER_PRIORITY = [
  'Ammonia',
  'pH',
  'Nitrite',
  'Nitrate',
  'Temperature',
  'Free Chlorine',
  'Total Chlorine',
  'Alkalinity',
  'Hardness',
  'Phosphate',
];

export function ParameterInsightsGrid({
  tests,
  units,
  onParameterClick,
}: ParameterInsightsGridProps) {
  const { t } = useTranslation();

  // Get the latest value and trend for each parameter
  const parameterInsights = useMemo(() => {
    if (!tests || tests.length === 0) return [];

    // Group all parameter readings by name
    const paramMap = new Map<string, Array<{ value: number; date: string; status?: string; unit: string }>>();

    tests.forEach((test) => {
      test.test_parameters?.forEach((param) => {
        if (!paramMap.has(param.parameter_name)) {
          paramMap.set(param.parameter_name, []);
        }
        paramMap.get(param.parameter_name)!.push({
          value: param.value,
          date: test.test_date,
          status: param.status,
          unit: param.unit,
        });
      });
    });

    // Convert to array with insights
    const insights = Array.from(paramMap.entries()).map(([name, readings]) => {
      // Sort by date descending - handle invalid dates gracefully
      const getTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const time = d.getTime();
        return isNaN(time) ? 0 : time;
      };
      readings.sort((a, b) => getTime(b.date) - getTime(a.date));

      const latest = readings[0];
      const previous = readings[1];

      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (previous) {
        const diff = latest.value - previous.value;
        const threshold = Math.abs(previous.value * 0.05); // 5% change threshold
        if (diff > threshold) trend = 'up';
        else if (diff < -threshold) trend = 'down';
      }

      // Normalize status to expected values
      const normalizeStatus = (s?: string): 'good' | 'warning' | 'critical' | 'unknown' => {
        if (s === 'good' || s === 'warning' || s === 'critical') return s;
        return 'unknown';
      };

      // Get sparkline data (last 7 readings)
      const sparklineData = readings
        .slice(0, 7)
        .reverse()
        .map((r) => r.value);

      return {
        name,
        value: latest.value,
        unit: latest.unit,
        status: normalizeStatus(latest.status),
        trend,
        lastUpdated: latest.date,
        sparklineData,
        priority: PARAMETER_PRIORITY.indexOf(name),
      };
    });

    // Sort by priority (known parameters first, then alphabetically)
    return insights.sort((a, b) => {
      const aPriority = a.priority === -1 ? 999 : a.priority;
      const bPriority = b.priority === -1 ? 999 : b.priority;
      return aPriority - bPriority;
    });
  }, [tests]);

  if (parameterInsights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('waterTests.noParameterData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('waterTests.currentReadings')}</h3>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        {parameterInsights.map((param, index) => (
          <motion.div
            key={param.name}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ParameterCard
              name={param.name}
              value={param.value}
              unit={param.unit}
              status={param.status}
              trend={param.trend}
              lastUpdated={param.lastUpdated}
              units={units}
              sparklineData={param.sparklineData}
              onClick={() => onParameterClick?.(param.name)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
