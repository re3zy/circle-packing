/**
 * Data transformation utilities for converting Sigma data to D3 hierarchy
 */

import { HierarchyNode, ParsedLevel, SigmaDataRow, SearchResult } from '../types';

/**
 * Parse a level string in format "Name (BU_Code)-BEBL"
 * Example: "Finity Group, LLC (06921)-WN8"
 * @param levelString - Raw level string from Sigma
 * @returns Parsed level information
 */
export function parseLevel(levelString: string | null | undefined): ParsedLevel | null {
  if (!levelString || typeof levelString !== 'string') {
    return null;
  }

  // Regular expression to match the format: "Name (BU_Code)-BEBL"
  const match = levelString.match(/^(.+?)\s*\(([^)]+)\)-([A-Z0-9]+)$/);
  
  if (!match) {
    // Fallback: if format doesn't match, use the whole string as name
    return {
      name: levelString.trim(),
      buCode: '',
      beblCode: '',
      raw: levelString
    };
  }

  return {
    name: match[1].trim(),
    buCode: match[2].trim(),
    beblCode: match[3].trim(),
    raw: levelString
  };
}

/**
 * Extract hierarchy path from a data row
 * Stops at the first null level
 * @param row - Sigma data row
 * @returns Array of parsed levels
 */
function extractPath(row: SigmaDataRow): ParsedLevel[] {
  const path: ParsedLevel[] = [];
  const levels = [
    row.level0, row.level1, row.level2, row.level3, row.level4,
    row.level5, row.level6, row.level7, row.level8, row.level9, row.level10
  ];

  for (const level of levels) {
    if (!level) break; // Stop at first null
    const parsed = parseLevel(level);
    if (parsed) {
      path.push(parsed);
    }
  }

  return path;
}

/**
 * Build a unique key for a node path
 * @param pathArray - Array of parsed levels
 * @returns Unique path key
 */
function buildPathKey(pathArray: ParsedLevel[]): string {
  return pathArray.map(p => p.raw).join('|');
}

/**
 * Transform flat Sigma data into D3 hierarchy
 * @param rows - Array of Sigma data rows
 * @param beblFullNameMap - Optional map of path to BEBL full name
 * @returns Root hierarchy node
 */
export function transformToHierarchy(rows: SigmaDataRow[], beblFullNameMap?: Map<string, string>): HierarchyNode {
  // Root node
  const root: HierarchyNode = {
    name: 'Root',
    level: -1,
    path: '',
    children: []
  };

  // Map to track nodes by their path (to handle duplicates correctly)
  const nodeMap = new Map<string, HierarchyNode>();
  nodeMap.set('', root);

  // Process each row
  rows.forEach(row => {
    const marketValue = row.marketValue || 0;
    const path = extractPath(row);

    if (path.length === 0) {
      return; // Skip rows with no valid path
    }

    // Build the hierarchy path incrementally
    let currentPathKey = '';
    let parentNode = root;

    path.forEach((level, index) => {
      // Build path key up to current level
      const pathUpToCurrent = path.slice(0, index + 1);
      const nodePathKey = buildPathKey(pathUpToCurrent);

      // Check if this node already exists
      if (!nodeMap.has(nodePathKey)) {
        // Create new node
        const newNode: HierarchyNode = {
          name: level.name,
          buCode: level.buCode,
          beblCode: level.beblCode,
          beblFullName: beblFullNameMap?.get(nodePathKey),
          rawLabel: level.raw,
          level: index,
          path: nodePathKey,
          children: []
        };

        // If this is a leaf node (last level in path), add the value
        if (index === path.length - 1) {
          newNode.value = marketValue;
        }

        // Add to parent's children
        if (!parentNode.children) {
          parentNode.children = [];
        }
        parentNode.children.push(newNode);

        // Add to map
        nodeMap.set(nodePathKey, newNode);

        // Move to this node
        parentNode = newNode;
      } else {
        // Node exists, check if we need to add value (for leaf aggregation)
        const existingNode = nodeMap.get(nodePathKey)!;
        
        // If this is a leaf node in the current row, add its value
        if (index === path.length - 1) {
          // If existing node has children, it's a parent node and we should add value
          // If it doesn't have children, add to its existing value
          if (existingNode.value !== undefined) {
            existingNode.value += marketValue;
          } else {
            existingNode.value = marketValue;
          }
        }

        // Move to this node
        parentNode = existingNode;
      }

      currentPathKey = nodePathKey;
    });
  });

  return root;
}

/**
 * Flatten hierarchy into searchable items
 * @param node - Root hierarchy node
 * @param results - Accumulator for results
 * @returns Array of search results
 */
export function flattenHierarchy(
  node: HierarchyNode,
  results: SearchResult[] = []
): SearchResult[] {
  // Skip root node
  if (node.level >= 0) {
    results.push({
      name: node.name,
      buCode: node.buCode,
      beblCode: node.beblCode,
      beblFullName: node.beblFullName,
      rawLabel: node.rawLabel,
      path: node.path,
      value: node.value || 0,
      level: node.level
    });
  }

  // Recursively process children
  if (node.children) {
    node.children.forEach(child => flattenHierarchy(child, results));
  }

  return results;
}

/**
 * Search hierarchy nodes
 * @param searchTerm - Search query
 * @param searchResults - Flattened hierarchy
 * @returns Filtered search results
 */
export function searchNodes(
  searchTerm: string,
  searchResults: SearchResult[]
): SearchResult[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const term = searchTerm.toLowerCase();

  return searchResults.filter(result => {
    return (
      result.name.toLowerCase().includes(term) ||
      (result.buCode && result.buCode.toLowerCase().includes(term)) ||
      (result.beblCode && result.beblCode.toLowerCase().includes(term)) ||
      (result.beblFullName && result.beblFullName.toLowerCase().includes(term)) ||
      (result.rawLabel && result.rawLabel.toLowerCase().includes(term))
    );
  });
}

/**
 * Find a node in the hierarchy by path
 * @param root - Root hierarchy node
 * @param path - Node path to find
 * @returns Found node or null
 */
export function findNodeByPath(
  root: HierarchyNode,
  path: string
): HierarchyNode | null {
  if (root.path === path) {
    return root;
  }

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

