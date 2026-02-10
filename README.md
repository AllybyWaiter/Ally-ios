# Ally by WA.I.TER

AI-powered aquatic space management for aquariums, pools, spas, and ponds. Native iOS app built with React, TypeScript, and Capacitor.

## Features

- **Aquatic Space Management** - Track multiple tanks, pools, spas, and ponds with livestock, plants, equipment, and photo galleries
- **Ally AI Chat** - Context-aware assistant with tool use, conversation memory, voice input/output, and hands-free conversation mode
- **Water Testing** - Log parameters manually or via AI photo analysis (Gemini Vision); track trends and get proactive alerts
- **Task Calendar** - Schedule maintenance with AI-suggested tasks
- **Weather** - Local weather, forecast, and radar for outdoor aquatic spaces
- **Analytics** - Parameter trend visualization, health scoring, and data cards
- **Native iOS** - Full native experience via Capacitor with haptics, geolocation, and push notifications
- **Subscriptions** - Tiered plans (Free, Plus, Gold) via RevenueCat with referral system

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Shadcn/UI, Framer Motion |
| **State** | TanStack Query, React Context (Auth, Profile, Permissions, Feature Flags) |
| **Backend** | Supabase (PostgreSQL + RLS, Auth, Storage, Edge Functions) |
| **AI** | OpenAI GPT-4o (chat + tools), Gemini Vision (photo analysis) |
| **Voice** | Whisper (transcription), ElevenLabs (TTS), VAD (silence detection) |
| **Native** | Capacitor 8 (iOS), PWA with Workbox service worker |
| **Payments** | RevenueCat |
| **Monitoring** | Sentry |
| **Testing** | Vitest, Testing Library |
| **i18n** | i18next (5+ languages) |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test              # watch mode
npm run test:run      # single run
npm run test:coverage # with coverage (70% threshold)

# Build
npm run build         # production
npm run build:dev     # development

# iOS
npx cap sync ios
# Then open ios/App/App.xcworkspace in Xcode
```

## Project Structure

```
src/
├── pages/               # 12 route-level pages
│   ├── Dashboard        # Home with weather, stats, aquarium grid
│   ├── AllyChat         # AI chat with streaming, voice, tools
│   ├── AquariumDetail   # Single aquarium management
│   ├── WaterTests       # Test logging, history, charts
│   ├── TaskCalendar     # Maintenance scheduling
│   ├── Weather          # Weather + radar
│   ├── Settings         # Preferences, account, subscription
│   ├── Admin            # User/feature flag management
│   └── Auth, Pricing, Privacy, Terms, ResetPassword, NotFound
├── components/          # UI components by feature
│   ├── ui/              # 54 Shadcn/UI base components
│   ├── aquarium/        # Aquarium CRUD, livestock, equipment, photos
│   ├── chat/            # Messages, history sidebar, starters, mentions
│   ├── dashboard/       # Stats, hero banner, alerts, weather card
│   ├── water-tests/     # Test forms, charts, templates, alerts
│   ├── calendar/        # Task calendar components
│   ├── settings/        # Settings page sections
│   ├── admin/           # Admin dashboard panels
│   ├── weather/         # Radar, forecast components
│   ├── onboarding/      # New user onboarding flow
│   └── error-boundaries/# Feature-level error isolation
├── hooks/               # ~48 custom hooks
│   ├── useConversationManager  # Chat state, aquarium context, history
│   ├── useStreamingResponse    # SSE streaming with tool execution
│   ├── useVoiceRecording       # Mic capture + Whisper transcription
│   ├── useTTS                  # ElevenLabs text-to-speech
│   ├── useVAD                  # Voice activity detection
│   ├── usePlanLimits           # Subscription tier feature gates
│   ├── useWeather              # Weather data fetching
│   └── ...auth, haptics, geolocation, wake lock, etc.
├── contexts/            # Auth, Profile, Permissions, FeatureFlags, Onboarding
├── infrastructure/      # Data access layer
│   └── queries/         # Supabase CRUD for all entities
├── lib/                 # Utilities (query keys, formatters, audio, image compression, etc.)
├── i18n/                # Internationalization config + locale files
└── integrations/        # Supabase client + generated types

supabase/functions/      # 25 Deno edge functions
├── _shared/             # CORS, validation, rate limiting, logging, error handling
├── ally-chat/           # AI chat orchestration
│   ├── tools/           # 10+ tool handlers (water tests, equipment, compatibility, etc.)
│   ├── context/         # Aquarium + memory context builders
│   ├── prompts/         # Dynamic system prompt (water-type specific)
│   └── utils/           # Stream parser, conversation trimmer, input gate
├── analyze-water-test-photo/   # Gemini Vision photo analysis
├── analyze-water-trends/       # Parameter trend detection
├── analyze-water-trends-ai/    # AI-powered trend insights
├── transcribe-audio/           # Whisper speech-to-text
├── elevenlabs-tts/             # Text-to-speech
├── get-weather/                # Weather API proxy
├── get-radar-frames/           # Weather radar data
├── suggest-maintenance-tasks/  # AI task suggestions
├── send-push-notification/     # Push notifications
├── scheduled-notifications/    # Cron-based notifications
├── apply-referral-reward/      # Referral bonus processing
├── validate-referral-code/     # Referral code validation
├── delete-user-account/        # Account deletion
├── export-user-data/           # GDPR data export
├── purge-old-pii/              # Privacy data cleanup
└── ...support, email, admin functions

ios/                     # Native iOS project (Capacitor)
docs/                    # Developer documentation
```

## Architecture

```
Pages → Components → Hooks → Data Access Layer → Supabase
                       ↕
              Contexts (Auth, Profile, Permissions)
                       ↕
              React Query (caching, invalidation)
```

**Key patterns:**
- Context split: Auth, Profile, Permissions, and Feature Flags in separate providers
- Query key factory for consistent React Query cache invalidation
- Centralized data access layer for all Supabase operations
- Feature-level error boundaries
- Optimistic updates for instant UI feedback
- Code-split routes with retry logic for flaky mobile networks
- Water-type-specific system prompts to reduce token usage

## Ally AI Chat

The chat system (`ally-chat/`) is the most complex subsystem:

- **Streaming** - SSE with tool call detection, buffering, and follow-up requests
- **Tools** - Save memory, log water tests, manage equipment/livestock, check fish compatibility, calculate pool volume, search knowledge base, show data cards
- **Context** - Injects aquarium data (water tests, equipment, livestock), user memories, and aquarium list into prompts
- **Voice** - Push-to-talk and hands-free conversation mode with VAD silence detection
- **Proactive** - Auto-selects single-tank users' aquarium; injects aquarium names so AI can ask intelligently for multi-tank users

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design and layers
- [Coding Patterns](docs/CODING_PATTERNS.md) - Conventions and patterns
- [Edge Functions](docs/EDGE_FUNCTIONS.md) - Backend development guide
- [Testing Guide](docs/TESTING.md) - Testing setup and practices
- [BLE Integration](docs/YINMIK_BLE_INTEGRATION.md) - Water testing device integration
- [Contributing](CONTRIBUTING.md) - How to contribute
- [Security Audit](SECURITY_AUDIT.md) - Security analysis
- [Compliance](COMPLIANCE.md) - Privacy and data handling

## Environment

Backend runs on Supabase (PostgreSQL with RLS, Auth, Storage, Edge Functions). Client-side environment variables are in `.env.production` — all public/anon keys only. Service-role keys and API secrets (OpenAI, Gemini, ElevenLabs, Weather) are stored in Supabase Edge Function secrets.

## Deployment

1. **Frontend**: Build with `npm run build`, deploy via Lovable or any static host
2. **Edge Functions**: Deploy automatically on push to Supabase
3. **iOS**: `npm run build && npx cap sync ios`, then archive in Xcode

## License

Proprietary - All rights reserved
