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
      description: "Save an important fact about the user's setup, preferences, goals, treatments, or observations. You can save MULTIPLE memories per category — use descriptive keys. Proactively save important facts when users share them.",
      parameters: {
        type: "object",
        properties: {
          memory_key: {
            type: "string",
            description: "Short descriptive identifier for this memory (e.g., 'fluval_407', 'ich_treatment_jan', 'breeding_corydoras', 'ro_di_system')"
          },
          category: {
            type: "string",
            enum: ["equipment", "product", "water_source", "feeding", "maintenance", "preference", "livestock_care", "goal", "treatment_history", "problem_history", "species_note", "water_chemistry", "breeding", "other"],
            description: "Category grouping for this memory"
          },
          memory_value: {
            type: "string",
            description: "The fact to remember (e.g., 'Uses BRS 4-stage RO/DI system for water purification')"
          },
          water_type: {
            type: "string",
            enum: ["freshwater", "saltwater", "brackish", "universal"],
            description: "Which water type this applies to. Use 'universal' if it applies to all their tanks."
          },
          aquarium_id: {
            type: "string",
            description: "Optional: ID of the specific aquarium this memory applies to. Omit for facts that apply to all tanks."
          }
        },
        required: ["memory_key", "category", "memory_value", "water_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_equipment",
      description: "Add equipment to user's aquarium/pool profile. ACTIVELY USE THIS when user mentions ANY equipment they own or just purchased. Watch for: filter brands (Fluval, Eheim, AquaClear), heaters (Cobalt, Fluval), lights (AI Prime, Kessil, Fluval Plant), pumps (Tunze, Vortech), skimmers (Reef Octopus, Nyos), CO2 systems, ATO, dosing pumps, controllers (Apex, GHL). When detected: 1) Extract brand/model/type, 2) Confirm with user, 3) Call this tool after confirmation. Example triggers: 'I have a Fluval 407', 'running an AI Prime', 'just got an Apex controller', 'my Eheim heater'.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium to add equipment to" },
          name: { type: "string", description: "Full equipment name, e.g., 'Fluval 407 Canister Filter', 'AI Prime 16HD'" },
          equipment_type: {
            type: "string",
            enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Salt Chlorine Generator", "Pool Cleaner", "Other"],
            description: "Type of equipment - infer from context (e.g., 'Fluval 407' = Filter, 'AI Prime' = Light)"
          },
          brand: { type: "string", description: "Brand name (Fluval, Eheim, AI, Kessil, Neptune, etc.) - extract from equipment name" },
          model: { type: "string", description: "Model name/number (407, 2217, Prime 16HD, etc.) - extract from equipment name" },
          notes: { type: "string", description: "Any additional details like wattage, size, or special features" }
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
  },
  {
    type: "function",
    function: {
      name: "calculate_pool_volume",
      description: "Calculate the volume of a pool or spa based on shape and dimensions. Use this when user wants to figure out how many gallons their pool holds. Walk them through: shape (round/oval/rectangle/kidney), dimensions (diameter or length+width), depth (flat or sloped with shallow+deep), and optional refinements (water level, steps, bench). Always confirm before saving to their profile.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the pool/spa to update with calculated volume" },
          shape: { 
            type: "string", 
            enum: ["round", "oval", "rectangle", "kidney"],
            description: "Shape of the pool"
          },
          diameter_ft: { type: "number", description: "Diameter in feet (for round pools only)" },
          length_ft: { type: "number", description: "Length in feet (for rectangle/oval/kidney)" },
          width_ft: { type: "number", description: "Width in feet (for rectangle/oval/kidney)" },
          depth_type: { 
            type: "string", 
            enum: ["flat", "sloped"],
            description: "Whether pool has flat bottom or slopes from shallow to deep"
          },
          single_depth_ft: { type: "number", description: "Depth in feet (for flat-bottom pools)" },
          shallow_depth_ft: { type: "number", description: "Shallow end depth in feet (for sloped pools)" },
          deep_depth_ft: { type: "number", description: "Deep end depth in feet (for sloped pools)" },
          water_inches_below_top: { type: "number", description: "How many inches below the top is the water level (optional)" },
          has_steps: { type: "boolean", description: "Does the pool have built-in steps? (reduces volume slightly)" },
          has_bench: { type: "boolean", description: "Does the pool have a built-in bench or ledge? (reduces volume)" },
          has_sun_shelf: { type: "boolean", description: "Does the pool have a sun shelf/tanning ledge? (reduces volume)" },
          save_to_profile: { type: "boolean", description: "Whether to save the calculated volume to the pool profile. Only set true after user confirms." }
        },
        required: ["aquarium_id", "shape", "depth_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_equipment_batch",
      description: "Add MULTIPLE pieces of equipment at once. USE THIS instead of add_equipment when user mentions 2+ equipment items in one message. Examples: 'I have a Fluval 407, Fluval Plant 3.0, and Cobalt heater', 'running an Eheim 2217 and AI Prime', 'my setup includes a skimmer, return pump, and ATO'. Parse ALL equipment from the message, present a summary list for confirmation, then call this tool once to add everything.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium to add equipment to" },
          equipment_list: {
            type: "array",
            description: "Array of equipment items to add",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Full equipment name, e.g., 'Fluval 407 Canister Filter'" },
                equipment_type: {
                  type: "string",
                  enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Salt Chlorine Generator", "Pool Cleaner", "Other"],
                  description: "Type of equipment"
                },
                brand: { type: "string", description: "Brand name" },
                model: { type: "string", description: "Model name/number" },
                notes: { type: "string", description: "Any additional details" }
              },
              required: ["name", "equipment_type"]
            }
          }
        },
        required: ["aquarium_id", "equipment_list"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_fish_compatibility",
      description: "Check if a fish species is compatible with the user's existing tank inhabitants before they add it. Use when user asks about adding a specific fish, mentions getting a new fish, or asks if fish X goes with fish Y. Returns compatibility warnings about temperament, size, water parameters, fin nipping, predation risk, etc.",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: { type: "string", description: "ID of the aquarium to check compatibility for" },
          species_name: { type: "string", description: "Common or scientific name of the species to check (e.g., 'betta', 'neon tetra', 'oscar')" }
        },
        required: ["aquarium_id", "species_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_water_data",
      description: "Display a visual data card showing water test results and trends. ALWAYS use this when user asks about tank status, parameter trends, test results, or water quality - show visual cards instead of just describing numbers. Examples: 'how's my tank doing?', 'show me my pH', 'what were my last results?', 'is my ammonia okay?', 'how are my parameters?'",
      parameters: {
        type: "object",
        properties: {
          aquarium_id: {
            type: "string",
            description: "ID of the aquarium/pool/spa to show data for"
          },
          card_type: {
            type: "string",
            enum: ["latest_test", "parameter_trend", "tank_summary"],
            description: "Type of visualization: latest_test (most recent results), parameter_trend (history of specific params with sparklines), tank_summary (overview with key params and status)"
          },
          parameters: {
            type: "array",
            items: { type: "string" },
            description: "Which parameters to show (e.g., ['pH', 'Ammonia', 'Nitrate']). If omitted, shows most relevant for the water type."
          },
          days: {
            type: "number",
            description: "Days of history for trends. Default 30."
          }
        },
        required: ["aquarium_id", "card_type"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Search the expert knowledge base for detailed information about aquarium care, pool/spa maintenance, water chemistry, fish diseases, equipment, and more. Use this when you need specific technical information to give accurate advice. Examples: 'ich treatment protocols', 'reef tank calcium dosing', 'pool shock treatment guide', 'planted tank CO2 levels', 'betta fish care requirements'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language search query describing what information you need"
          },
          water_types: {
            type: "array",
            items: {
              type: "string",
              enum: ["freshwater", "saltwater", "reef", "pool", "spa"]
            },
            description: "Filter results to specific water types. Omit to search all."
          },
          categories: {
            type: "array",
            items: {
              type: "string",
              enum: ["fish_care", "water_chemistry", "disease", "equipment", "pool", "spa", "plants", "coral", "cycling", "maintenance"]
            },
            description: "Filter results to specific categories. Omit to search all."
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return. Default 5."
          }
        },
        required: ["query"],
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
