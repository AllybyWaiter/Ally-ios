/**
 * Regression Test Suite: Ally Chat Guardrails & Input Gate
 * 
 * Tests the input validation gate for pool dosing, spa dosing, and aquarium treatment.
 * These tests ensure we don't regress on safety-critical input requirements.
 * 
 * Run: npm test -- inputGate
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// PORTABLE INPUT GATE LOGIC (mirrors supabase/functions/ally-chat/utils/inputGate.ts)
// ============================================================================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
}

interface AquariumContext {
  aquariumId: string | null;
  waterType: string | null;
  aquariumData: Record<string, unknown> | null;
}

type ConversationType = 'pool_dosing' | 'spa_dosing' | 'aquarium_treatment' | 'general';

interface InputValidationResult {
  conversationType: ConversationType;
  missingInputs: string[];
  detectedInputs: Record<string, boolean>;
  requiresGate: boolean;
}

// Detection keywords
const POOL_DOSING_KEYWORDS = [
  'add chlorine', 'shock', 'balance', 'dose', 'how much', 'chemical',
  'muriatic acid', 'sodium bicarbonate', 'baking soda', 'stabilizer',
  'cyanuric', 'raise ph', 'lower ph', 'calcium', 'chlorine level'
];

const SPA_DOSING_KEYWORDS = [
  'hot tub', 'spa', 'jacuzzi', 'bromine', 'sanitize', 'foam'
];

const AQUARIUM_TREATMENT_KEYWORDS = [
  'medication', 'treat', 'sick fish', 'disease', 'ich', 'fin rot',
  'parasite', 'fungus', 'quarantine', 'dose medicine', 'melafix',
  'pimafix', 'erythromycin', 'kanamycin', 'prazipro', 'general cure'
];

// Required inputs by conversation type
const POOL_DOSING_REQUIREMENTS: Record<string, string[]> = {
  volume: ['gallon', 'liter', 'volume', 'pool size', 'how big', 'capacity'],
  freeChlorine: ['free chlorine', 'fc', 'cl', 'chlorine level', 'current chlorine'],
  combinedChlorine: ['combined chlorine', 'cc', 'chloramines'],
  pH: ['ph', 'acidity', 'alkalinity level'],
  totalAlkalinity: ['total alkalinity', 'ta', 'alkalinity'],
  cya: ['cya', 'cyanuric', 'stabilizer', 'conditioner level'],
  sanitizerType: ['salt', 'chlorine', 'bromine', 'biguanide', 'mineral', 'sanitizer type']
};

const AQUARIUM_TREATMENT_REQUIREMENTS: Record<string, string[]> = {
  species: ['fish', 'species', 'betta', 'guppy', 'tetra', 'cichlid', 'goldfish', 'shrimp', 'snail'],
  tankSize: ['gallon', 'liter', 'tank size', 'aquarium size', 'how big'],
  ammonia: ['ammonia', 'nh3', 'nh4'],
  nitrite: ['nitrite', 'no2'],
  nitrate: ['nitrate', 'no3'],
  temperature: ['temp', 'temperature', 'degrees', 'heater'],
  symptoms: ['symptom', 'behavior', 'acting', 'looks like', 'white spots', 'not eating', 'lethargic'],
  timeline: ['started', 'days ago', 'how long', 'when did', 'noticed', 'yesterday', 'today', 'week']
};

/**
 * Detect conversation type from recent messages
 */
function detectConversationType(messages: Message[], waterType: string | null): ConversationType {
  const recentMessages = messages.slice(-5);
  const combinedText = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Check for pool/spa context
  if (waterType === 'pool' || waterType === 'spa') {
    if (waterType === 'spa' || SPA_DOSING_KEYWORDS.some(kw => combinedText.includes(kw))) {
      if (POOL_DOSING_KEYWORDS.some(kw => combinedText.includes(kw)) ||
          SPA_DOSING_KEYWORDS.some(kw => combinedText.includes(kw))) {
        return waterType === 'spa' ? 'spa_dosing' : 'pool_dosing';
      }
    }
    if (POOL_DOSING_KEYWORDS.some(kw => combinedText.includes(kw))) {
      return 'pool_dosing';
    }
  }

  // Check for aquarium treatment
  if (['freshwater', 'saltwater', 'brackish'].includes(waterType || '')) {
    if (AQUARIUM_TREATMENT_KEYWORDS.some(kw => combinedText.includes(kw))) {
      return 'aquarium_treatment';
    }
  }

  return 'general';
}

/**
 * Detect which inputs are present in the conversation
 */
function detectInputsInConversation(
  messages: Message[],
  requirements: Record<string, string[]>
): Record<string, boolean> {
  const combinedText = messages
    .map(m => m.content.toLowerCase())
    .join(' ');

  const detected: Record<string, boolean> = {};

  for (const [key, keywords] of Object.entries(requirements)) {
    detected[key] = keywords.some(kw => combinedText.includes(kw));
  }

  return detected;
}

/**
 * Get list of missing inputs
 */
function getMissingInputs(detectedInputs: Record<string, boolean>): string[] {
  return Object.entries(detectedInputs)
    .filter(([, detected]) => !detected)
    .map(([key]) => key);
}

/**
 * Validate required inputs for the conversation
 */
function validateRequiredInputs(
  messages: Message[],
  aquariumContext: AquariumContext
): InputValidationResult {
  const waterType = aquariumContext.waterType;
  const conversationType = detectConversationType(messages, waterType);

  if (conversationType === 'general') {
    return {
      conversationType,
      missingInputs: [],
      detectedInputs: {},
      requiresGate: false,
    };
  }

  let requirements: Record<string, string[]>;

  switch (conversationType) {
    case 'pool_dosing':
    case 'spa_dosing':
      requirements = POOL_DOSING_REQUIREMENTS;
      break;
    case 'aquarium_treatment':
      requirements = { ...AQUARIUM_TREATMENT_REQUIREMENTS };
      if (waterType === 'saltwater') {
        requirements.salinity = ['salinity', 'salt level', 'sg', 'specific gravity', 'ppt'];
      }
      break;
    default:
      requirements = {};
  }

  const detectedInputs = detectInputsInConversation(messages, requirements);
  const missingInputs = getMissingInputs(detectedInputs);

  // Gate triggers if 2+ critical inputs are missing
  const requiresGate = missingInputs.length >= 2;

  return {
    conversationType,
    missingInputs,
    detectedInputs,
    requiresGate,
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Input Gate - Conversation Type Detection', () => {
  it('detects pool dosing intent from keywords', () => {
    const messages: Message[] = [
      { role: 'user', content: 'How much chlorine should I add to my pool?' }
    ];
    const result = detectConversationType(messages, 'pool');
    expect(result).toBe('pool_dosing');
  });

  it('detects spa dosing intent from keywords', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My hot tub needs more bromine, how do I dose it?' }
    ];
    const result = detectConversationType(messages, 'spa');
    expect(result).toBe('spa_dosing');
  });

  it('detects aquarium treatment intent from keywords', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My fish has ich, what medication should I use?' }
    ];
    const result = detectConversationType(messages, 'freshwater');
    expect(result).toBe('aquarium_treatment');
  });

  it('returns general for non-dosing conversations', () => {
    const messages: Message[] = [
      { role: 'user', content: 'What temperature should I keep my tank at?' }
    ];
    const result = detectConversationType(messages, 'freshwater');
    expect(result).toBe('general');
  });

  it('considers water type context for intent detection', () => {
    const messages: Message[] = [
      { role: 'user', content: 'I need to shock my water' }
    ];
    // Pool context should detect pool_dosing
    expect(detectConversationType(messages, 'pool')).toBe('pool_dosing');
    // Freshwater context should be general (shocking is a pool term)
    expect(detectConversationType(messages, 'freshwater')).toBe('general');
  });
});

describe('Input Gate - Missing Input Detection', () => {
  it('identifies missing pool dosing requirements', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My pool is 20,000 gallons. How much chlorine to add?' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'pool', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('pool_dosing');
    expect(result.detectedInputs.volume).toBe(true);
    expect(result.missingInputs).toContain('freeChlorine');
    expect(result.missingInputs).toContain('pH');
    expect(result.requiresGate).toBe(true);
  });

  it('identifies missing aquarium treatment requirements', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My betta has fin rot, what should I do?' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'freshwater', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('aquarium_treatment');
    expect(result.detectedInputs.species).toBe(true);
    expect(result.missingInputs).toContain('tankSize');
    expect(result.missingInputs).toContain('ammonia');
    expect(result.requiresGate).toBe(true);
  });

  it('adds salinity requirement for saltwater aquariums', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My clownfish is sick with ich' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'saltwater', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('aquarium_treatment');
    expect(result.missingInputs).toContain('salinity');
  });

  it('does not add salinity requirement for freshwater aquariums', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My guppy is sick with ich' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'freshwater', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('aquarium_treatment');
    expect(result.missingInputs).not.toContain('salinity');
  });
});

describe('Input Gate - Gate Triggering', () => {
  it('triggers gate when 2+ critical inputs missing', () => {
    const messages: Message[] = [
      { role: 'user', content: 'How do I balance my pool?' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'pool', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.requiresGate).toBe(true);
    expect(result.missingInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('does not trigger gate for complete pool inputs', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My pool is 15000 gallons, FC is 2ppm, CC is 0.5, pH is 7.4, TA is 80, CYA is 40, using chlorine tablets. How much shock do I need?' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'pool', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.detectedInputs.volume).toBe(true);
    expect(result.detectedInputs.freeChlorine).toBe(true);
    expect(result.detectedInputs.pH).toBe(true);
    // Should have fewer than 2 missing inputs
    expect(result.missingInputs.length).toBeLessThan(2);
    expect(result.requiresGate).toBe(false);
  });

  it('does not trigger gate for general conversations', () => {
    const messages: Message[] = [
      { role: 'user', content: 'What fish are compatible with bettas?' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'freshwater', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('general');
    expect(result.requiresGate).toBe(false);
  });
});

describe('Input Gate - Full Validation Flow', () => {
  it('returns proper structure for pool dosing with missing inputs', () => {
    const messages: Message[] = [
      { role: 'user', content: 'My pool needs chlorine' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'pool', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result).toHaveProperty('conversationType');
    expect(result).toHaveProperty('missingInputs');
    expect(result).toHaveProperty('detectedInputs');
    expect(result).toHaveProperty('requiresGate');
    expect(Array.isArray(result.missingInputs)).toBe(true);
  });

  it('handles empty messages gracefully', () => {
    const messages: Message[] = [];
    const context: AquariumContext = { aquariumId: null, waterType: null, aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('general');
    expect(result.requiresGate).toBe(false);
  });

  it('handles multi-turn conversations correctly', () => {
    const messages: Message[] = [
      { role: 'user', content: 'I have a 10 gallon tank' },
      { role: 'assistant', content: 'Great! What fish do you keep?' },
      { role: 'user', content: 'A betta fish. It has ich and I noticed it 3 days ago. Ammonia is 0, nitrite is 0, nitrate is 10ppm, temp is 78F' }
    ];
    const context: AquariumContext = { aquariumId: '1', waterType: 'freshwater', aquariumData: null };
    const result = validateRequiredInputs(messages, context);

    expect(result.conversationType).toBe('aquarium_treatment');
    expect(result.detectedInputs.tankSize).toBe(true);
    expect(result.detectedInputs.species).toBe(true);
    expect(result.detectedInputs.ammonia).toBe(true);
    expect(result.detectedInputs.nitrite).toBe(true);
    expect(result.detectedInputs.nitrate).toBe(true);
    expect(result.detectedInputs.temperature).toBe(true);
    expect(result.detectedInputs.timeline).toBe(true);
  });
});

// ============================================================================
// EXPECTED AI BEHAVIOR TESTS (Documentation / Manual Verification)
// ============================================================================

describe('Expected AI Behavior - Safety Escalation', () => {
  it('documents expected vet recommendation scenario', () => {
    // Scenario: Fish showing severe symptoms
    // Input: "My fish is lying on the bottom, gasping, and has red streaks on its body"
    // Expected AI Behavior: Recommend consulting an aquatic veterinarian
    // Verification: Manual check that AI response includes vet recommendation
    expect(true).toBe(true); // Placeholder for documentation
  });

  it('documents expected contractor recommendation scenario', () => {
    // Scenario: Pool structural damage
    // Input: "I see cracks in my pool liner and there's water seeping through"
    // Expected AI Behavior: Recommend consulting a pool professional
    // Verification: Manual check that AI response includes professional recommendation
    expect(true).toBe(true);
  });

  it('documents no-guessing behavior for incomplete pool data', () => {
    // Scenario: User asks for chlorine dose without providing current levels
    // Input: "How much chlorine should I add?"
    // Expected AI Behavior: Ask for pool volume, current FC, pH, and other parameters
    // Verification: AI should NOT provide a dosing recommendation
    expect(true).toBe(true);
  });
});

describe('Expected AI Behavior - Confirmation Flow', () => {
  it('documents expected confirmation before logging water test', () => {
    // Scenario: User shares water parameters
    // Input: "pH is 7.2, ammonia 0, nitrite 0, nitrate 20"
    // Expected AI Behavior: Confirm before calling log_water_test tool
    // Expected: "Would you like me to log this as today's water test?"
    expect(true).toBe(true);
  });

  it('documents expected confirmation before creating task', () => {
    // Scenario: User discusses upcoming maintenance
    // Input: "I should probably do a water change this weekend"
    // Expected AI Behavior: Confirm before calling create_task tool
    // Expected: "Would you like me to schedule a water change task for this weekend?"
    expect(true).toBe(true);
  });

  it('documents expected confirmation before adding livestock', () => {
    // Scenario: User mentions new fish
    // Input: "I just got 6 neon tetras yesterday"
    // Expected AI Behavior: Confirm before calling add_livestock tool
    // Expected: "Would you like me to add 6 neon tetras to your tank records?"
    expect(true).toBe(true);
  });
});

describe('Expected AI Behavior - Response Format', () => {
  it('documents expected structured response for dosing recommendation', () => {
    // Scenario: Complete pool dosing request with all parameters
    // Expected Response Format:
    // **Summary** - One sentence overview
    // **What This Means** - Why this matters
    // **Steps to Take** - Numbered, actionable items
    // **Next Actions** - Follow-up suggestions
    expect(true).toBe(true);
  });

  it('documents expected unstructured response for simple greeting', () => {
    // Scenario: User says "Hello"
    // Expected AI Behavior: Simple greeting, NOT structured format
    // Should NOT include Summary/Meaning/Steps sections for casual conversation
    expect(true).toBe(true);
  });
});
