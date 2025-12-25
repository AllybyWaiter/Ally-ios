# Testing Guide

This guide covers the testing setup and practices for Ally.

## Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Test Utilities](#test-utilities)
4. [Unit Testing](#unit-testing)
5. [Component Testing](#component-testing)
6. [Testing Patterns](#testing-patterns)
7. [Coverage](#coverage)

---

## Setup

### Dependencies

Testing is configured with:

- **Vitest** - Test runner (Vite-native, fast)
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - Browser environment simulation

### Configuration Files

**`vitest.config.ts`**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**`src/test/setup.ts`**:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));
```

---

## Running Tests

### Commands

```bash
# Watch mode (recommended during development)
npm test

# Single run
npm run test:run

# With UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Test Utilities

### Custom Render Function

Use the custom render from `src/test/test-utils.tsx` to include providers:

```typescript
// src/test/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Usage

```typescript
import { render, screen } from '@/test/test-utils';
import { MyComponent } from './MyComponent';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

---

## Unit Testing

### Testing Pure Functions

```typescript
// src/lib/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatVolume, formatTemperature } from './formatters';

describe('formatVolume', () => {
  it('formats gallons correctly', () => {
    expect(formatVolume(50, 'imperial')).toBe('50 gal');
  });

  it('converts to liters', () => {
    expect(formatVolume(50, 'metric')).toBe('189.3 L');
  });

  it('handles null/undefined', () => {
    expect(formatVolume(null, 'imperial')).toBe('');
    expect(formatVolume(undefined, 'imperial')).toBe('');
  });
});

describe('formatTemperature', () => {
  it('formats Fahrenheit', () => {
    expect(formatTemperature(78, 'imperial')).toBe('78°F');
  });

  it('converts to Celsius', () => {
    expect(formatTemperature(78, 'metric')).toBe('25.6°C');
  });
});
```

### Testing Query Keys

```typescript
// src/lib/queryKeys.test.ts
import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  describe('aquariums', () => {
    it('generates list key with userId', () => {
      expect(queryKeys.aquariums.list('user-123')).toEqual([
        'aquariums', 'list', 'user-123'
      ]);
    });

    it('generates detail key with id', () => {
      expect(queryKeys.aquariums.detail('aquarium-456')).toEqual([
        'aquariums', 'detail', 'aquarium-456'
      ]);
    });
  });
});
```

### Testing Utility Functions

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, formatRelativeTime } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles Tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
```

---

## Component Testing

### Basic Component Test

```typescript
// src/components/MyButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('renders with label', () => {
    render(<MyButton label="Click me" onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<MyButton label="Click me" onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<MyButton label="Submit" onClick={() => {}} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing with User Events

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<ContactForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello world');
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world',
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={() => {}} />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });
});
```

### Testing Async Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { AquariumList } from './AquariumList';

// Mock the data fetching
vi.mock('@/infrastructure/queries', () => ({
  fetchAquariums: vi.fn().mockResolvedValue([
    { id: '1', name: 'Reef Tank', type: 'saltwater' },
    { id: '2', name: 'Planted Tank', type: 'freshwater' },
  ]),
}));

describe('AquariumList', () => {
  it('displays loading state initially', () => {
    render(<AquariumList userId="user-123" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays aquariums after loading', async () => {
    render(<AquariumList userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Reef Tank')).toBeInTheDocument();
      expect(screen.getByText('Planted Tank')).toBeInTheDocument();
    });
  });
});
```

---

## Testing Patterns

### Testing Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlanLimits } from './usePlanLimits';

// Wrap with providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProfileProvider>
    {children}
  </ProfileProvider>
);

describe('usePlanLimits', () => {
  it('returns correct limits for free tier', async () => {
    const { result } = renderHook(() => usePlanLimits(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.maxAquariums).toBe(1);
      expect(result.current.monthlyTestLimit).toBe(5);
    });
  });
});
```

### Mocking Supabase Queries

```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '1', name: 'Test Aquarium' },
        error: null,
      }),
    })),
  },
}));
```

### Testing Error States

```typescript
describe('ErrorComponent', () => {
  it('displays error message', () => {
    render(<ErrorComponent error={new Error('Something went wrong')} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls retry function when button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    
    render(<ErrorComponent error={new Error('Failed')} onRetry={onRetry} />);
    
    await user.click(screen.getByRole('button', { name: /retry/i }));
    
    expect(onRetry).toHaveBeenCalled();
  });
});
```

---

## Coverage

### Coverage Targets

| Area | Target |
|------|--------|
| Utility functions | 80%+ |
| Hooks | 70%+ |
| Components | 60%+ |
| Overall | 60%+ |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/integrations/supabase/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
```

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Use data-testid sparingly** - Prefer accessible queries (role, label, text)
3. **Keep tests isolated** - Each test should be independent
4. **Mock at boundaries** - Mock external services, not internal functions
5. **Test edge cases** - Empty states, loading, errors, boundaries
6. **Write readable tests** - Clear descriptions, meaningful assertions

---

## Guardrails Testing

### Ally Chat Input Gate Tests

The input gate regression tests ensure safety-critical input validation doesn't regress.

**Location**: `src/components/chat/__tests__/inputGate.test.ts`

**Run Tests**:
```bash
npm test -- inputGate
```

### Test Categories

| Category | Scenarios | Purpose |
|----------|-----------|---------|
| Conversation Detection | 5 | Verify pool/spa/aquarium/general intent detection |
| Missing Inputs | 4 | Ensure required inputs are identified correctly |
| Gate Triggering | 3 | Verify gate triggers when 2+ inputs missing |
| Full Validation | 3 | End-to-end validation flow tests |
| AI Behavior Docs | 6 | Document expected AI responses (manual verification) |

### Adding New Guardrail Tests

When adding new safety features to `ally-chat`:

1. **Add detection keywords** to `inputGate.ts`
2. **Create corresponding test** in `inputGate.test.ts`
3. **Document expected AI behavior** in the "Expected AI Behavior" describe block

Example test structure:
```typescript
it('detects new-feature intent from keywords', () => {
  const messages: Message[] = [
    { role: 'user', content: 'User message with keywords' }
  ];
  const result = detectConversationType(messages, 'water-type');
  expect(result).toBe('expected_type');
});
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [React Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
