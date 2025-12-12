# AquaDex Coding Patterns

This document describes the established coding patterns and conventions used throughout the AquaDex codebase.

## Table of Contents

1. [Context Pattern](#context-pattern)
2. [Query Key Factory](#query-key-factory)
3. [Data Access Layer](#data-access-layer)
4. [Error Boundaries](#error-boundaries)
5. [Optimistic Updates](#optimistic-updates)
6. [Memoization](#memoization)
7. [iOS PWA Patterns](#ios-pwa-patterns)
8. [Form Patterns](#form-patterns)
9. [Component Structure](#component-structure)

---

## Context Pattern

Authentication, profile, and permissions are split into separate contexts for performance (prevents unnecessary re-renders).

### Using Split Contexts

```typescript
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';

function MyComponent() {
  // Only subscribe to what you need
  const { user, signOut } = useAuthContext();
  const { profile, onboardingCompleted } = useProfileContext();
  const { isAdmin } = usePermissionsContext();
}
```

### Using Combined Hook (Backward Compatible)

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  // Gets everything - use when you need multiple pieces
  const { user, profile, isAdmin, signOut } = useAuth();
}
```

---

## Query Key Factory

All React Query keys use the factory in `src/lib/queryKeys.ts` for consistency and type safety.

### Basic Usage

```typescript
import { queryKeys } from '@/lib/queryKeys';

// List queries
useQuery({
  queryKey: queryKeys.aquariums.list(userId),
  queryFn: () => fetchAquariums(userId),
});

// Detail queries
useQuery({
  queryKey: queryKeys.aquariums.detail(aquariumId),
  queryFn: () => fetchAquarium(aquariumId),
});

// Nested queries
useQuery({
  queryKey: queryKeys.waterTests.forAquarium(aquariumId),
  queryFn: () => fetchWaterTests(aquariumId),
});
```

### Cache Invalidation

```typescript
import { queryKeys } from '@/lib/queryKeys';

// Invalidate all aquarium queries
queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.all });

// Invalidate specific aquarium
queryClient.invalidateQueries({ 
  queryKey: queryKeys.aquariums.detail(aquariumId) 
});

// Invalidate water tests for an aquarium
queryClient.invalidateQueries({ 
  queryKey: queryKeys.waterTests.forAquarium(aquariumId) 
});
```

### Query Key Structure

```typescript
// Factory pattern - returns arrays for React Query
export const queryKeys = {
  aquariums: {
    all: ['aquariums'] as const,
    list: (userId: string) => ['aquariums', 'list', userId] as const,
    detail: (id: string) => ['aquariums', 'detail', id] as const,
  },
  waterTests: {
    all: ['waterTests'] as const,
    forAquarium: (aquariumId: string) => ['waterTests', 'aquarium', aquariumId] as const,
    latest: (aquariumId: string) => ['waterTests', 'latest', aquariumId] as const,
  },
  // ... more domains
};
```

---

## Data Access Layer

All Supabase calls go through the DAL in `src/infrastructure/queries/`.

### Using DAL Functions

```typescript
import { 
  fetchAquariums, 
  createAquarium, 
  updateAquarium, 
  deleteAquarium 
} from '@/infrastructure/queries';

// In a component
const { data: aquariums } = useQuery({
  queryKey: queryKeys.aquariums.list(userId),
  queryFn: () => fetchAquariums(userId),
});

// In a mutation
const mutation = useMutation({
  mutationFn: (data: CreateAquariumData) => createAquarium(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.aquariums.all });
  },
});
```

### DAL Function Structure

```typescript
// src/infrastructure/queries/aquariums.ts
import { supabase } from '@/integrations/supabase/client';

export async function fetchAquariums(userId: string) {
  const { data, error } = await supabase
    .from('aquariums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createAquarium(data: CreateAquariumData) {
  const { data: result, error } = await supabase
    .from('aquariums')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}
```

---

## Error Boundaries

Use feature-specific error boundaries for isolated error handling.

### Page-Level Boundaries

```typescript
import { PageErrorBoundary } from '@/components/PageErrorBoundary';

// In App.tsx routes
<Route 
  path="/dashboard" 
  element={
    <PageErrorBoundary>
      <Dashboard />
    </PageErrorBoundary>
  } 
/>
```

### Section-Level Boundaries

```typescript
import { SectionErrorBoundary } from '@/components/error-boundaries';

function AquariumDetail() {
  return (
    <div>
      <SectionErrorBoundary fallbackTitle="Failed to load equipment">
        <EquipmentList aquariumId={id} />
      </SectionErrorBoundary>
      
      <SectionErrorBoundary fallbackTitle="Failed to load livestock">
        <LivestockList aquariumId={id} />
      </SectionErrorBoundary>
    </div>
  );
}
```

### Feature-Specific Fallbacks

```typescript
import { FeatureErrorBoundary } from '@/components/error-boundaries';
import { FeatureArea } from '@/lib/sentry';

// Automatically shows appropriate fallback UI
<FeatureErrorBoundary featureArea={FeatureArea.CHAT}>
  <AllyChat />
</FeatureErrorBoundary>
```

---

## Optimistic Updates

Use optimistic updates for instant UI feedback on mutations.

### Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

function useDeleteTask(aquariumId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    
    onMutate: async (taskId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.tasks.forAquarium(aquariumId) 
      });

      // Snapshot current data
      const previous = queryClient.getQueryData(
        queryKeys.tasks.forAquarium(aquariumId)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.tasks.forAquarium(aquariumId),
        (old: Task[] | undefined) => old?.filter(t => t.id !== taskId)
      );

      // Return snapshot for rollback
      return { previous };
    },

    onError: (err, taskId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.tasks.forAquarium(aquariumId),
          context.previous
        );
      }
      toast.error('Failed to delete task');
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.forAquarium(aquariumId) 
      });
    },
  });
}
```

---

## Memoization

Use React.memo and useCallback to prevent unnecessary re-renders.

### Memoized Components

```typescript
import { memo } from 'react';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = memo(function TaskCard({ 
  task, 
  onComplete, 
  onDelete 
}: TaskCardProps) {
  return (
    <Card>
      <CardContent>
        <p>{task.task_name}</p>
        <Button onClick={() => onComplete(task.id)}>Complete</Button>
        <Button onClick={() => onDelete(task.id)}>Delete</Button>
      </CardContent>
    </Card>
  );
});
```

### Stable Callbacks in Parent

```typescript
import { useCallback } from 'react';

function TaskList({ aquariumId }: { aquariumId: string }) {
  const deleteMutation = useDeleteTask(aquariumId);
  const completeMutation = useCompleteTask(aquariumId);

  // Stable callback references
  const handleComplete = useCallback((id: string) => {
    completeMutation.mutate(id);
  }, [completeMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### Memoized Computed Values

```typescript
import { useMemo } from 'react';

function WaterTestCharts({ tests }: { tests: WaterTest[] }) {
  // Memoize expensive computations
  const availableParameters = useMemo(() => {
    const params = new Set<string>();
    tests.forEach(test => {
      test.parameters?.forEach(p => params.add(p.parameter_name));
    });
    return Array.from(params);
  }, [tests]);

  const chartData = useMemo(() => {
    return processTestsForChart(tests);
  }, [tests]);

  return <Chart data={chartData} parameters={availableParameters} />;
}
```

---

## iOS PWA Patterns

Special patterns required for iOS Progressive Web App stability.

### Auth Recovery on Visibility Change

```typescript
// In useAuth or AuthContext
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && !isInitialAuthComplete) {
      // Re-check auth session when app returns to foreground
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [isInitialAuthComplete]);
```

### Safe Area Insets

```css
/* In index.css */
.pt-safe {
  padding-top: env(safe-area-inset-top);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

```typescript
// In components
<header className="pt-safe">
  {/* Header content */}
</header>

<footer className="pb-safe">
  {/* Footer content */}
</footer>
```

### Avoid Stale Closures in Timeouts

```typescript
// ❌ Bad - closure may have stale user value
setTimeout(() => {
  loadAquariums(user?.id);
}, 1000);

// ✅ Good - pass value explicitly
const userId = user?.id;
if (userId) {
  setTimeout(() => {
    loadAquariums(userId);
  }, 1000);
}
```

---

## Form Patterns

### React Hook Form with Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  volume: z.number().min(1).max(10000).optional(),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = (data: FormData) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

---

## Component Structure

### Standard Component Template

```typescript
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyComponentProps {
  title: string;
  items: Item[];
  onItemClick: (id: string) => void;
}

export const MyComponent = memo(function MyComponent({
  title,
  items,
  onItemClick,
}: MyComponentProps) {
  // Hooks at the top
  const { user } = useAuth();

  // Early returns for loading/empty states
  if (!items.length) {
    return <EmptyState message="No items found" />;
  }

  // Main render
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            onClick={() => onItemClick(item.id)} 
          />
        ))}
      </CardContent>
    </Card>
  );
});
```

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `TaskCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useWaterTestForm.ts`)
- Utilities: `camelCase.ts` (e.g., `formatters.ts`)
- Types: Inline or `types.ts` in feature folder
- Tests: `*.test.ts` or `*.test.tsx`
