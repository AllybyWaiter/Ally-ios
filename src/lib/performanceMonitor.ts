import { addBreadcrumb, FeatureArea, logError, ErrorSeverity } from './sentry';

interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  type: string;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            addBreadcrumb(
              `Long task detected: ${entry.duration.toFixed(2)}ms`,
              'performance',
              {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              },
              FeatureArea.GENERAL
            );

          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch {
      // Long task observer not supported
    }

    // Monitor layout shifts (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (clsEntry.value && clsEntry.value > 0.1) {
            addBreadcrumb(
              `Layout shift detected: ${clsEntry.value.toFixed(4)}`,
              'performance',
              {
                value: clsEntry.value,
                hadRecentInput: clsEntry.hadRecentInput,
              },
              FeatureArea.GENERAL
            );
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      // Layout shift observer not supported
    }

    // Monitor largest contentful paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length === 0) return;
        const lastEntry = entries[entries.length - 1];
        const lcpEntry = lastEntry as PerformanceEntry & {
          renderTime?: number;
          url?: string;
          element?: { tagName?: string };
        };

        if (lcpEntry.renderTime) {
          addBreadcrumb(
            `LCP: ${lcpEntry.renderTime.toFixed(2)}ms`,
            'performance',
            {
              renderTime: lcpEntry.renderTime,
              url: lcpEntry.url,
              element: lcpEntry.element?.tagName,
            },
            FeatureArea.GENERAL
          );
        }

      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch {
      // LCP observer not supported
    }
  }

  startMeasure(name: string) {
    // Clean up old metrics if we have too many (prevent memory leak)
    if (this.metrics.size > 100) {
      const entries = Array.from(this.metrics.entries());
      const now = performance.now();
      // Remove metrics older than 5 minutes (likely orphaned)
      entries.forEach(([key, startTime]) => {
        if (now - startTime > 300000) {
          this.metrics.delete(key);
        }
      });
    }
    
    this.metrics.set(name, performance.now());
    
    addBreadcrumb(
      `Performance measure started: ${name}`,
      'performance',
      { operation: 'start' },
      FeatureArea.GENERAL
    );
  }

  endMeasure(name: string, featureArea?: FeatureAreaType) {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`No start time found for measure: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      startTime,
      endTime: performance.now(),
    };

    addBreadcrumb(
      `Performance measure completed: ${name}`,
      'performance',
      {
        duration: duration.toFixed(2),
        operation: 'end',
      },
      featureArea || FeatureArea.GENERAL
    );

    // Log slow operations to Sentry
    if (duration > 1000) {
      logError(
        new Error(`Slow operation: ${name}`),
        { duration, metric },
        featureArea || FeatureArea.GENERAL,
        ErrorSeverity.LOW
      );
    }

    return metric;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, featureArea?: FeatureAreaType): Promise<T> {
    this.startMeasure(name);
    return fn()
      .then((result) => {
        this.endMeasure(name, featureArea);
        return result;
      })
      .catch((error) => {
        try {
          this.endMeasure(name, featureArea);
        } catch { /* don't mask original error */ }
        throw error;
      });
  }

  getResourceTimings(): ResourceTiming[] {
    if (typeof window === 'undefined') return [];

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      transferSize: resource.transferSize,
      type: resource.initiatorType,
    }));
  }

  getSlowResources(threshold: number = 1000): ResourceTiming[] {
    return this.getResourceTimings().filter((r) => r.duration > threshold);
  }

  getNavigationTiming() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  logNavigationMetrics() {
    const timing = this.getNavigationTiming();
    if (!timing) return;

    addBreadcrumb(
      'Navigation metrics',
      'performance',
      timing,
      FeatureArea.GENERAL
    );

  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Log navigation metrics on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logNavigationMetrics();
    }, 0);
  });
}

// Export for use in components
export const measurePerformance = <T,>(
  name: string,
  fn: () => Promise<T>,
  featureArea?: FeatureAreaType
): Promise<T> => {
  return performanceMonitor.measureAsync(name, fn, featureArea);
};

type FeatureAreaType = typeof FeatureArea[keyof typeof FeatureArea];
