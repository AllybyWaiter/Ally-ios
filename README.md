# Ally - Smart Aquatic Space Management

Ally is a comprehensive aquatic space management application featuring AI-powered assistance, water test tracking, maintenance scheduling, and more. Manage aquariums, pools, spas, and ponds with ease.

## Features

- 🐠 **Aquatic Space Management** - Track multiple tanks, pools, and spas with livestock, plants, and equipment
- 💧 **Water Testing** - Log parameters manually or via AI photo analysis
- 🤖 **Ally AI Chat** - Get personalized aquatic care advice with memory
- 📅 **Task Calendar** - Schedule and track maintenance tasks
- 📊 **Analytics** - Visualize water parameters over time
- 📱 **PWA Support** - Install as a native-like app on mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/UI
- **State**: React Query (TanStack Query), React Context
- **Backend**: Supabase (Lovable Cloud)
- **AI**: Gemini, GPT models via Lovable AI Gateway
- **Error Tracking**: Sentry

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # UI components by feature
│   ├── ui/              # Shadcn/UI base components
│   ├── aquarium/        # Aquarium-specific components
│   ├── dashboard/       # Dashboard components
│   ├── water-tests/     # Water test components
│   └── error-boundaries/# Error handling components
├── contexts/            # React contexts (Auth, Profile, Permissions)
├── hooks/               # Custom React hooks
├── infrastructure/      # Data access layer
│   └── queries/         # Supabase CRUD operations
├── lib/                 # Utilities (queryKeys, formatters, etc.)
├── pages/               # Route-level components
└── i18n/                # Internationalization

supabase/
└── functions/           # Edge functions
    ├── _shared/         # Shared utilities
    └── ally-chat/       # AI chat (modular structure)

docs/                    # Developer documentation
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design and layers
- [Coding Patterns](docs/CODING_PATTERNS.md) - Conventions and patterns
- [Edge Functions](docs/EDGE_FUNCTIONS.md) - Backend development guide
- [Testing Guide](docs/TESTING.md) - Testing setup and practices
- [Contributing](CONTRIBUTING.md) - How to contribute

## Architecture Highlights

### Layered Architecture

```
Pages → Components → Hooks → Data Access Layer → Supabase
```

### Key Patterns

- **Context Split**: Auth, Profile, and Permissions in separate contexts
- **Query Key Factory**: Consistent React Query cache keys
- **Data Access Layer**: Centralized Supabase operations
- **Error Boundaries**: Feature-specific error handling
- **Optimistic Updates**: Instant UI feedback on mutations

### Refactoring Status

The codebase has undergone comprehensive refactoring through 6 phases:

- ✅ **Phase 1**: Security hardening (validation, rate limiting, logging)
- ✅ **Phase 2**: Architecture (context split, DAL, component modularization)
- ✅ **Phase 3**: Performance (optimistic updates, memoization, virtualization)
- ✅ **Phase 4**: Testing & polish
- ✅ **Phase 5**: Security audit & production hardening
- ✅ **Phase 6**: AI enhancements (tools, vision, voice, proactive alerts)

**Production Status**: Ready for deployment (December 2025)

## Environment

This project uses Lovable Cloud which provides:

- PostgreSQL database with RLS
- Authentication
- File storage
- Edge functions
- AI gateway

No additional environment configuration is required for local development.

## Deployment

Deploy via Lovable:

1. Open [Lovable Project](https://lovable.dev/projects/3e85dd21-5f97-470b-b930-6fa7dd3660d5)
2. Click **Share → Publish**
3. Frontend changes require clicking "Update"
4. Backend changes (edge functions, migrations) deploy automatically

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Proprietary - All rights reserved
