/**
 * Circle Packing Visualization Component
 * Uses D3 hierarchy and pack layouts
 */

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { HierarchyNode as CustomHierarchyNode } from '../types';

interface CirclePackingProps {
  /** Root hierarchy node */
  data: CustomHierarchyNode;
  /** Container width */
  width: number;
  /** Container height */
  height: number;
  /** Optional color scheme */
  colorScheme?: string;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Maximum depth to display */
  maxDepth?: number;
  /** Callback when a node is clicked */
  onNodeClick?: (node: CustomHierarchyNode | null) => void;
  /** Currently focused node path */
  focusedPath?: string | null;
}

/**
 * Get color for a circle based on its depth
 */
function getColor(depth: number, maxDepth: number): string {
  // Use d3 color scales
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, maxDepth]);
  return colorScale(depth);
}

/**
 * Format currency values
 */
function formatValue(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

const CirclePacking: React.FC<CirclePackingProps> = ({
  data,
  width,
  height,
  colorScheme = 'blues',
  showLabels = true,
  maxDepth = 10,
  onNodeClick,
  focusedPath = null
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find the focused node
  const focusedNode = useMemo(() => {
    if (!focusedPath) return data;
    
    const findNode = (node: CustomHierarchyNode, path: string): CustomHierarchyNode | null => {
      if (node.path === path) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, path);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(data, focusedPath) || data;
  }, [data, focusedPath]);

  // Create D3 hierarchy and pack layout
  const { root, pack } = useMemo(() => {
    const hierarchy = d3.hierarchy(focusedNode)
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packLayout = d3.pack<CustomHierarchyNode>()
      .size([width, height])
      .padding(5);

    return {
      root: packLayout(hierarchy),
      pack: packLayout
    };
  }, [focusedNode, width, height]);

  // Calculate max depth for color scaling
  const calculatedMaxDepth = useMemo(() => {
    let max = 0;
    root.each(d => {
      if (d.depth > max) max = d.depth;
    });
    return max;
  }, [root]);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create groups for circles and labels
    const g = svg.append('g');

    // Get all nodes
    const nodes = root.descendants();

    // Create circles
    const circles = g.selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 0) // Start at 0 for animation
      .attr('fill', d => {
        if (d.depth === 0) return 'transparent';
        return getColor(d.depth, calculatedMaxDepth);
      })
      .attr('stroke', d => d.depth === 0 ? 'none' : '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.7)
      .style('cursor', d => {
        if (d.depth === 0) return 'default';
        const nodeData = d.data as CustomHierarchyNode;
        // Only show pointer cursor for nodes with children
        return (nodeData.children && nodeData.children.length > 0) ? 'pointer' : 'default';
      })
      .on('mouseover', function(event, d) {
        if (d.depth === 0) return;

        // Highlight circle
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke-width', 2);

        // Show tooltip
        const nodeData = d.data as CustomHierarchyNode;
        const value = d.value || 0;
        
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="font-bold">${nodeData.name}</div>
            ${nodeData.beblFullName ? `<div class="text-sm text-blue-600">BEBL: ${nodeData.beblFullName}</div>` : ''}
            ${nodeData.buCode ? `<div class="text-sm">BU Code: ${nodeData.buCode}</div>` : ''}
            ${nodeData.beblCode ? `<div class="text-sm">Code: ${nodeData.beblCode}</div>` : ''}
            <div class="text-sm font-semibold mt-1">Market Value: ${formatValue(value)}</div>
            <div class="text-xs text-gray-500">Level: ${d.depth}</div>
          `);
      })
      .on('mouseout', function(event, d) {
        if (d.depth === 0) return;

        // Remove highlight
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.7)
          .attr('stroke-width', 1);

        // Hide tooltip
        tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        if (d.depth === 0) return;
        
        const nodeData = d.data as CustomHierarchyNode;
        // Only allow clicking on nodes with children
        if (nodeData.children && nodeData.children.length > 0) {
          if (onNodeClick) {
            onNodeClick(nodeData);
          }
        }
      });

    // Animate circles growing
    circles.transition()
      .duration(500)
      .attr('r', d => d.r);

    // Add labels for circles that are large enough with collision detection
    if (showLabels) {
      // Filter and sort nodes by size (larger first) to prioritize important labels
      const labelCandidates = nodes
        .filter(d => d.r > 35 && d.depth > 0)
        .sort((a, b) => b.r - a.r);

      // Track which labels we'll actually show (to avoid overlaps)
      const labelsToShow: typeof nodes = [];
      
      // Simple collision detection: check if circles are too close
      for (const candidate of labelCandidates) {
        let hasOverlap = false;
        
        for (const existing of labelsToShow) {
          const dx = candidate.x - existing.x;
          const dy = candidate.y - existing.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = candidate.r + existing.r - 10; // Allow some overlap of circles but not labels
          
          if (distance < minDistance) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          labelsToShow.push(candidate);
        }
      }

      const labels = g.selectAll('text')
        .data(labelsToShow)
        .join('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('pointer-events', 'none')
        .style('font-size', d => `${Math.min(d.r / 4, 14)}px`)
        .style('font-weight', '600')
        .style('fill', '#fff')
        .style('text-shadow', '0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)')
        .style('opacity', 0);

      // Add text with shadow for better readability
      labels.each(function(d) {
        const text = d3.select(this);
        const nodeData = d.data as CustomHierarchyNode;
        
        // Truncate name if too long
        let displayName = nodeData.name;
        const maxLength = Math.floor(d.r / 3.5);
        if (displayName.length > maxLength) {
          displayName = displayName.substring(0, maxLength - 3) + '...';
        }

        text.text(displayName);
      });

      // Fade in labels
      labels.transition()
        .delay(300)
        .duration(300)
        .style('opacity', 0.95);
    }

  }, [root, showLabels, calculatedMaxDepth, onNodeClick]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0, minWidth: 0 }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-white border border-gray-300 rounded shadow-lg p-2 opacity-0 transition-opacity z-10"
        style={{ maxWidth: '300px' }}
      />
    </div>
  );
};

export default CirclePacking;

