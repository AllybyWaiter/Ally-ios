/**
 * Ally Chat Tool Definitions
 * 
 * Tools that Ally can use to interact with user data.
 */

export const tools = [
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Save an important fact about the user's aquarium setup, preferences, products they use, or practices. Use this when the user shares information worth remembering for future conversations. Examples: water source (RO/DI, tap), products they use, feeding schedules, equipment brands, maintenance routines.",
      parameters: {
        type: "object",
        properties: {
          memory_key: { 
            type: "string", 
            enum: ["equipment", "product", "water_source", "feeding", "maintenance", "preference", "livestock_care", "other"],
            description: "Category of the memory"
          },
          memory_value: { 
            type: "string", 
            description: "The fact to remember (e.g., 'Uses BRS 4-stage RO/DI system for water purification')"
          },
          water_type: { 
            type: "string", 
            enum: ["freshwater", "saltwater", "brackish", "universal"],
            description: "Which water type this applies to. Use 'universal' if it applies to all their tanks."
          }
        },
        required: ["memory_key", "memory_value", "water_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "add_equipment",
      description: "Add a piece of equipment to the user's aquarium. Use when user mentions they have specific equipment that should be formally tracked in their tank profile.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium to add equipment to" },
          name: { type: "string", description: "Name of the equipment" },
          equipment_type: { 
            type: "string", 
            enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Salt Chlorine Generator", "Pool Cleaner", "Other"],
            description: "Type of equipment"
          },
          brand: { type: "string", description: "Brand name if mentioned" },
          model: { type: "string", description: "Model name/number if mentioned" },
          notes: { type: "string", description: "Any additional details" }
        },
        required: ["aquarium_id", "name", "equipment_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a maintenance task for the user's aquarium, pool, or spa. Use when user mentions needing to do something, wants a reminder, or asks you to schedule maintenance. Examples: 'remind me to water change Saturday', 'schedule filter cleaning next week', 'I need to shock the pool tomorrow'.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium/pool/spa" },
          task_name: { type: "string", description: "Name of the task (e.g., 'Water Change', 'Filter Cleaning', 'Shock Treatment')" },
          task_type: { 
            type: "string", 
            enum: ["water_change", "filter_maintenance", "equipment_check", "water_test", "feeding", "cleaning", "dosing", "plant_care", "health_check", "shock_treatment", "chemical_balance", "winterization", "other"],
            description: "Type of maintenance task"
          },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
          notes: { type: "string", description: "Any additional details or instructions" },
          is_recurring: { type: "boolean", description: "Whether this task should repeat" },
          recurrence_interval: { 
            type: "string", 
            enum: ["daily", "weekly", "biweekly", "monthly", "custom"],
            description: "How often the task repeats (if recurring)"
          },
          recurrence_days: { type: "number", description: "Custom recurrence interval in days (only if recurrence_interval is 'custom')" }
        },
        required: ["aquarium_id", "task_name", "task_type", "due_date"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "log_water_test",
      description: "Log water test parameters mentioned by the user. Use when user shares their water test results in conversation. Examples: 'just tested - pH 7.2, ammonia 0, nitrate 15', 'my alkalinity is at 9 dKH', 'chlorine is at 2ppm'.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium/pool/spa" },
          ph: { type: "number", description: "pH level" },
          ammonia: { type: "number", description: "Ammonia in ppm" },
          nitrite: { type: "number", description: "Nitrite in ppm" },
          nitrate: { type: "number", description: "Nitrate in ppm" },
          temperature: { type: "number", description: "Temperature (in user's preferred unit)" },
          gh: { type: "number", description: "General Hardness in dGH" },
          kh: { type: "number", description: "Carbonate Hardness in dKH" },
          salinity: { type: "number", description: "Salinity in ppt or SG" },
          alkalinity: { type: "number", description: "Alkalinity in dKH (reef/saltwater)" },
          calcium: { type: "number", description: "Calcium in ppm (reef)" },
          magnesium: { type: "number", description: "Magnesium in ppm (reef)" },
          phosphate: { type: "number", description: "Phosphate in ppm" },
          free_chlorine: { type: "number", description: "Free chlorine in ppm (pools)" },
          total_chlorine: { type: "number", description: "Total chlorine in ppm (pools)" },
          bromine: { type: "number", description: "Bromine in ppm (spas)" },
          cyanuric_acid: { type: "number", description: "Cyanuric acid/stabilizer in ppm (pools)" },
          calcium_hardness: { type: "number", description: "Calcium hardness in ppm (pools)" },
          salt: { type: "number", description: "Salt level in ppm (saltwater pools)" },
          notes: { type: "string", description: "Any additional notes about the test" }
        },
        required: ["aquarium_id"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_livestock",
      description: "Add fish, invertebrates, or corals to the user's aquarium. Use when user mentions getting new livestock. Examples: 'I just got 6 neon tetras', 'added a cleanup crew - 3 nerite snails', 'picked up a new clownfish'.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium" },
          name: { type: "string", description: "Common name for this livestock (e.g., 'Neon Tetras', 'Cleanup Crew')" },
          species: { type: "string", description: "Species name if known (e.g., 'Paracheirodon innesi', 'Neritina natalensis')" },
          category: { 
            type: "string", 
            enum: ["fish", "invertebrate", "coral"],
            description: "Category of livestock"
          },
          quantity: { type: "number", description: "Number of individuals" },
          notes: { type: "string", description: "Any additional details (size, color morph, source, etc.)" }
        },
        required: ["aquarium_id", "name", "species", "category", "quantity"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_plant",
      description: "Add plants to the user's aquarium. Use when user mentions getting new plants. Examples: 'planted some java fern on the driftwood', 'got a red tiger lotus', 'added some monte carlo for carpeting'.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium" },
          name: { type: "string", description: "Common name for this plant (e.g., 'Java Fern', 'Monte Carlo')" },
          species: { type: "string", description: "Species name if known (e.g., 'Microsorum pteropus', 'Micranthemum tweediei')" },
          quantity: { type: "number", description: "Number of plants or portions" },
          placement: { 
            type: "string", 
            enum: ["foreground", "midground", "background", "floating", "attached"],
            description: "Where the plant is placed in the tank"
          },
          notes: { type: "string", description: "Any additional details (lighting needs, CO2 requirements, etc.)" }
        },
        required: ["aquarium_id", "name", "species", "quantity"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_livestock",
      description: "Update existing livestock in the user's aquarium. Use when user mentions changes to their livestock - deaths, health changes, quantity changes, or corrections to details. Examples: 'lost a neon tetra', 'one of my fish died', 'my betta looks sick', 'actually I have 8 not 6', 'the clownfish seems stressed'.",
      parameters: {
        type: "object",
        properties: {
          livestock_id: { type: "string", description: "ID of the livestock to update (get from context)" },
          quantity: { type: "number", description: "New quantity (if changed)" },
          health_status: { 
            type: "string", 
            enum: ["healthy", "sick", "stressed", "quarantine", "deceased"],
            description: "New health status"
          },
          name: { type: "string", description: "Updated common name (if correcting)" },
          species: { type: "string", description: "Updated species name (if correcting)" },
          notes: { type: "string", description: "Updated notes" }
        },
        required: ["livestock_id"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_plant",
      description: "Update existing plants in the user's aquarium. Use when user mentions changes to their plants - health changes, quantity changes, placement moves, or corrections. Examples: 'my java fern is melting', 'lost a few stems of rotala', 'moved the anubias to the back', 'the carpet is thriving now'.",
      parameters: {
        type: "object",
        properties: {
          plant_id: { type: "string", description: "ID of the plant to update (get from context)" },
          quantity: { type: "number", description: "New quantity (if changed)" },
          condition: { 
            type: "string", 
            enum: ["thriving", "healthy", "growing", "struggling", "melting", "dead"],
            description: "Plant health condition"
          },
          placement: { 
            type: "string", 
            enum: ["foreground", "midground", "background", "floating", "attached"],
            description: "New placement location (if moved)"
          },
          name: { type: "string", description: "Updated common name (if correcting)" },
          species: { type: "string", description: "Updated species name (if correcting)" },
          notes: { type: "string", description: "Updated notes" }
        },
        required: ["plant_id"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_equipment",
      description: "Update existing equipment in the user's aquarium. Use when user mentions changes to their equipment - maintenance performed, corrections to details, or schedule changes. Examples: 'just cleaned my filter', 'that heater is 300W not 200W', 'check skimmer monthly now', 'it's a Tunze not Jebao'.",
      parameters: {
        type: "object",
        properties: {
          equipment_id: { type: "string", description: "ID of the equipment to update (get from context)" },
          name: { type: "string", description: "Updated equipment name (if correcting)" },
          equipment_type: { 
            type: "string", 
            enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Salt Chlorine Generator", "Pool Cleaner", "Other"],
            description: "Updated equipment type (if correcting)"
          },
          brand: { type: "string", description: "Updated brand name (if correcting)" },
          model: { type: "string", description: "Updated model name/number (if correcting)" },
          maintenance_interval_days: { type: "number", description: "New maintenance interval in days" },
          last_maintenance_date: { type: "string", description: "Date of last maintenance (YYYY-MM-DD format) - use today's date when user says they just cleaned/serviced something" },
          notes: { type: "string", description: "Updated notes" }
        },
        required: ["equipment_id"],
        additionalProperties: false
      }
    }
  }
];

/**
 * Map aquarium types to water types
 */
export function getWaterType(aquariumType: string): string {
  const saltwaterTypes = ['reef', 'marine', 'saltwater', 'fowlr'];
  const brackishTypes = ['brackish'];
  
  if (saltwaterTypes.includes(aquariumType?.toLowerCase())) return 'saltwater';
  if (brackishTypes.includes(aquariumType?.toLowerCase())) return 'brackish';
  return 'freshwater';
}
