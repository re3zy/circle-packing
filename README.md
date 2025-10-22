# Circle Packing Hierarchy Plugin

A powerful D3-based circle packing visualization plugin for **Sigma Computing** that displays organizational hierarchies with up to 10 levels deep. Circles are sized by aggregated Market Value with search, filter, and interactive zoom capabilities.

## Features

### 🎯 Core Visualization
- **Circle Packing Layout**: D3-powered hierarchical visualization with parent-child relationships
- **Size by Value**: Circle sizes represent aggregated Market Values (sum of all children)
- **Color Depth Coding**: Color intensity indicates hierarchy depth
- **Smart Labels**: Automatic label display based on circle size with text truncation

### 🔍 Search & Navigation
- **Real-time Search**: Search by name, business unit code, or BEBL code
- **Autocomplete Dropdown**: Up to 50 results with formatted display
- **Keyboard Navigation**: Arrow keys to navigate results, Enter to select
- **Breadcrumb Trail**: Visual path from root to current focused node

### 🖱️ Interactions
- **Click to Zoom**: Click any circle to focus on its subtree
- **Interactive Tooltips**: Hover to see detailed information including name, codes, and market value
- **Reset to Root**: One-click return to full hierarchy view
- **Smooth Transitions**: 500ms animated transitions between states

### 📊 Data Handling
- **Flexible Hierarchy**: Supports up to 11 levels (Level 0 through Level 10)
- **Multiple Branch Support**: Same entity can exist in different branches (no merging)
- **Smart Aggregation**: Parent nodes automatically sum children's Market Values
- **Null Handling**: Gracefully handles missing levels

## Data Format

### Input Requirements

The plugin expects hierarchical data from Sigma with these columns:

- **Market Value** (required): Numeric column to aggregate
- **Level 0 through Level 10** (at least Level 0 required): Hierarchy path strings

### Level String Format

Each level string should follow this format:
```
"Name (BU_Code)-BEBL"
```

**Example**: `"Finity Group, LLC (06921)-WN8"`
- **Name**: "Finity Group, LLC"
- **BU Code**: "06921"
- **BEBL Code**: "WN8"

### Sample Data

```csv
Business Unit Id,Business Unit Name,Market Value,Level 0,Level 1,Level 2,Level 3
44a04f2b-...,Finity Group,5198112978.85,"Cambridge Investment Research, Inc. (00001)-QV6","Finity Group, LLC (06921)-WN8","Finity Group (06940)-WP8",
4046550a-...,Finity Group,5198112978.85,"Cambridge Investment Research, Inc. (00001)-QV6","Finity Group, LLC (06921)-WN8","Finity Group (02316)-WP8",
```

**Note**: The same entity (e.g., "Finity Group") can appear in multiple branches with different codes - this is intentional and correctly handled.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **D3.js** - Data visualization (`d3`, `d3-hierarchy`)
- **Tailwind CSS** - Styling
- **@sigmacomputing/plugin** - Sigma plugin SDK

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
circle-packing-v2/
├── src/
│   ├── components/
│   │   ├── CirclePacking.tsx      # Main D3 visualization component
│   │   └── SearchFilter.tsx       # Search/filter UI component
│   ├── utils/
│   │   └── dataTransform.ts       # Data transformation utilities
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── App.tsx                    # Main app with Sigma integration
│   ├── App.css                    # Application styles
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles with Tailwind
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── README.md                      # This file
```

## Sigma Integration

### Configuration Panel

The plugin exposes these configuration options in Sigma:

```typescript
client.config.configureEditorPanel([
  { name: "source", type: "element" },                    // Data source
  { name: "marketValue", type: "column" },                // Required
  { name: "level0", type: "column" },                     // Required
  { name: "level1", type: "column" },                     // Optional
  { name: "level2", type: "column" },                     // Optional
  // ... level3 through level10 (all optional)
]);
```

### Setup in Sigma

1. **Create or open a Sigma workbook**
2. **Add a data source** with hierarchical data
3. **Add the Circle Packing plugin** to your page
4. **Configure the plugin**:
   - Select your data source
   - Map the Market Value column
   - Map at least Level 0 (map additional levels as needed)

## Key Implementation Details

### Data Transformation

The `transformToHierarchy()` function converts flat Sigma rows into a nested tree structure:

1. **Path Extraction**: Reads level columns until first null
2. **Tree Building**: Creates unique nodes for each path combination
3. **Value Aggregation**: Sums Market Values for parent nodes
4. **Branch Preservation**: Same names in different paths remain separate

### Circle Packing Algorithm

Uses D3's `d3.hierarchy()` and `d3.pack()`:

```typescript
const hierarchy = d3.hierarchy(data)
  .sum(d => d.value || 0)
  .sort((a, b) => (b.value || 0) - (a.value || 0));

const pack = d3.pack()
  .size([width, height])
  .padding(3);
```

### Performance Optimizations

- **useMemo**: Memoizes expensive data transformations
- **Debounced Search**: 300ms delay on search input
- **Result Limiting**: Maximum 50 search results
- **Label Culling**: Only shows labels for circles > 30px radius

## Usage Tips

### For End Users

1. **Start Broad**: Begin at the root to see the full hierarchy
2. **Drill Down**: Click any circle to zoom into that subtree
3. **Search Quickly**: Use search to jump directly to specific nodes
4. **Follow Breadcrumbs**: Use breadcrumbs to navigate back up the tree
5. **Hover for Details**: Hover over circles to see full information

### For Developers

1. **Column Mapping**: Ensure level strings follow the `"Name (Code)-BEBL"` format
2. **Null Handling**: Plugin stops reading levels at first null - this is expected
3. **Value Aggregation**: Parent values are computed automatically - don't pre-aggregate
4. **Multiple Branches**: Don't try to deduplicate entities across branches

## Troubleshooting

### No Visualization Appears
- **Check**: Data source is connected in Sigma config panel
- **Check**: Market Value column is mapped
- **Check**: At least Level 0 column is mapped
- **Check**: Data has valid rows (not empty)

### Circles Are Too Small
- **Cause**: Many nodes at the same level with similar values
- **Solution**: Zoom into specific subtrees using click or search

### Search Not Working
- **Check**: Search term matches name, BU code, or BEBL code
- **Note**: Search is case-insensitive
- **Tip**: Try shorter search terms for broader results

### Values Don't Match Expected
- **Check**: Market Values are at the leaf level (not pre-aggregated)
- **Check**: Null values in Market Value column (treated as 0)
- **Verify**: Using sum aggregation, not average or count

## Browser Compatibility

- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported
- **Safari**: ✅ Fully supported
- **Edge**: ✅ Fully supported

Requires modern browser with ES2020 support.

## Future Enhancements

Potential improvements for future versions:

- [ ] Color scheme selection (variables in config panel)
- [ ] Max depth control (variables in config panel)
- [ ] Label toggle (variables in config panel)
- [ ] Export to PNG/SVG
- [ ] Multi-node selection
- [ ] Compare mode (side-by-side views)
- [ ] Historical data / time series
- [ ] Custom color mapping by value ranges

## License

This plugin is provided as-is for use with Sigma Computing.

## Support

For issues or questions:
1. Check this README first
2. Review the Sigma plugin documentation
3. Check the D3 documentation for visualization questions
4. Contact your Sigma administrator

---

**Built with ❤️ using React, TypeScript, D3, and Tailwind CSS**

