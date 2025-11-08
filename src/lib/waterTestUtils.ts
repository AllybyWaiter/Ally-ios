export interface ParameterRange {
  min: number;
  max: number;
  target?: { min: number; max: number };
  flagAbove?: number;
}

export interface Parameter {
  name: string;
  unit: string;
  range: ParameterRange;
}

export interface ParameterTemplate {
  id: string;
  name: string;
  parameters: Parameter[];
}

// Space-aware parameter templates
export const getParameterTemplates = (aquariumType: string): ParameterTemplate[] => {
  const type = aquariumType.toLowerCase();

  if (type === "freshwater" || type === "community") {
    return [
      {
        id: "freshwater-standard",
        name: "Freshwater Standard",
        parameters: [
          { name: "pH", unit: "", range: { min: 6.0, max: 8.5 } },
          { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrate", unit: "ppm", range: { min: 0, max: 100, flagAbove: 40 } },
          { name: "KH", unit: "dKH", range: { min: 1, max: 12 } },
          { name: "GH", unit: "dGH", range: { min: 3, max: 12 } },
          { name: "Temperature", unit: "°F", range: { min: 65, max: 82 } },
        ],
      },
    ];
  }

  if (type === "planted") {
    return [
      {
        id: "planted-tank",
        name: "Planted Tank",
        parameters: [
          { name: "pH", unit: "", range: { min: 6.0, max: 7.5 } },
          { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrate", unit: "ppm", range: { min: 5, max: 40 } },
          { name: "KH", unit: "dKH", range: { min: 3, max: 10 } },
          { name: "GH", unit: "dGH", range: { min: 4, max: 12 } },
          { name: "CO2", unit: "ppm", range: { min: 15, max: 35 } },
          { name: "Temperature", unit: "°F", range: { min: 72, max: 80 } },
        ],
      },
    ];
  }

  if (type === "saltwater" || type === "fowlr") {
    return [
      {
        id: "saltwater-fowlr",
        name: "Saltwater (FOWLR)",
        parameters: [
          { name: "pH", unit: "", range: { min: 7.8, max: 8.5 } },
          { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrate", unit: "ppm", range: { min: 0, max: 50, flagAbove: 20 } },
          { name: "Alkalinity", unit: "dKH", range: { min: 6.5, max: 12 } },
          { name: "Salinity", unit: "SG", range: { min: 1.023, max: 1.026 } },
          { name: "Temperature", unit: "°F", range: { min: 75, max: 80 } },
        ],
      },
    ];
  }

  if (type === "reef") {
    return [
      {
        id: "reef-standard",
        name: "Reef Standard",
        parameters: [
          { name: "pH", unit: "", range: { min: 7.8, max: 8.5 } },
          { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrate", unit: "ppm", range: { min: 0, max: 50, flagAbove: 10 } },
          { name: "Alkalinity", unit: "dKH", range: { min: 6.5, max: 12 } },
          { name: "Calcium", unit: "ppm", range: { min: 350, max: 500 } },
          { name: "Magnesium", unit: "ppm", range: { min: 1200, max: 1500 } },
          { name: "Phosphate", unit: "ppm", range: { min: 0, max: 0.3, flagAbove: 0.1 } },
          { name: "Salinity", unit: "SG", range: { min: 1.023, max: 1.026 } },
          { name: "Temperature", unit: "°F", range: { min: 75, max: 80 } },
        ],
      },
    ];
  }

  if (type === "pond") {
    return [
      {
        id: "pond-standard",
        name: "Pond Standard",
        parameters: [
          { name: "pH", unit: "", range: { min: 6.5, max: 8.5 } },
          { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0, flagAbove: 0.25 } },
          { name: "Nitrate", unit: "ppm", range: { min: 0, max: 100, flagAbove: 50 } },
          { name: "KH", unit: "dKH", range: { min: 3, max: 10 } },
          { name: "GH", unit: "dGH", range: { min: 4, max: 12 } },
          { name: "Temperature", unit: "°F", range: { min: 50, max: 85 } },
        ],
      },
    ];
  }

  if (type === "pool" || type === "spa") {
    return [
      {
        id: "pool-standard",
        name: "Pool Standard",
        parameters: [
          { name: "Free Chlorine", unit: "ppm", range: { min: 1, max: 3 } },
          { name: "Total Chlorine", unit: "ppm", range: { min: 1, max: 5 } },
          { name: "pH", unit: "", range: { min: 7.2, max: 7.8 } },
          { name: "Alkalinity", unit: "ppm", range: { min: 80, max: 120 } },
          { name: "Calcium Hardness", unit: "ppm", range: { min: 200, max: 400 } },
          { name: "Cyanuric Acid", unit: "ppm", range: { min: 30, max: 50 } },
          { name: "Temperature", unit: "°F", range: { min: 78, max: 84 } },
        ],
      },
    ];
  }

  // Default fallback
  return [
    {
      id: "basic",
      name: "Basic Parameters",
      parameters: [
        { name: "pH", unit: "", range: { min: 6.0, max: 8.5 } },
        { name: "Ammonia", unit: "ppm", range: { min: 0, max: 5.0 } },
        { name: "Nitrite", unit: "ppm", range: { min: 0, max: 5.0 } },
        { name: "Nitrate", unit: "ppm", range: { min: 0, max: 100 } },
        { name: "Temperature", unit: "°F", range: { min: 65, max: 85 } },
      ],
    },
  ];
};

// Validation function with context hints
export const validateParameter = (
  paramName: string,
  value: number,
  aquariumType: string
): { isValid: boolean; hint?: string } => {
  const templates = getParameterTemplates(aquariumType);
  const param = templates[0]?.parameters.find((p) => p.name === paramName);

  if (!param) return { isValid: true };

  const { range } = param;

  // Check if value is outside acceptable range
  if (value < range.min || value > range.max) {
    return {
      isValid: false,
      hint: `Value should be between ${range.min} and ${range.max} ${param.unit}`,
    };
  }

  // Check flag thresholds
  if (range.flagAbove && value > range.flagAbove) {
    const type = aquariumType.toLowerCase();
    let contextHint = "";

    if (paramName === "Nitrate" && type === "reef") {
      contextHint = `Nitrate a bit high for reef (target < 10 ppm)`;
    } else if (paramName === "Nitrate" && value > 40) {
      contextHint = `Nitrate elevated (consider water change)`;
    } else if (paramName === "Ammonia" && value > 0.25) {
      contextHint = `Ammonia detected - dangerous for fish/corals`;
    } else if (paramName === "Nitrite" && value > 0.25) {
      contextHint = `Nitrite detected - toxic to aquatic life`;
    } else if (paramName === "Phosphate" && value > 0.1) {
      contextHint = `Phosphate high (may cause algae growth)`;
    }

    if (contextHint) {
      return { isValid: false, hint: contextHint };
    }
  }

  return { isValid: true };
};
