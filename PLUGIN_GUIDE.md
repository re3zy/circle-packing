# Circle Packing Plugin - Quick Reference

## Plugin Configuration in Sigma

### Required Settings
1. **source** (element): Data source element
2. **marketValue** (column): Numeric column for circle sizing
3. **level0** (column): Root level of hierarchy

### Optional Settings
- **level1** through **level10** (columns): Additional hierarchy levels

## Data Column Format

Each level column should contain strings in this format:
```
"Display Name (Business_Unit_Code)-BEBL_Code"
```

### Examples
- `"Cambridge Investment Research, Inc. (00001)-QV6"`
- `"Finity Group, LLC (06921)-WN8"`
- `"Finity Group (06940)-WP8"`

## Key Features

### 1. Zoom Navigation
- **Click** any circle to zoom into that node's subtree
- **Reset button** returns to root view
- **Breadcrumbs** show current path and allow quick navigation

### 2. Search Functionality
- Search by **name**, **BU code**, or **BEBL code**
- Case-insensitive
- Shows up to 50 results
- Click result to zoom to that node

### 3. Tooltips
Hover over any circle to see:
- Full name
- Business Unit Code
- BEBL Code
- Market Value (formatted)
- Hierarchy Level

## Data Processing Rules

### Hierarchy Building
1. Plugin reads levels **left to right** (Level 0 → Level 10)
2. Stops at **first null/empty** level
3. Each unique path creates a **separate branch**
4. Same name in different paths = **different nodes** (no merging)

### Value Aggregation
- **Leaf nodes**: Use original Market Value from data
- **Parent nodes**: Automatically sum all children's values
- **Null values**: Treated as 0

### Example
```
Input Data:
Row 1: Level0="Root (001)-A", Level1="Child (002)-B", MarketValue=100
Row 2: Level0="Root (001)-A", Level1="Child (003)-C", MarketValue=200

Result:
- Root node: value = 300 (sum of children)
  - Child B: value = 100
  - Child C: value = 200
```

## Color Scheme

Circles are colored by **depth** in hierarchy:
- Lighter shades = higher levels (closer to root)
- Darker shades = lower levels (leaf nodes)
- Uses D3's interpolateBlues scale

## Label Display

Labels appear when:
- Circle radius > 30 pixels
- Not the root node

Labels are:
- Auto-truncated to fit circle
- Centered in circle
- Non-interactive (click-through)

## Performance Tips

### For Large Datasets (>500 nodes)
1. Start searches with specific terms
2. Use zoom to focus on subtrees
3. Consider filtering data in Sigma before plugin

### For Deep Hierarchies (>7 levels)
1. Use search to jump to lower levels
2. Zoom progressively rather than all at once
3. Check market value aggregation is correct

## Common Use Cases

### Organizational Chart
- Level 0: Company
- Level 1: Divisions
- Level 2: Departments
- Level 3: Teams
- Market Value: Headcount or budget

### Financial Hierarchy
- Level 0: Portfolio
- Level 1: Asset Class
- Level 2: Strategy
- Level 3: Securities
- Market Value: Investment amount

### Product Taxonomy
- Level 0: Catalog
- Level 1: Category
- Level 2: Subcategory
- Level 3: Products
- Market Value: Revenue or units sold

## Troubleshooting

### Issue: "Waiting for data..."
- **Check**: Data source is selected in Sigma config
- **Check**: At least one level column is mapped
- **Check**: Market value column is mapped

### Issue: Circles overlap strangely
- **Cause**: Null values in middle of hierarchy
- **Solution**: Ensure no gaps in level columns (e.g., don't skip Level 1)

### Issue: Search returns nothing
- **Check**: Search term spelling
- **Try**: Shorter/partial terms
- **Verify**: Data actually contains search term

### Issue: Wrong market values
- **Check**: Values aren't pre-aggregated in source data
- **Check**: Null values in Market Value column
- **Verify**: All rows have valid numeric values

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## File Structure Quick Reference

```
src/
├── App.tsx                    # Main Sigma integration
├── components/
│   ├── CirclePacking.tsx      # D3 visualization
│   └── SearchFilter.tsx       # Search UI
├── utils/
│   └── dataTransform.ts       # Data transformation
└── types/
    └── index.ts               # TypeScript types
```

## API Reference

### Key Functions

#### `transformToHierarchy(rows: SigmaDataRow[]): HierarchyNode`
Converts flat Sigma data to nested tree structure.

#### `flattenHierarchy(node: HierarchyNode): SearchResult[]`
Flattens tree into searchable array.

#### `searchNodes(term: string, results: SearchResult[]): SearchResult[]`
Filters nodes by search term.

#### `parseLevel(levelString: string): ParsedLevel | null`
Parses level string into components (name, buCode, beblCode).

---

**Need Help?** Check the main README.md for detailed documentation.

