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
            enum: ["Filter", "Heater", "Light", "Pump", "Skimmer", "CO2 System", "Air Pump", "Wavemaker", "RO/DI System", "Auto Top Off", "Dosing Pump", "Reactor", "UV Sterilizer", "Chiller", "Controller", "Other"],
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
