/**
 * Circle Packing Plugin for Sigma Computing
 * Main application component
 */

import { useMemo, useState, useEffect } from 'react';
import { client, useConfig, useElementData } from '@sigmacomputing/plugin';
import CirclePacking from './components/CirclePacking';
import SearchFilter from './components/SearchFilter';
import { transformToHierarchy, flattenHierarchy } from './utils/dataTransform';
import { HierarchyNode, SigmaDataRow, SearchResult } from './types';
import './App.css';

/**
 * Configure the Sigma editor panel
 * Defines the data source and column mappings
 */
client.config.configureEditorPanel([
  { name: 'source', type: 'element' },
  { name: 'marketValue', type: 'column', source: 'source', allowMultiple: false },
  { name: 'beblFullName', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level0', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level1', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level2', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level3', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level4', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level5', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level6', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level7', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level8', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level9', type: 'column', source: 'source', allowMultiple: false },
  { name: 'level10', type: 'column', source: 'source', allowMultiple: false }
]);

function App() {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  
  // State for visualization controls
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<HierarchyNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('viz-container');
      if (container) {
        // Use offsetWidth/offsetHeight for more accurate dimensions
        const width = container.offsetWidth || container.clientWidth;
        const height = container.offsetHeight || container.clientHeight;
        
        // Ensure minimum dimensions
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 400)
        });
      }
    };

    // Initial update with a small delay to ensure DOM is ready
    setTimeout(updateDimensions, 100);
    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /**
   * Transform Sigma data into hierarchical structure
   */
  const hierarchyData = useMemo<HierarchyNode | null>(() => {
    // Validate that we have the required configuration
    if (!sigmaData || !config.marketValue) {
      return null;
    }

    try {
      // Build rows array from Sigma data columns
      const marketValueData = sigmaData[config.marketValue] || [];
      const numRows = marketValueData.length;

      if (numRows === 0) {
        return null;
      }

      const rows: SigmaDataRow[] = [];

      // Build BEBL full name map if the column is mapped
      const beblFullNameMap = new Map<string, string>();
      const beblFullNameData = config.beblFullName ? sigmaData[config.beblFullName] : null;

      for (let i = 0; i < numRows; i++) {
        const row: SigmaDataRow = {
          marketValue: marketValueData[i] || 0,
          beblFullName: beblFullNameData?.[i] || null,
          level0: config.level0 ? sigmaData[config.level0]?.[i] : null,
          level1: config.level1 ? sigmaData[config.level1]?.[i] : null,
          level2: config.level2 ? sigmaData[config.level2]?.[i] : null,
          level3: config.level3 ? sigmaData[config.level3]?.[i] : null,
          level4: config.level4 ? sigmaData[config.level4]?.[i] : null,
          level5: config.level5 ? sigmaData[config.level5]?.[i] : null,
          level6: config.level6 ? sigmaData[config.level6]?.[i] : null,
          level7: config.level7 ? sigmaData[config.level7]?.[i] : null,
          level8: config.level8 ? sigmaData[config.level8]?.[i] : null,
          level9: config.level9 ? sigmaData[config.level9]?.[i] : null,
          level10: config.level10 ? sigmaData[config.level10]?.[i] : null
        };

        rows.push(row);

        // Build path key for this row and store the BEBL full name
        // IMPORTANT: Store BEBL name for ALL levels in the path, not just the last one
        if (row.beblFullName) {
          const levels = [
            row.level0, row.level1, row.level2, row.level3, row.level4,
            row.level5, row.level6, row.level7, row.level8, row.level9, row.level10
          ];
          
          let pathParts: string[] = [];
          for (const level of levels) {
            if (!level) break;
            pathParts.push(level);
            const pathKey = pathParts.join('|');
            // Store the beblFullName for ALL paths (overwrite is OK, same person across levels)
            beblFullNameMap.set(pathKey, row.beblFullName);
          }
        }
      }

      // Transform to hierarchy with BEBL full name map
      return transformToHierarchy(rows, beblFullNameMap);
    } catch (error) {
      console.error('Error transforming data:', error);
      return null;
    }
  }, [sigmaData, config]);

  /**
   * Flatten hierarchy for search
   */
  const searchableNodes = useMemo<SearchResult[]>(() => {
    if (!hierarchyData) return [];
    return flattenHierarchy(hierarchyData);
  }, [hierarchyData]);

  /**
   * Handle node click - zoom to that node
   */
  const handleNodeClick = (node: HierarchyNode | null) => {
    if (!node) {
      setFocusedPath(null);
      setBreadcrumbs([]);
    } else {
      setFocusedPath(node.path);
      
      // Build breadcrumb trail
      const trail: HierarchyNode[] = [];
      const findPath = (current: HierarchyNode, targetPath: string): boolean => {
        if (current.path === targetPath) {
          if (current.level >= 0) trail.push(current);
          return true;
        }
        if (current.children) {
          for (const child of current.children) {
            if (findPath(child, targetPath)) {
              if (current.level >= 0) trail.unshift(current);
              return true;
            }
          }
        }
        return false;
      };
      
      if (hierarchyData) {
        findPath(hierarchyData, node.path);
      }
      setBreadcrumbs(trail);
    }
  };

  /**
   * Handle search result selection
   */
  const handleSearchSelect = (result: SearchResult) => {
    // Find the actual node in the hierarchy
    const findNode = (node: HierarchyNode, path: string): HierarchyNode | null => {
      if (node.path === path) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, path);
          if (found) return found;
        }
      }
      return null;
    };
    
    if (!hierarchyData) return;
    
    const foundNode = findNode(hierarchyData, result.path);
    if (!foundNode) return;
    
    // Only zoom if the node has children (not a leaf node)
    if (foundNode.children && foundNode.children.length > 0) {
      setFocusedPath(result.path);
      
      // Build breadcrumb trail
      const trail: HierarchyNode[] = [];
      const findPath = (current: HierarchyNode, targetPath: string): boolean => {
        if (current.path === targetPath) {
          if (current.level >= 0) trail.push(current);
          return true;
        }
        if (current.children) {
          for (const child of current.children) {
            if (findPath(child, targetPath)) {
              if (current.level >= 0) trail.unshift(current);
              return true;
            }
          }
        }
        return false;
      };
      
      if (hierarchyData) {
        findPath(hierarchyData, result.path);
      }
      setBreadcrumbs(trail);
    }
    // If it's a leaf node, just don't zoom (stay at current view)
  };

  /**
   * Handle search clear
   */
  const handleSearchClear = () => {
    setFocusedPath(null);
    setBreadcrumbs([]);
  };

  /**
   * Handle reset to root
   */
  const handleReset = () => {
    setFocusedPath(null);
    setBreadcrumbs([]);
  };

  /**
   * Handle breadcrumb click
   */
  const handleBreadcrumbClick = (node: HierarchyNode) => {
    handleNodeClick(node);
  };

  // Loading state
  if (!hierarchyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Waiting for data...
          </div>
          <div className="text-sm text-gray-500">
            Please configure the data source and map the required columns
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ overflow: 'hidden' }}>
      {/* Header with Search and Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Circle Packing Hierarchy
            </h1>
            {focusedPath && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reset to Root
              </button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="mb-3">
            <SearchFilter
              searchableNodes={searchableNodes}
              onSelect={handleSearchSelect}
              onClear={handleSearchClear}
            />
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Root
              </button>
              {breadcrumbs.map((node, index) => (
                <div key={node.path} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(node)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {node.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visualization Container */}
      <div id="viz-container" className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <CirclePacking
          data={hierarchyData}
          width={dimensions.width}
          height={dimensions.height}
          showLabels={true}
          onNodeClick={handleNodeClick}
          focusedPath={focusedPath}
        />
      </div>
    </div>
  );
}

export default App;

