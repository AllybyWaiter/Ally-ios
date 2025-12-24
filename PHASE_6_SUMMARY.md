# Phase 6: AI Enhancement Roadmap

## Overview

Phase 6 transforms Ally from a helpful assistant into a full-featured AI companion that can manage aquatic spaces through natural conversation, analyze photos in real-time, respond via voice, and proactively alert users to potential problems before they occur.

**Last Updated**: December 24, 2025  
**Status**: Production Ready

## Roadmap Status

| Phase | Feature | Status | Completed |
|-------|---------|--------|-----------|
| 6a | Tool Expansion | ✅ Complete | Nov 2024 |
| 6b | In-Chat Photo Analysis | ✅ Complete | Nov 2024 |
| 6c | Voice I/O | ✅ Complete | Dec 2024 |
| 6d | AI-Powered Proactive Alerts | ✅ Complete | Dec 2024 |
| 6e | AI Image Generation | 🔲 Planned | Q1 2025 |
| 6f | Chat UX Enhancements | ✅ Complete | Dec 2024 |

---

## Phase 6a: Tool Expansion ✅

### Summary

Ally can now perform actions directly on user data through natural conversation. Instead of just giving advice, Ally can create tasks, log water tests, add livestock, and more.

### Implemented Tools

| Tool | Description | Example Trigger |
|------|-------------|-----------------|
| `save_memory` | Remember user preferences and practices | "I always use RO/DI water" |
| `add_equipment` | Add equipment to aquarium profiles | "I just got a Fluval 407 filter" |
| `create_task` | Schedule maintenance tasks | "Remind me to do a water change Friday" |
| `log_water_test` | Record water parameters from conversation | "My pH is 8.2, ammonia 0, nitrite 0, nitrate 10" |
| `add_livestock` | Add fish/invertebrates/corals | "I added 6 neon tetras today" |
| `add_plant` | Add plants to aquarium profiles | "I planted some java fern" |
| `update_livestock` | Update existing livestock health/quantity | "Lost 2 tetras" |
| `update_plant` | Update existing plant condition | "My java fern is melting" |
| `update_equipment` | Update equipment maintenance dates | "Just cleaned my filter" |

### Files Modified

- `supabase/functions/ally-chat/tools/index.ts` - Tool definitions with JSON schemas
- `supabase/functions/ally-chat/tools/executor.ts` - Tool execution logic with database operations
- `supabase/functions/ally-chat/prompts/system.ts` - System prompt with tool usage guidance

---

## Phase 6b: In-Chat Photo Analysis ✅

### Summary

Users can now send photos directly in Ally Chat for real-time AI vision analysis. Ally can assess fish health, identify algae, troubleshoot equipment, evaluate plants, and provide general tank assessments.

### Capabilities

| Analysis Type | What Ally Looks For |
|---------------|---------------------|
| **Fish Health** | Disease signs (ich, fin rot, velvet), body condition, coloration, stress indicators |
| **Algae ID** | Type identification (green, brown, BBA, hair, cyano), severity, treatment recommendations |
| **Equipment** | Installation issues, visible damage, incorrect setup, maintenance needs |
| **Plant Health** | Nutrient deficiencies, lighting issues, CO2 needs, melting/yellowing |
| **Pool/Spa** | Water clarity, surface debris, liner condition, equipment visible issues |
| **General Tank** | Stocking assessment, aquascaping feedback, water clarity, overall health |

### Files Modified

- `src/pages/AllyChat.tsx` - Photo attachment button, preview UI, compression logic
- `src/hooks/useStreamingResponse.ts` - Multi-modal message handling with image support
- `src/components/chat/VirtualizedMessageList.tsx` - Image thumbnail display in chat bubbles
- `supabase/functions/ally-chat/index.ts` - Gemini Vision API integration
- `supabase/functions/ally-chat/prompts/system.ts` - Image analysis guidance in system prompt

---

## Phase 6c: Voice I/O ✅

### Summary

Users can speak to Ally and receive spoken responses, enabling hands-free operation while performing tank maintenance.

### Features

| Feature | Description |
|---------|-------------|
| **Speech-to-Text** | Microphone button for voice input using OpenAI Whisper |
| **Text-to-Speech** | ElevenLabs Sarah voice for natural spoken responses |
| **Auto-Play** | Toggle to automatically speak responses aloud |
| **Hands-Free Mode** | Auto-send transcribed messages when auto-play is enabled |

### User Experience

1. Tap microphone → speak your question
2. Transcribed text auto-populates (and auto-sends if hands-free enabled)
3. Ally responds in text AND speaks the response if auto-play is on
4. Visual indicator shows "Hands-free mode active"

### Files Modified

- `src/pages/AllyChat.tsx` - Voice recording button, auto-send logic, TTS integration
- `src/hooks/useVoiceRecording.tsx` - Microphone capture and state management
- `src/hooks/useTTS.tsx` - ElevenLabs TTS playback
- `supabase/functions/transcribe-audio/index.ts` - OpenAI Whisper integration
- `supabase/functions/elevenlabs-tts/index.ts` - ElevenLabs voice synthesis

---

## Phase 6d: AI-Powered Proactive Alerts ✅

### Summary

AI-powered trend analysis replaces rule-based detection for Plus/Gold+ subscribers. The system predicts problems before they become critical, considers livestock sensitivities, and provides personalized recommendations.

### Tier Gating

| Tier | Alert System |
|------|-------------|
| Free | Rule-based alerts only |
| Basic | Rule-based alerts only |
| **Plus** | ✅ AI-powered predictive alerts |
| **Gold** | ✅ AI-powered predictive alerts |
| Business | ✅ AI-powered predictive alerts |
| Enterprise | ✅ AI-powered predictive alerts |

### New Alert Types

| Type | Description | Example |
|------|-------------|---------|
| `predictive` | AI predicts problem before it occurs | "At current rate, nitrate will exceed safe levels for your corals within 7 days" |
| `seasonal` | Season-specific warnings | "Winter approaching - monitor heater as tank temp may fluctuate" |
| `stocking` | Livestock-aware warnings | "pH trending down toward stress range for your discus (prefer 6.8+)" |
| `correlation` | Multi-parameter insights | "Rising nitrates with falling pH suggests overfeeding - reduce by 20%" |

### Enhanced Alert Data

AI alerts include additional fields:
- `recommendation` - Specific actionable advice
- `timeframe` - When to take action
- `affected_inhabitants` - Which livestock/plants are at risk
- `confidence` - AI confidence score (0.0-1.0)
- `analysis_model` - 'ai' or 'rule' to identify source

### User Experience

**Free/Basic Users:**
- See rule-based trend alerts (existing behavior)
- See "Upgrade to Plus" prompt with AI benefits
- No recommendations, affected inhabitants, or predictive alerts

**Plus/Gold+ Users:**
- See AI-powered predictive alerts
- Get personalized recommendations
- See affected livestock/plants
- Get "Ask Ally" quick action button
- Receive enhanced push notifications with recommendations

### Files Created/Modified

- `supabase/functions/analyze-water-trends-ai/index.ts` - **New** AI analysis with Lovable AI
- `src/hooks/usePlanLimits.tsx` - Added `hasAITrendAlerts` flag
- `src/infrastructure/queries/waterTestAlerts.ts` - Updated interface, tier-aware routing
- `src/components/dashboard/TrendAlertsBanner.tsx` - Enhanced UI with recommendations
- `src/components/water-tests/hooks/useWaterTestForm.ts` - Routes to correct endpoint

### Technical Implementation

**AI Analysis Flow:**
1. Water test submitted → `triggerTrendAnalysis(aquariumId, userId, hasAITrendAlerts)`
2. Routes to `analyze-water-trends-ai` (Plus/Gold) or `analyze-water-trends` (Free/Basic)
3. AI function fetches aquarium context: livestock, plants, equipment, user preferences
4. Calls Lovable AI (Gemini 2.5 Flash) with structured tool output
5. AI returns predictive alerts with recommendations
6. Alerts saved with `analysis_model: 'ai'`

**Fallback Behavior:**
- If AI call fails, automatically falls back to rule-based analysis
- Alerts marked with `analysis_model: 'rule'` when fallback is used
- Users always receive alerts, AI just enhances them for Plus/Gold

---

## Planned Phases

### Phase 6e: AI Image Generation 🔲

**Features:**
- Educational diagrams (nitrogen cycle, fish anatomy)
- Tank setup visualizations
- Species identification guides
- Equipment installation diagrams

---

## Phase 6f: Chat UX Enhancements ✅

### Summary

Enhanced the Ally Chat interface with context-aware suggestions, quick action buttons, and AI-generated follow-up questions for a more intelligent and guided conversation experience.

### Features

| Feature | Description |
|---------|-------------|
| **Context-Aware Suggestions** | Dynamic question suggestions based on aquarium data, active alerts, overdue tasks, and water type |
| **Conversation Starters** | Beautiful card-based UI for new conversations with categorized suggestions |
| **Follow-Up Suggestions** | AI generates 2-3 relevant follow-up questions parsed from response |
| **Quick Action Chips** | Actionable buttons (Log Test, Schedule Task) appear after relevant AI responses |
| **Prefill Navigation** | "Ask Ally" from alerts navigates with pre-filled contextual question |
| **Category Icons** | Visual icons for different question types (water, health, equipment, alerts) |

### Question Categories

| Category | Icon | Examples |
|----------|------|----------|
| Alert | ⚠️ | "Why is my pH trending down?" |
| Water | 💧 | "What are ideal parameters?" |
| Health | 🐟 | "Any fish compatibility concerns?" |
| Maintenance | 🔧 | "What maintenance is overdue?" |
| Equipment | ⚙️ | "Equipment maintenance tips" |
| Getting Started | ❓ | "How do I set up my first tank?" |

### Context Sources

Suggestions dynamically generated based on:
1. **Active Alerts** - Prioritizes critical/warning alerts
2. **Overdue Tasks** - Maintenance reminders
3. **Aquarium Type** - Type-specific questions (reef, pool, planted)
4. **Livestock/Plants** - Species-specific care questions
5. **Recent Tests** - Follow-up analysis questions

### Files Created/Modified

- `src/hooks/useSuggestedQuestions.ts` - **New** Context-aware question generation hook
- `src/components/chat/ConversationStarters.tsx` - **New** Card-based suggestion UI
- `src/components/chat/QuickActionChips.tsx` - **New** Action detection and buttons
- `src/components/chat/FollowUpSuggestions.tsx` - **New** AI follow-up parser and display
- `src/pages/AllyChat.tsx` - Integrated new components, added prefill navigation
- `src/components/dashboard/TrendAlertsBanner.tsx` - Enhanced "Ask Ally" with navigation state
- `supabase/functions/ally-chat/prompts/system.ts` - Added follow-up generation guidance
- `src/infrastructure/queries/maintenanceTasks.ts` - Added `fetchUpcomingTasks` for context

---

## Production Readiness & Monitoring

### Rate Limiting System

**Tier-based rate limits for premium features:**

| Feature | Free | Plus | Gold | Enterprise |
|---------|------|------|------|------------|
| Water Test Photo Analysis | 5/hour | 25/hour | 100/hour | 1000/hour |
| AI Chat | 10/hour | 50/hour | 200/hour | 1000/hour |
| AI Trend Analysis | N/A | 10/hour | 50/hour | 500/hour |
| Maintenance Suggestions | 20/day | 100/day | 500/day | 5000/day |

**Features:**
- ✅ Automatic rate limit tracking per user/feature
- ✅ Real-time remaining request counts
- ✅ User-friendly toast notifications
- ✅ Warning when approaching limits
- ✅ Automatic usage tracking in `activity_logs`
- ✅ Sentry breadcrumbs for rate limit events
- ✅ LocalStorage-based rate limiting (client-side)

### Performance Monitoring

**Automatic performance tracking:**
- ✅ Long task detection (>50ms main thread blocks)
- ✅ Cumulative Layout Shift (CLS) monitoring
- ✅ Largest Contentful Paint (LCP) tracking
- ✅ Navigation timing metrics
- ✅ Resource timing analysis
- ✅ Slow operation warnings (>1s)
- ✅ Sentry integration for all metrics

---

## Summary

Phase 6 significantly enhances Ally's capabilities:

- **6a (Complete)**: Ally can now take actions on user data through 9 conversational tools
- **6b (Complete)**: Users can send photos for real-time AI vision analysis
- **6c (Complete)**: Voice input/output with hands-free mode for maintenance scenarios
- **6d (Complete)**: AI-powered predictive alerts for Plus/Gold+ subscribers
- **6e (Planned)**: Image generation for educational content
- **6f (Complete)**: Context-aware suggestions, quick actions, and AI follow-ups

The combination of tool execution, vision analysis, voice I/O, proactive alerts, and intelligent UX transforms Ally from an advisor into a true AI companion that can see, hear, understand, predict, and guide users through every aspect of aquatic care.
