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

            // Log as warning if > 100ms
            if (entry.duration > 100) {
              console.warn(`Long task blocking main thread: ${entry.duration.toFixed(2)}ms`);
            }
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.log('Long task observer not supported');
    }

    // Monitor layout shifts (CLS)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any;
          if (clsEntry.value > 0.1) {
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
    } catch (e) {
      console.log('Layout shift observer not supported');
    }

    // Monitor largest contentful paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcpEntry = lastEntry as any;

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

        // Log as warning if > 2.5s
        if (lcpEntry.renderTime > 2500) {
          console.warn(`Slow LCP: ${lcpEntry.renderTime.toFixed(2)}ms`);
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.log('LCP observer not supported');
    }
  }

  startMeasure(name: string) {
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

    // Log warning for slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      
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
        this.endMeasure(name, featureArea);
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

    console.log('Navigation Timing Metrics:', {
      'DNS Lookup': `${timing.dns.toFixed(2)}ms`,
      'TCP Connection': `${timing.tcp.toFixed(2)}ms`,
      'Request Time': `${timing.request.toFixed(2)}ms`,
      'Response Time': `${timing.response.toFixed(2)}ms`,
      'DOM Processing': `${timing.dom.toFixed(2)}ms`,
      'Load Event': `${timing.load.toFixed(2)}ms`,
      'Total Time': `${timing.total.toFixed(2)}ms`,
    });
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
