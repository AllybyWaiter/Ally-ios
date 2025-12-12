# Contributing to AquaDex

Thank you for your interest in contributing to AquaDex! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Architecture Guidelines](#architecture-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 18+ (use nvm for version management)
- npm or bun
- Git

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd aquadex

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

The project uses Lovable Cloud (Supabase) which is automatically configured. No additional environment setup is required for basic development.

---

## Development Setup

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture overview.

Key directories:
- `src/pages/` - Route-level components
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React contexts
- `src/infrastructure/queries/` - Data access layer
- `src/lib/` - Utilities and helpers
- `supabase/functions/` - Edge functions

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Use type inference where obvious

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Avoid
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use `memo` for list items and expensive components
- Keep components focused and small
- Extract logic to custom hooks

```typescript
// ✅ Good
import { memo } from 'react';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, onComplete }: TaskCardProps) {
  return (
    <Card>
      <p>{task.name}</p>
      <Button onClick={() => onComplete(task.id)}>Complete</Button>
    </Card>
  );
});
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `TaskCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- Utilities: `camelCase.ts` (e.g., `formatters.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

### Styling

- Use Tailwind CSS utility classes
- Use semantic design tokens from `index.css`
- Never use hardcoded colors - use theme tokens
- All colors must be HSL format

```typescript
// ✅ Good - uses semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Bad - hardcoded colors
<div className="bg-white text-black border-gray-200">
```

### Imports

- Use absolute imports with `@/` prefix
- Group imports: external, internal, relative
- Sort alphabetically within groups

```typescript
// External
import { memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal (absolute)
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';

// Relative
import { TaskCard } from './TaskCard';
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

### Examples

```bash
feat(water-tests): add photo analysis with AI

fix(dashboard): prevent crash when aquarium is null

docs: update API documentation

refactor(auth): split useAuth into separate contexts

test(formatters): add unit tests for temperature conversion
```

### Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor" not "moves cursor")
- Keep subject line under 50 characters
- Wrap body at 72 characters
- Reference issues in footer

---

## Pull Request Process

### Before Submitting

1. **Update from main**: Ensure your branch is up to date
2. **Run tests**: `npm run test:run`
3. **Check types**: `npm run build` (catches type errors)
4. **Lint code**: `npm run lint`
5. **Test manually**: Verify feature works in browser

### PR Checklist

- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] No TypeScript errors
- [ ] Follows established patterns (see [CODING_PATTERNS.md](docs/CODING_PATTERNS.md))
- [ ] UI changes use design system tokens
- [ ] Edge functions use shared utilities
- [ ] Commits follow guidelines

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Fixes #123
```

### Review Process

1. Submit PR with clear description
2. Automated checks run (lint, tests, build)
3. Request review from maintainers
4. Address review feedback
5. Merge after approval

---

## Architecture Guidelines

### Adding New Features

1. **Plan the data model**: What tables/columns are needed?
2. **Create DAL functions**: Add to `src/infrastructure/queries/`
3. **Add query keys**: Update `src/lib/queryKeys.ts`
4. **Build components**: Small, focused components
5. **Add error boundaries**: Wrap sections appropriately
6. **Write tests**: Unit tests for utilities, component tests for UI

### Edge Function Guidelines

1. Use shared utilities from `_shared/`
2. Add input validation with Zod
3. Implement rate limiting
4. Use structured logging
5. Handle errors consistently

See [docs/EDGE_FUNCTIONS.md](docs/EDGE_FUNCTIONS.md) for details.

### Performance Considerations

1. Use `memo` for list item components
2. Use `useCallback` for stable handler references
3. Use `useMemo` for expensive computations
4. Use optimistic updates for mutations
5. Consider virtualization for long lists

### Security Considerations

1. Validate all user inputs
2. Use RLS policies on all tables
3. Never expose secrets in frontend
4. Rate limit API-intensive operations
5. Sanitize content before rendering

---

## Need Help?

- Check existing documentation in `/docs`
- Review similar code in the codebase
- Ask in project discussions

Thank you for contributing!
