import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetBridgePlugin {
  updateWidgetData(options: { data: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

interface WidgetParameter {
  name: string;
  value: number;
  unit: string;
  status: string;
}

interface WidgetTask {
  name: string;
  dueDate: string;
  taskType: string;
  isOverdue: boolean;
}

interface WidgetAquarium {
  id: string;
  name: string;
  type: string;
  healthStatus: string;
  daysSinceTest: number | null;
  keyParameters: WidgetParameter[];
  nextTask: WidgetTask | null;
  livestockCount: number;
}

interface WidgetData {
  updatedAt: string;
  aquariums: WidgetAquarium[];
}

export async function pushWidgetData(widgetData: WidgetData): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await WidgetBridge.updateWidgetData({ data: JSON.stringify(widgetData) });
  } catch (error) {
    // Widget bridge may not be available on older iOS or during development
    console.warn('Widget bridge update failed:', error);
  }
}

/**
 * Build widget data from dashboard aquariums and related data.
 * This is a lightweight transform — heavy queries should NOT be added here.
 */
export function buildWidgetData(
  aquariums: Array<{
    id: string;
    name: string;
    type: string;
    status: string | null;
  }>,
  extras?: {
    waterTests?: Record<string, { testDate: string; parameters: WidgetParameter[] }>;
    tasks?: Record<string, { name: string; dueDate: string; taskType: string; isOverdue: boolean }>;
    livestockCounts?: Record<string, number>;
  }
): WidgetData {
  const now = new Date();

  const widgetAquariums: WidgetAquarium[] = aquariums.map((aq) => {
    const testInfo = extras?.waterTests?.[aq.id];
    const nextTask = extras?.tasks?.[aq.id] ?? null;
    const livestockCount = extras?.livestockCounts?.[aq.id] ?? 0;

    let daysSinceTest: number | null = null;
    if (testInfo?.testDate) {
      const testDate = new Date(testInfo.testDate);
      daysSinceTest = Math.floor((now.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const keyParameters = testInfo?.parameters?.slice(0, 4) ?? [];

    // Use aquarium's own status as primary source (computed from ALL parameters),
    // fall back to deriving from the top 4 widget parameters
    let healthStatus = aq.status || 'unknown';
    if (healthStatus === 'unknown' && keyParameters.length > 0) {
      const hasCritical = keyParameters.some((p) => p.status === 'critical');
      const hasWarning = keyParameters.some((p) => p.status === 'warning');
      if (hasCritical) healthStatus = 'critical';
      else if (hasWarning) healthStatus = 'warning';
      else healthStatus = 'good';
    }

    return {
      id: aq.id,
      name: aq.name,
      type: aq.type,
      healthStatus,
      daysSinceTest,
      keyParameters,
      nextTask,
      livestockCount,
    };
  });

  return {
    updatedAt: now.toISOString(),
    aquariums: widgetAquariums,
  };
}
