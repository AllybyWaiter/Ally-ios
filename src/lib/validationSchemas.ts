/**
 * Centralized Zod Validation Schemas
 *
 * Server-side validation schemas for user-submitted data.
 * These schemas are used to validate data before it's sent to Supabase,
 * providing an extra layer of security beyond client-side form validation.
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Non-empty trimmed string */
export const nonEmptyString = z.string().trim().min(1, 'Required');

/** Optional string that trims whitespace */
export const optionalString = z.string().trim().optional();

/** ISO date string */
export const isoDateString = z.string().datetime({ message: 'Invalid date format' }).optional();

/** Date string in YYYY-MM-DD format */
export const dateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional();

// ==================== Aquarium Schemas ====================

export const aquariumTypeSchema = z.enum([
  'freshwater',
  'saltwater',
  'reef',
  'planted',
  'brackish',
  'pond',
  'pool',
  'spa',
  'hot_tub',
]);

export const aquariumStatusSchema = z.enum(['active', 'cycling', 'inactive', 'maintenance']);

export const createAquariumSchema = z.object({
  name: nonEmptyString.max(100, 'Name must be 100 characters or less'),
  type: aquariumTypeSchema,
  volume_gallons: z.number().positive('Volume must be positive').max(1000000, 'Volume too large').optional(),
  status: aquariumStatusSchema.optional().default('active'),
  setup_date: dateOnlyString,
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
  user_id: uuidSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location_name: z.string().max(200).optional(),
});

export type CreateAquariumInput = z.infer<typeof createAquariumSchema>;

// ==================== Livestock Schemas ====================

export const livestockHealthStatusSchema = z.enum(['healthy', 'sick', 'recovering', 'quarantine']);

export const livestockCategorySchema = z.enum([
  'fish',
  'invertebrate',
  'coral',
  'anemone',
  'crustacean',
  'mollusk',
  'other',
]);

export const createLivestockSchema = z.object({
  aquarium_id: uuidSchema,
  user_id: uuidSchema,
  name: nonEmptyString.max(100, 'Name must be 100 characters or less'),
  species: nonEmptyString.max(100, 'Species must be 100 characters or less'),
  category: livestockCategorySchema,
  quantity: z.number().int().positive('Quantity must be positive').max(10000, 'Quantity too large').optional().default(1),
  date_added: dateOnlyString,
  health_status: livestockHealthStatusSchema.optional().default('healthy'),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
});

export type CreateLivestockInput = z.infer<typeof createLivestockSchema>;

// ==================== Plant Schemas ====================

export const plantPlacementSchema = z.enum(['foreground', 'midground', 'background', 'floating', 'carpeting', 'other']);

export const plantConditionSchema = z.enum(['excellent', 'good', 'fair', 'poor', 'new']);

export const createPlantSchema = z.object({
  aquarium_id: uuidSchema,
  user_id: uuidSchema,
  name: nonEmptyString.max(100, 'Name must be 100 characters or less'),
  species: nonEmptyString.max(100, 'Species must be 100 characters or less'),
  placement: plantPlacementSchema.optional().default('midground'),
  quantity: z.number().int().positive('Quantity must be positive').max(10000, 'Quantity too large').optional().default(1),
  date_added: dateOnlyString,
  condition: plantConditionSchema.optional().default('good'),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;

// ==================== Water Test Schemas ====================

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low']);

export const entryMethodSchema = z.enum(['manual', 'photo', 'api', 'import']);

export const parameterStatusSchema = z.enum(['optimal', 'acceptable', 'warning', 'danger']);

export const testParameterSchema = z.object({
  parameter_name: nonEmptyString.max(50, 'Parameter name must be 50 characters or less'),
  value: z.number().finite('Value must be a finite number'),
  unit: nonEmptyString.max(20, 'Unit must be 20 characters or less'),
  status: parameterStatusSchema.optional(),
});

export const createWaterTestSchema = z.object({
  aquarium_id: uuidSchema,
  user_id: uuidSchema,
  test_date: isoDateString,
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),
  confidence: confidenceLevelSchema.optional(),
  entry_method: entryMethodSchema.optional(),
  photo_url: z.string().url('Invalid photo URL').optional(),
});

export const createWaterTestWithParametersSchema = z.object({
  test: createWaterTestSchema,
  parameters: z.array(testParameterSchema).max(50, 'Maximum 50 parameters allowed'),
});

export type CreateWaterTestInput = z.infer<typeof createWaterTestSchema>;
export type TestParameterInput = z.infer<typeof testParameterSchema>;
export type CreateWaterTestWithParametersInput = z.infer<typeof createWaterTestWithParametersSchema>;

// ==================== Equipment Schemas ====================

export const equipmentTypeSchema = z.enum([
  // Aquarium equipment
  'Filter',
  'Heater',
  'Light',
  'Pump',
  'Protein Skimmer',
  'UV Sterilizer',
  'CO2 System',
  'Dosing Pump',
  'Wave Maker',
  'Chiller',
  // Pool equipment
  'Pool Pump',
  'Pool Filter',
  'Pool Heater',
  'Salt Chlorine Generator',
  'Chlorinator',
  'Pool Cleaner',
  'Skimmer',
  'Return Jets',
  'Pool Light',
  'Solar Cover',
  'Heat Pump',
  'Ozone Generator',
  'Chemical Feeder',
  'Automation System',
  'Variable Speed Pump',
  'Other',
]);

export const createEquipmentSchema = z.object({
  aquarium_id: uuidSchema,
  name: nonEmptyString.max(100, 'Name must be 100 characters or less'),
  equipment_type: equipmentTypeSchema,
  brand: z.string().max(100, 'Brand must be 100 characters or less').optional(),
  model: z.string().max(100, 'Model must be 100 characters or less').optional(),
  install_date: dateOnlyString,
  maintenance_interval_days: z.number().int().positive().max(3650, 'Interval must be less than 10 years').optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

// ==================== Validation Helpers ====================

/**
 * Validates input data against a schema and returns the result
 * Returns { success: true, data } if valid, or { success: false, error } if invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}

/**
 * Validates input data and throws a descriptive error if invalid
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, entityName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid ${entityName}: ${errors}`);
  }
  return result.data;
}

// ==================== Response Validation Schemas ====================

/**
 * Schemas for validating API responses (Supabase data)
 * These are more lenient than input schemas since we trust the database
 * but want to catch schema drift or unexpected data
 */

export const aquariumResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: z.string(),
  volume_gallons: z.number().nullable(),
  primary_photo_url: z.string().nullable().optional(),
  status: z.string().nullable(),
  setup_date: z.string().nullable(),
  notes: z.string().nullable(),
  user_id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  location_name: z.string().nullable(),
});

export const livestockResponseSchema = z.object({
  id: uuidSchema,
  aquarium_id: uuidSchema,
  user_id: uuidSchema,
  name: z.string(),
  species: z.string(),
  category: z.string(),
  quantity: z.number(),
  date_added: z.string(),
  health_status: z.string(),
  notes: z.string().nullable(),
  primary_photo_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const plantResponseSchema = z.object({
  id: uuidSchema,
  aquarium_id: uuidSchema,
  user_id: uuidSchema,
  name: z.string(),
  species: z.string(),
  placement: z.string(),
  quantity: z.number(),
  date_added: z.string(),
  condition: z.string(),
  notes: z.string().nullable(),
  primary_photo_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AquariumResponse = z.infer<typeof aquariumResponseSchema>;
export type LivestockResponse = z.infer<typeof livestockResponseSchema>;
export type PlantResponse = z.infer<typeof plantResponseSchema>;
