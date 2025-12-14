/**
 * Data Access Layer Index
 * 
 * Central export point for all data access functions.
 */

export * from './aquariums';
export * from './waterTests';
export * from './tasks';
export * from './equipment';
export * from './livestock';
export * from './plants';
export * from './feedback';
export * from './permissions';
// Export specific function from maintenanceTasks to avoid conflict with tasks.ts
export { createMaintenanceTask } from './maintenanceTasks';
