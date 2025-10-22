/**
 * Type definitions for Circle Packing Plugin
 */

/**
 * Parsed level information from the hierarchy string
 * Format: "Name (BU_Code)-BEBL"
 */
export interface ParsedLevel {
  /** Full display name */
  name: string;
  /** Business unit code */
  buCode: string;
  /** BEBL code */
  beblCode: string;
  /** Original raw string */
  raw: string;
}

/**
 * Raw data row from Sigma
 */
export interface SigmaDataRow {
  marketValue: number;
  beblFullName?: string | null;
  level0?: string | null;
  level1?: string | null;
  level2?: string | null;
  level3?: string | null;
  level4?: string | null;
  level5?: string | null;
  level6?: string | null;
  level7?: string | null;
  level8?: string | null;
  level9?: string | null;
  level10?: string | null;
}

/**
 * Hierarchy node for D3
 */
export interface HierarchyNode {
  /** Node display name */
  name: string;
  /** Business unit code */
  buCode?: string;
  /** BEBL code */
  beblCode?: string;
  /** BEBL Full Name for search */
  beblFullName?: string;
  /** Original raw level string for search */
  rawLabel?: string;
  /** Market value (leaf nodes only, aggregated for parents) */
  value?: number;
  /** Child nodes */
  children?: HierarchyNode[];
  /** Hierarchy level (0 = root) */
  level: number;
  /** Full path from root to this node */
  path: string;
}

/**
 * Search result item
 */
export interface SearchResult {
  /** Node name */
  name: string;
  /** Business unit code */
  buCode?: string;
  /** BEBL code */
  beblCode?: string;
  /** BEBL Full Name */
  beblFullName?: string;
  /** Original raw level string */
  rawLabel?: string;
  /** Full path to node */
  path: string;
  /** Market value */
  value: number;
  /** Hierarchy level */
  level: number;
}

/**
 * Circle packing configuration
 */
export interface CirclePackingConfig {
  /** Width of the visualization */
  width: number;
  /** Height of the visualization */
  height: number;
  /** Color scheme name */
  colorScheme?: string;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Maximum depth to display */
  maxDepth?: number;
}

