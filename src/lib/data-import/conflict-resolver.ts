/**
 * Data Import Conflict Resolution
 *
 * Detects and resolves conflicts when importing profile data
 * PRD Reference: Part 2 F2 - Data Portability with conflict resolution
 */

import { log } from '@/lib/log';

export type MergeStrategy =
  | 'keep_existing' // Keep current data, discard import
  | 'overwrite' // Replace with import data
  | 'merge' // Smart merge (arrays combine, objects deep merge)
  | 'newer' // Keep whichever is more recent
  | 'manual'; // User must manually resolve

export interface DataConflict {
  field: string;
  path: string; // JSON path (e.g., "profile.individual.bio")
  existingValue: any;
  importValue: any;
  existingUpdatedAt?: Date;
  importUpdatedAt?: Date;
  conflictType: 'different_value' | 'array_overlap' | 'missing_in_existing' | 'missing_in_import';
  suggestedStrategy: MergeStrategy;
  description: string;
}

export interface ConflictResolution {
  conflicts: DataConflict[];
  autoResolvable: number;
  requiresManual: number;
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between existing and import data
 */
export function detectConflicts(
  existingData: any,
  importData: any,
  basePath: string = ''
): DataConflict[] {
  const conflicts: DataConflict[] = [];

  // Handle null/undefined cases
  if (existingData === null || existingData === undefined) {
    if (importData !== null && importData !== undefined) {
      conflicts.push({
        field: basePath || 'root',
        path: basePath,
        existingValue: existingData,
        importValue: importData,
        conflictType: 'missing_in_existing',
        suggestedStrategy: 'overwrite',
        description: 'New data in import',
      });
    }
    return conflicts;
  }

  if (importData === null || importData === undefined) {
    conflicts.push({
      field: basePath || 'root',
      path: basePath,
      existingValue: existingData,
      importValue: importData,
      conflictType: 'missing_in_import',
      suggestedStrategy: 'keep_existing',
      description: 'Data exists but missing in import',
    });
    return conflicts;
  }

  // Handle arrays
  if (Array.isArray(existingData) && Array.isArray(importData)) {
    return detectArrayConflicts(existingData, importData, basePath);
  }

  // Handle objects
  if (
    typeof existingData === 'object' &&
    typeof importData === 'object' &&
    !Array.isArray(existingData) &&
    !Array.isArray(importData)
  ) {
    return detectObjectConflicts(existingData, importData, basePath);
  }

  // Handle primitives
  if (existingData !== importData) {
    conflicts.push({
      field: basePath || 'root',
      path: basePath,
      existingValue: existingData,
      importValue: importData,
      conflictType: 'different_value',
      suggestedStrategy: determineStrategy(existingData, importData),
      description: `Value differs: "${existingData}" vs "${importData}"`,
    });
  }

  return conflicts;
}

/**
 * Detect conflicts in arrays
 */
function detectArrayConflicts(
  existingArray: any[],
  importArray: any[],
  basePath: string
): DataConflict[] {
  const conflicts: DataConflict[] = [];

  // Check for overlapping items
  if (existingArray.length > 0 && importArray.length > 0) {
    conflicts.push({
      field: basePath,
      path: basePath,
      existingValue: existingArray,
      importValue: importArray,
      conflictType: 'array_overlap',
      suggestedStrategy: 'merge',
      description: `Array has ${existingArray.length} existing items and ${importArray.length} import items`,
    });
  }

  return conflicts;
}

/**
 * Detect conflicts in objects
 */
function detectObjectConflicts(
  existingObj: Record<string, any>,
  importObj: Record<string, any>,
  basePath: string
): DataConflict[] {
  const conflicts: DataConflict[] = [];
  const allKeys = new Set([...Object.keys(existingObj), ...Object.keys(importObj)]);

  for (const key of allKeys) {
    const newPath = basePath ? `${basePath}.${key}` : key;
    const existingValue = existingObj[key];
    const importValue = importObj[key];

    conflicts.push(...detectConflicts(existingValue, importValue, newPath));
  }

  return conflicts;
}

/**
 * Determine best strategy for conflict resolution
 */
function determineStrategy(existingValue: any, importValue: any): MergeStrategy {
  // If one value is empty/null and other has data, prefer the one with data
  if (!existingValue && importValue) return 'overwrite';
  if (existingValue && !importValue) return 'keep_existing';

  // If both have data and are different, default to user choice
  return 'manual';
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve conflicts based on strategy
 */
export function resolveConflicts(
  existingData: any,
  importData: any,
  resolutions: Map<string, MergeStrategy>
): any {
  return resolveValue(existingData, importData, '', resolutions);
}

/**
 * Resolve a single value based on strategy
 */
function resolveValue(
  existingValue: any,
  importValue: any,
  path: string,
  resolutions: Map<string, MergeStrategy>
): any {
  const strategy = resolutions.get(path) || 'merge';

  // Handle null/undefined
  if (existingValue === null || existingValue === undefined) {
    return importValue;
  }

  if (importValue === null || importValue === undefined) {
    return strategy === 'overwrite' ? importValue : existingValue;
  }

  // Apply strategy
  switch (strategy) {
    case 'keep_existing':
      return existingValue;

    case 'overwrite':
      return importValue;

    case 'newer':
      // Check timestamps if available
      if (existingValue.updatedAt && importValue.updatedAt) {
        return new Date(existingValue.updatedAt) > new Date(importValue.updatedAt)
          ? existingValue
          : importValue;
      }
      return importValue; // Default to import if no timestamps

    case 'merge':
      // Handle arrays - combine and deduplicate
      if (Array.isArray(existingValue) && Array.isArray(importValue)) {
        return mergeArrays(existingValue, importValue);
      }

      // Handle objects - deep merge
      if (
        typeof existingValue === 'object' &&
        typeof importValue === 'object' &&
        !Array.isArray(existingValue)
      ) {
        return mergeObjects(existingValue, importValue, path, resolutions);
      }

      // For primitives, prefer import value
      return importValue;

    case 'manual':
      // Should have been resolved by user before this point
      log.warn('conflict.resolution.manual_not_resolved', { path });
      return existingValue; // Safe default

    default:
      return importValue;
  }
}

/**
 * Merge two arrays, removing duplicates
 */
function mergeArrays(existing: any[], imported: any[]): any[] {
  // Try to intelligently merge objects by ID
  if (existing.length > 0 && typeof existing[0] === 'object') {
    const merged = [...existing];
    const existingIds = new Set(
      existing.map((item) => item.id || item.code || item.slug).filter(Boolean)
    );

    for (const item of imported) {
      const itemId = item.id || item.code || item.slug;
      if (!itemId || !existingIds.has(itemId)) {
        merged.push(item);
      }
    }

    return merged;
  }

  // For primitives, combine and dedupe
  return Array.from(new Set([...existing, ...imported]));
}

/**
 * Deep merge two objects
 */
function mergeObjects(
  existing: Record<string, any>,
  imported: Record<string, any>,
  basePath: string,
  resolutions: Map<string, MergeStrategy>
): Record<string, any> {
  const merged: Record<string, any> = { ...existing };

  for (const key of Object.keys(imported)) {
    const newPath = basePath ? `${basePath}.${key}` : key;
    merged[key] = resolveValue(existing[key], imported[key], newPath, resolutions);
  }

  return merged;
}

// ============================================================================
// CONFLICT ANALYSIS
// ============================================================================

/**
 * Analyze conflicts and categorize them
 */
export function analyzeConflicts(conflicts: DataConflict[]): ConflictResolution {
  const autoResolvable = conflicts.filter(
    (c) =>
      c.suggestedStrategy !== 'manual' &&
      (c.suggestedStrategy === 'keep_existing' ||
        c.suggestedStrategy === 'overwrite' ||
        c.suggestedStrategy === 'merge')
  ).length;

  const requiresManual = conflicts.filter((c) => c.suggestedStrategy === 'manual').length;

  return {
    conflicts,
    autoResolvable,
    requiresManual,
  };
}

/**
 * Auto-resolve conflicts that don't require user input
 */
export function autoResolveConflicts(conflicts: DataConflict[]): Map<string, MergeStrategy> {
  const resolutions = new Map<string, MergeStrategy>();

  for (const conflict of conflicts) {
    if (conflict.suggestedStrategy !== 'manual') {
      resolutions.set(conflict.path, conflict.suggestedStrategy);
    }
  }

  return resolutions;
}
