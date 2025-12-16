# Ally Architecture Overview

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + Shadcn/UI |
| State Management | React Query (TanStack Query) + React Context |
| Backend | Supabase (Lovable Cloud) |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI Integration | Lovable AI Gateway (Gemini, GPT models) |
| Error Tracking | Sentry |
| PWA | vite-plugin-pwa with Workbox |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages (src/pages/)                                             │
│  └── Dashboard, AquariumDetail, AllyChat, WaterTests, etc.     │
├─────────────────────────────────────────────────────────────────┤
│  Components (src/components/)                                   │
│  └── Feature-grouped UI components with error boundaries       │
├─────────────────────────────────────────────────────────────────┤
│  Hooks (src/hooks/)              │  Contexts (src/contexts/)   │
│  └── useAuth, usePlanLimits,     │  └── AuthContext,           │
│      useFeatureRateLimit, etc.   │      ProfileContext,        │
│                                  │      PermissionsContext     │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer (src/infrastructure/queries/)               │
│  └── aquariums.ts, waterTests.ts, tasks.ts, equipment.ts, etc. │
├─────────────────────────────────────────────────────────────────┤
│  Query Management (src/lib/)                                    │
│  └── queryKeys.ts, queryConfig.ts                              │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Client (src/integrations/supabase/client.ts)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Supabase)                           │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions (supabase/functions/)                           │
│  ├── ally-chat/ (modular: tools/, context/, prompts/)          │
│  ├── analyze-water-test-photo/                                  │
│  ├── suggest-maintenance-tasks/                                 │
│  └── _shared/ (cors, validation, logging, rate limiting)       │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL with RLS)                                 │
│  └── aquariums, water_tests, livestock, equipment, etc.        │
├─────────────────────────────────────────────────────────────────┤
│  Auth (Supabase Auth)                                           │
│  └── Email/password, password reset, session management        │
├─────────────────────────────────────────────────────────────────┤
│  Storage (Supabase Storage)                                     │
│  └── Water test photos, user uploads                           │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/
│   ├── aquarium/          # Aquarium-specific components
│   ├── admin/             # Admin panel components
│   ├── chat/              # Chat-related components
│   ├── dashboard/         # Dashboard components
│   ├── error-boundaries/  # Feature-specific error boundaries
│   ├── settings/          # Settings components
│   ├── ui/                # Shadcn/UI base components
│   └── water-tests/       # Water test components
│       └── hooks/         # Water test specific hooks
├── contexts/
│   ├── AuthContext.tsx    # Core authentication state
│   ├── ProfileContext.tsx # User profile and preferences
│   ├── PermissionsContext.tsx # Roles and permissions
│   └── index.tsx          # AppProviders wrapper
├── hooks/
│   ├── useAuth.tsx        # Combined auth hook (backward compat)
│   ├── usePlanLimits.tsx  # Subscription tier limits
│   ├── useHasRole.tsx     # Role checking
│   └── ...
├── infrastructure/
│   └── queries/           # Data Access Layer
│       ├── aquariums.ts
│       ├── waterTests.ts
│       ├── tasks.ts
│       ├── equipment.ts
│       ├── livestock.ts
│       ├── plants.ts
│       └── index.ts
├── lib/
│   ├── queryKeys.ts       # Query key factory
│   ├── queryConfig.ts     # React Query configuration
│   ├── sentry.ts          # Error tracking
│   ├── formatters.ts      # Value formatting utilities
│   ├── unitConversions.ts # Unit conversion utilities
│   └── utils.ts           # General utilities
├── pages/                 # Route-level components
├── i18n/                  # Internationalization
│   └── locales/           # Translation files
└── test/                  # Test utilities and setup

supabase/
├── functions/
│   ├── _shared/           # Shared edge function utilities
│   │   ├── cors.ts
│   │   ├── validation.ts
│   │   ├── rateLimit.ts
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   └── mod.ts
│   ├── ally-chat/         # Modular AI chat function
│   │   ├── tools/
│   │   ├── context/
│   │   ├── prompts/
│   │   └── index.ts
│   └── ...
└── config.toml            # Supabase configuration
```

## Layer Responsibilities

### Pages Layer
- Route-level components that compose features
- Handle URL parameters and navigation
- Wrap content with appropriate error boundaries
- Manage page-level loading states

### Components Layer
- Feature-grouped reusable UI components
- Use design system tokens from Tailwind config
- Memoized where appropriate for performance
- Wrapped with SectionErrorBoundary for isolated errors

### Hooks Layer
- Custom React hooks for shared logic
- useAuth provides combined auth/profile/permissions access
- Feature-specific hooks (usePlanLimits, useFeatureRateLimit)
- Form management hooks (useWaterTestForm, usePhotoAnalysis)

### Contexts Layer
- **AuthContext**: Core authentication state (user, session, loading)
- **ProfileContext**: User profile data, preferences, onboarding state
- **PermissionsContext**: Roles (admin, super_admin) and permissions

### Data Access Layer (DAL)
- Centralized Supabase CRUD operations
- All database calls go through DAL functions
- Consistent error handling
- Easy to test and mock

### Query Management
- **queryKeys**: Factory functions for consistent cache keys
- **queryConfig**: staleTime/gcTime presets by data type

## Data Flow

### Authentication Flow
```
User Login → Supabase Auth → onAuthStateChange → AuthContext
    → ProfileContext (fetch profile) → PermissionsContext (fetch roles)
    → App ready, redirect to Dashboard
```

### Water Test Flow
```
User uploads photo → analyze-water-test-photo edge function
    → Gemini Vision API → Extract parameters → Return to form
    → User confirms/corrects → Save to water_tests table
    → photo_analysis_corrections tracks any corrections
```

### Ally Chat Flow
```
User message → ally-chat edge function
    → Build context (aquarium data, user memories, equipment)
    → System prompt with domain knowledge
    → GPT/Gemini API with tool calling
    → Stream response back to client
    → Save to chat_messages table
```

## State Management Strategy

### React Query (Server State)
- All Supabase data fetching
- Caching with configurable staleTime
- Optimistic updates for mutations
- Query invalidation via queryKeys factory

### React Context (Client State)
- Authentication state
- User preferences (theme, language, units)
- Permissions and roles

### Local State
- Form inputs
- UI state (modals, tabs, filters)
- Temporary selections

## PWA Architecture

- **Service Worker**: Workbox with NetworkFirst for JS, CacheFirst for assets
- **Offline Support**: Fallback page for offline state
- **iOS PWA**: Special handling for auth recovery on visibility change
- **Install Prompt**: Custom banner for mobile users

## Security Model

- **Row Level Security (RLS)**: All tables protected by user_id policies
- **Rate Limiting**: Server-side rate limiting on edge functions
- **Input Validation**: Zod schemas on all edge function inputs
- **Auth Checks**: Supabase auth.uid() verified in RLS policies
