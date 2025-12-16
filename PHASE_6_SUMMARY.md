# Phase 6: AI Enhancement Roadmap

## Overview

Phase 6 transforms Ally from a helpful assistant into a full-featured AI companion that can manage aquatic spaces through natural conversation, analyze photos in real-time, and proactively assist users.

## Roadmap Status

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| 6a | Tool Expansion | ✅ Complete | 6 AI tools for database actions via chat |
| 6b | In-Chat Photo Analysis | ✅ Complete | Multi-modal vision analysis in conversations |
| 6c | Voice I/O | 🔲 Planned | Speech-to-text input, text-to-speech output |
| 6d | AI-Powered Proactive Alerts | 🔲 Planned | Predictive alerts replacing rule-based trends |
| 6e | AI Image Generation | 🔲 Planned | Educational diagrams and visual guides |
| 6f | Chat UX Enhancements | 🔲 Planned | Suggested questions, quick actions, confidence |

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

### Files Modified

- `supabase/functions/ally-chat/tools/index.ts` - Tool definitions with JSON schemas
- `supabase/functions/ally-chat/tools/executor.ts` - Tool execution logic with database operations
- `supabase/functions/ally-chat/prompts/system.ts` - System prompt with tool usage guidance

### Example Conversations

**Creating a Task:**
```
User: "Can you remind me to clean my filter next Saturday?"
Ally: "I've created a filter cleaning task for Saturday. I'll make sure you get a reminder!"
→ Tool called: create_task({ task_name: "Clean filter", task_type: "filter_cleaning", due_date: "2024-12-21" })
```

**Logging Water Test:**
```
User: "Just tested my water - pH 7.8, ammonia 0, nitrite 0, nitrate 15"
Ally: "Great results! I've logged those parameters. Your water chemistry looks stable."
→ Tool called: log_water_test({ parameters: [{ name: "pH", value: 7.8 }, ...] })
```

**Adding Livestock:**
```
User: "I picked up 4 cardinal tetras from the LFS today"
Ally: "Exciting! I've added 4 cardinal tetras to your tank. They should school beautifully with your existing fish."
→ Tool called: add_livestock({ name: "Cardinal Tetra", species: "Paracheirodon axelrodi", quantity: 4 })
```

### Technical Implementation

```typescript
// Tool definition structure (tools/index.ts)
{
  type: "function",
  function: {
    name: "create_task",
    description: "Create a maintenance task for the user's aquarium",
    parameters: {
      type: "object",
      properties: {
        task_name: { type: "string" },
        task_type: { type: "string", enum: ["water_change", "filter_cleaning", ...] },
        due_date: { type: "string", format: "date" },
        notes: { type: "string" }
      },
      required: ["task_name", "task_type", "due_date"]
    }
  }
}
```

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

### User Experience

1. **Attach Photo** - Camera button next to send, supports mobile camera or file picker
2. **Preview** - Thumbnail preview with option to remove before sending
3. **Compression** - Auto-compressed to max 1MB, 1920px for fast upload
4. **Analysis** - Ally streams detailed analysis with specific observations
5. **History** - Photos displayed as thumbnails in chat history

### Technical Implementation

**Frontend (AllyChat.tsx):**
```typescript
// Photo state management
const [pendingPhoto, setPendingPhoto] = useState<{
  file: File;
  preview: string;
} | null>(null);

// Compression before upload
const compressedFile = await compressImage(file, 1, 1920, 0.8);

// Message with image
const userMessage: Message = {
  role: "user",
  content: input || "Please analyze this photo",
  imageUrl: pendingPhoto?.preview,
};
```

**Backend (ally-chat/index.ts):**
```typescript
// Multi-modal message formatting for Gemini Vision
if (msg.imageUrl?.startsWith('data:image')) {
  return {
    role: msg.role,
    content: [
      { type: "text", text: msg.content },
      { type: "image_url", image_url: { url: msg.imageUrl } }
    ]
  };
}
```

### Testing Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Photo of fish with ich spots | Identifies white spots, recommends salt/heat treatment |
| Photo of green hair algae | Identifies algae type, suggests manual removal + reduce lighting |
| Photo of cloudy filter output | Identifies flow issue, recommends cleaning/media replacement |
| Photo of yellowing plant leaves | Diagnoses iron/potassium deficiency, suggests fertilizer |
| Full tank shot | Provides overall assessment, stocking advice, aquascaping tips |

---

## Planned Phases

### Phase 6c: Voice I/O 🔲

**Features:**
- Microphone button for speech-to-text input
- Text-to-speech output for Ally's responses (ElevenLabs)
- Hands-free mode for accessibility
- Voice activity detection

**Files to Create/Modify:**
- `src/hooks/useVoiceRecording.tsx` - Speech-to-text capture
- `src/hooks/useTextToSpeech.tsx` - TTS playback
- `supabase/functions/transcribe-audio/index.ts` - Whisper API integration

### Phase 6d: AI-Powered Proactive Alerts 🔲

**Features:**
- Replace rule-based trend detection with AI analysis
- Predictive alerts before problems occur
- Personalized recommendations based on user history
- Integration with push notifications

### Phase 6e: AI Image Generation 🔲

**Features:**
- Educational diagrams (nitrogen cycle, fish anatomy)
- Tank setup visualizations
- Species identification guides
- Equipment installation diagrams

### Phase 6f: Chat UX Enhancements 🔲

**Features:**
- Suggested follow-up questions
- Quick action buttons (create task, log test)
- Confidence indicators on AI responses
- Source citations for advice

---

## Production Readiness & Monitoring

*Preserved from original Phase 6 implementation.*

### Rate Limiting System

**Tier-based rate limits for premium features:**

| Feature | Free | Plus | Gold | Enterprise |
|---------|------|------|------|------------|
| Water Test Photo Analysis | 5/hour | 25/hour | 100/hour | 1000/hour |
| AI Chat | 10/hour | 50/hour | 200/hour | 1000/hour |
| Maintenance Suggestions | 20/day | 100/day | 500/day | 5000/day |

**Features:**
- ✅ Automatic rate limit tracking per user/feature
- ✅ Real-time remaining request counts
- ✅ User-friendly toast notifications
- ✅ Warning when approaching limits
- ✅ Automatic usage tracking in `activity_logs`
- ✅ Sentry breadcrumbs for rate limit events
- ✅ LocalStorage-based rate limiting (client-side)

**Usage:**
```typescript
const rateLimit = useFeatureRateLimit('water-test-photo');

const handleAction = async () => {
  const canProceed = await rateLimit.checkLimit();
  if (!canProceed) return;
  // Proceed with action
};
```

### Performance Monitoring

**Automatic performance tracking:**
- ✅ Long task detection (>50ms main thread blocks)
- ✅ Cumulative Layout Shift (CLS) monitoring
- ✅ Largest Contentful Paint (LCP) tracking
- ✅ Navigation timing metrics
- ✅ Resource timing analysis
- ✅ Slow operation warnings (>1s)
- ✅ Sentry integration for all metrics

**Key Metrics Tracked:**
- DNS lookup time
- TCP connection time
- Request/response time
- DOM processing time
- Load event time
- Total page load time

**Usage:**
```typescript
const result = await measurePerformance(
  'water-test-photo-analysis',
  () => apiCall(),
  FeatureArea.WATER_TESTS
);
```

### Configuration

**Adjusting Rate Limits:**
Edit `RATE_LIMITS` in `src/hooks/useFeatureRateLimit.tsx`

**Performance Thresholds:**
Edit thresholds in `src/lib/performanceMonitor.ts`

---

## Summary

Phase 6 significantly enhances Ally's capabilities:

- **6a (Complete)**: Ally can now take actions on user data through 6 conversational tools
- **6b (Complete)**: Users can send photos for real-time AI vision analysis
- **6c-6f (Planned)**: Voice I/O, proactive alerts, image generation, UX enhancements

The combination of tool execution and vision analysis transforms Ally from an advisor into a true AI companion that can see, understand, and act on behalf of users.
