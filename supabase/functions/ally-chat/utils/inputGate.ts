/**
 * Input Gate - Validates required inputs for dosing and treatment conversations
 * 
 * Detects when users are asking about dosing chemicals or treating fish,
 * and ensures all required inputs are present before allowing the model to proceed.
 */

interface Message {
  role: string;
  content: string;
  imageUrl?: string;
}

interface AquariumContext {
  waterType: string | null;
  aquariumData?: {
    type?: string;
    volume_gallons?: number;
  } | null;
}

type ConversationType = 'pool_dosing' | 'spa_dosing' | 'aquarium_treatment' | 'general';

interface InputValidationResult {
  conversationType: ConversationType;
  missingInputs: string[];
  detectedInputs: Record<string, boolean>;
  requiresGate: boolean;
  gateInstructions?: string;
}

interface AquaticScopeResult {
  isInScope: boolean;
  redirectMessage?: string;
  reason?: string;
}

const CRITICAL_REQUIRED_INPUTS: Record<Exclude<ConversationType, 'general'>, string[]> = {
  pool_dosing: ['volume', 'free_chlorine', 'combined_chlorine', 'ph', 'alkalinity', 'cya', 'sanitizer_type'],
  spa_dosing: ['volume', 'sanitizer_level', 'ph', 'alkalinity', 'sanitizer_type'],
  aquarium_treatment: ['species', 'tank_size', 'ammonia', 'nitrite', 'nitrate', 'temperature', 'symptoms', 'timeline'],
};

// Keywords that indicate dosing/treatment intent
const POOL_DOSING_KEYWORDS = [
  'add chlorine', 'shock', 'balance', 'dose', 'how much', 'dosage',
  'raise ph', 'lower ph', 'add muriatic', 'add acid', 'add soda ash',
  'add stabilizer', 'add cya', 'chlorinate', 'add salt', 'super chlorinate',
  'algaecide', 'clarifier', 'how many pounds', 'how many ounces', 'how many gallons'
];

const SPA_DOSING_KEYWORDS = [
  'add bromine', 'add chlorine', 'shock spa', 'shock hot tub', 'balance spa',
  'spa chemicals', 'hot tub dose', 'spa dose', 'sanitize spa', 'sanitize hot tub'
];

const AQUARIUM_TREATMENT_KEYWORDS = [
  'medication', 'treat', 'sick fish', 'disease', 'ich treatment', 'fin rot',
  'fungus', 'parasite', 'quarantine', 'medicate', 'salt dip', 'salt treatment',
  'kanaplex', 'metroplex', 'general cure', 'ich-x', 'erythromycin', 'prazipro',
  'melafix', 'pimafix', 'maracyn', 'api treatment', 'seachem treatment',
  'dying fish', 'fish dying', 'white spots', 'red streaks', 'bloated', 'dropsy'
];

// Required inputs for different conversation types
const POOL_DOSING_REQUIREMENTS = {
  volume: ['volume', 'gallons', 'liters', 'pool size', 'how big', 'pool is about'],
  free_chlorine: ['free chlorine', 'fc', 'chlorine level', 'chlorine is'],
  combined_chlorine: ['combined chlorine', 'cc', 'chloramines'],
  ph: ['ph is', 'ph level', 'ph reading', 'ph at'],
  alkalinity: ['alkalinity', 'total alk', 'ta is', 'alk is'],
  cya: ['cya', 'cyanuric', 'stabilizer', 'conditioner level'],
  sanitizer_type: ['chlorine pool', 'salt pool', 'saltwater pool', 'bromine']
};

const SPA_DOSING_REQUIREMENTS = {
  volume: ['volume', 'gallons', 'liters', 'spa size', 'hot tub size', 'holds about'],
  sanitizer_level: ['chlorine', 'bromine', 'sanitizer level'],
  ph: ['ph is', 'ph level', 'ph reading', 'ph at'],
  alkalinity: ['alkalinity', 'total alk', 'ta is', 'alk is'],
  sanitizer_type: ['chlorine spa', 'bromine spa', 'salt spa']
};

const AQUARIUM_TREATMENT_REQUIREMENTS = {
  species: ['species', 'fish', 'betta', 'goldfish', 'cichlid', 'guppy', 'tetra', 'barb', 'pleco', 'cory', 'shrimp', 'snail'],
  tank_size: ['gallon', 'liter', 'tank size', 'tank is'],
  ammonia: ['ammonia'],
  nitrite: ['nitrite'],
  nitrate: ['nitrate'],
  temperature: ['temp', 'temperature', 'degrees', '°f', '°c'],
  symptoms: ['symptoms', 'showing', 'noticed', 'looks like', 'appears', 'acting', 'behavior'],
  timeline: ['started', 'days ago', 'weeks ago', 'yesterday', 'this morning', 'recently', 'suddenly', 'gradually']
};

const SALTWATER_ADDITIONAL = {
  salinity: ['salinity', 'sg', 'specific gravity', 'ppt']
};

const AQUATIC_DOMAIN_KEYWORDS = [
  'aquatic', 'aquarium', 'tank', 'fish', 'reef', 'coral', 'freshwater', 'saltwater', 'brackish',
  'pond', 'koi', 'goldfish', 'ammonia', 'nitrite', 'nitrate', 'ph', 'alkalinity', 'kh', 'gh',
  'salinity', 'specific gravity', 'sg', 'filter', 'skimmer', 'heater', 'co2', 'dosing',
  'chlorine', 'bromine', 'cyanuric', 'cya', 'pool', 'spa', 'hot tub', 'pump'
];

const SOFT_INTERACTION_PATTERNS = [
  /^(hi|hello|hey|yo|sup|what'?s up)[!.?\s]*$/i,
  /^(thanks|thank you|thx|ok|okay|got it|sounds good|cool|nice)[!.?\s]*$/i,
  /^(yes|yeah|yep|no|nope|sure|go ahead|continue|more|retry|again)[!.?\s]*$/i,
  /^(help|assist me|can you help)[!.?\s]*$/i,
];

function hasAquaticKeyword(text: string): boolean {
  const normalized = text.toLowerCase();
  return AQUATIC_DOMAIN_KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Detect if the conversation is about dosing or treatment
 */
function detectConversationType(messages: Message[], waterType: string | null): ConversationType {
  // Get last 3 user messages to check for intent
  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Check for pool dosing
  if (POOL_DOSING_KEYWORDS.some(kw => recentUserMessages.includes(kw))) {
    if (waterType === 'pool') return 'pool_dosing';
    // Also check if message mentions pool explicitly
    if (recentUserMessages.includes('pool')) return 'pool_dosing';
  }

  // Check for spa dosing
  if (SPA_DOSING_KEYWORDS.some(kw => recentUserMessages.includes(kw))) {
    if (waterType === 'spa') return 'spa_dosing';
    if (recentUserMessages.includes('spa') || recentUserMessages.includes('hot tub')) return 'spa_dosing';
  }

  // Check for aquarium treatment
  if (AQUARIUM_TREATMENT_KEYWORDS.some(kw => recentUserMessages.includes(kw))) {
    if (['freshwater', 'saltwater', 'brackish'].includes(waterType || '')) return 'aquarium_treatment';
    // Also check if discussing fish explicitly
    if (recentUserMessages.includes('fish') || recentUserMessages.includes('tank')) return 'aquarium_treatment';
  }

  return 'general';
}

/**
 * Check which required inputs are present in the conversation
 */
function detectInputsInConversation(
  messages: Message[],
  requirements: Record<string, string[]>
): Record<string, boolean> {
  // Only user-provided content should satisfy safety requirements.
  // Assistant questions/prompts must not count as user inputs.
  const allText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const detected: Record<string, boolean> = {};

  for (const [key, keywords] of Object.entries(requirements)) {
    detected[key] = keywords.some(kw => allText.includes(kw));
  }

  return detected;
}

/**
 * Get list of missing required inputs
 */
function getMissingInputs(detectedInputs: Record<string, boolean>): string[] {
  return Object.entries(detectedInputs)
    .filter(([_, found]) => !found)
    .map(([key, _]) => key.replace(/_/g, ' '));
}

/**
 * Generate instructions for the AI to ask about missing inputs
 */
function generateGateInstructions(
  conversationType: ConversationType,
  missingInputs: string[]
): string {
  if (missingInputs.length === 0) return '';

  const formattedMissing = missingInputs.map(input => `**${input}**`).join(', ');

  const baseInstruction = `
CRITICAL INPUT GATE - BEFORE PROVIDING DOSING/TREATMENT ADVICE:

You are missing required information: ${formattedMissing}

DO NOT provide specific dosing amounts or treatment recommendations until you have ALL required information.

Instead, respond with:
1. Acknowledge what the user is trying to do
2. Explain that you need a few more details to give safe, accurate advice
3. Ask specifically about the missing items listed above
4. Format as a friendly, brief question

Example format:
"I'd be happy to help with that! To give you accurate dosing recommendations, I need to know:
- [missing item 1]
- [missing item 2]

Could you share those details?"
`;

  // Add context-specific guidance
  if (conversationType === 'pool_dosing') {
    return baseInstruction + `

FOR POOL DOSING, always require:
- Pool volume (gallons)
- Current free chlorine and combined chlorine levels
- Current pH
- Total alkalinity
- CYA/stabilizer level
- Sanitizer type (chlorine, salt, etc.)

If user doesn't know pool volume, offer to help calculate it using the calculate_pool_volume tool.
`;
  }

  if (conversationType === 'spa_dosing') {
    return baseInstruction + `

FOR SPA/HOT TUB DOSING, always require:
- Spa volume (gallons)
- Current sanitizer level (chlorine or bromine)
- Current pH
- Total alkalinity
- Sanitizer type being used
`;
  }

  if (conversationType === 'aquarium_treatment') {
    return baseInstruction + `

FOR AQUARIUM TREATMENT, always require:
- What species/fish are affected
- Tank size (gallons)
- Current ammonia, nitrite, nitrate levels
- Water temperature
- Specific symptoms observed
- When symptoms started (timeline)
- For saltwater: also need salinity

If symptoms sound serious, recommend consulting an aquatic veterinarian.
`;
  }

  return baseInstruction;
}

/**
 * Main input validation function
 * 
 * Analyzes the conversation to detect dosing/treatment intent and
 * validates that all required inputs are present.
 */
export function validateRequiredInputs(
  messages: Message[],
  aquariumContext: AquariumContext
): InputValidationResult {
  const waterType = aquariumContext.waterType;
  const conversationType = detectConversationType(messages, waterType);

  // If it's a general conversation, no gate needed
  if (conversationType === 'general') {
    return {
      conversationType,
      missingInputs: [],
      detectedInputs: {},
      requiresGate: false
    };
  }

  // Determine which requirements to check
  let requirements: Record<string, string[]>;

  switch (conversationType) {
    case 'pool_dosing':
      requirements = POOL_DOSING_REQUIREMENTS;
      break;
    case 'spa_dosing':
      requirements = SPA_DOSING_REQUIREMENTS;
      break;
    case 'aquarium_treatment':
      requirements = AQUARIUM_TREATMENT_REQUIREMENTS;
      // Add salinity for saltwater
      if (waterType === 'saltwater' || waterType === 'brackish') {
        requirements = { ...requirements, ...SALTWATER_ADDITIONAL };
      }
      break;
    default:
      requirements = {};
  }

  // Check if volume is already known from aquarium context
  if (aquariumContext.aquariumData?.volume_gallons) {
    requirements = { ...requirements };
    delete requirements.volume;
    delete requirements.tank_size;
  }

  // If the water type is already known from selected context, sanitizer type is implied.
  if (conversationType === 'pool_dosing' && waterType === 'pool') {
    requirements = { ...requirements };
    delete requirements.sanitizer_type;
  }
  if (conversationType === 'spa_dosing' && waterType === 'spa') {
    requirements = { ...requirements };
    delete requirements.sanitizer_type;
  }

  const detectedInputs = detectInputsInConversation(messages, requirements);
  const missingInputs = getMissingInputs(detectedInputs);

  // Safety-first: if ANY required critical input is missing, enforce the gate.
  const criticalInputs = [...(CRITICAL_REQUIRED_INPUTS[conversationType as Exclude<ConversationType, 'general'>] || [])];
  if (conversationType === 'aquarium_treatment' && (waterType === 'saltwater' || waterType === 'brackish')) {
    criticalInputs.push('salinity');
  }

  const missingSet = new Set(missingInputs.map(input => input.replace(/ /g, '_')));
  const criticalMissingCount = criticalInputs.filter(input => missingSet.has(input)).length;
  const requiresGate = criticalMissingCount > 0;

  return {
    conversationType,
    missingInputs,
    detectedInputs,
    requiresGate,
    gateInstructions: requiresGate ? generateGateInstructions(conversationType, missingInputs) : undefined
  };
}

/**
 * Enforce aquatics-only scope for Ally chat.
 * Allows short follow-ups during an active aquatics conversation.
 */
export function validateAquaticScope(messages: Message[]): AquaticScopeResult {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    return { isInScope: true };
  }

  if (lastUserMessage.imageUrl) {
    return { isInScope: true };
  }

  const lastText = (lastUserMessage.content || '').trim().toLowerCase();
  if (!lastText) {
    return { isInScope: true };
  }

  const recentUserText = userMessages
    .slice(-4)
    .map(m => (m.content || '').toLowerCase())
    .join(' ');

  const lastIsAquatic = hasAquaticKeyword(lastText);
  const recentHasAquaticContext = hasAquaticKeyword(recentUserText);
  const isSoftInteraction = SOFT_INTERACTION_PATTERNS.some(pattern => pattern.test(lastText));

  if (lastIsAquatic) {
    return { isInScope: true };
  }

  // Keep normal back-and-forth flowing once the user is already in aquatics context
  if (recentHasAquaticContext && (isSoftInteraction || lastText.split(/\s+/).length <= 6)) {
    return { isInScope: true };
  }

  return {
    isInScope: false,
    reason: 'off_topic',
    redirectMessage:
      "I can only help with aquatics topics: aquariums, pools, spas, and ponds. Ask me about water chemistry, livestock health, equipment, maintenance, or dosing."
  };
}
