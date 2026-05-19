# Power BI Dashboard Setup Guide

Complete guide to recreating the RM Pipeline dashboards in Power BI Desktop.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Load Data with Power Query](#load-data-with-power-query)
3. [RECOMMENDED: Star Schema with Hierarchies](#recommended-star-schema-with-hierarchies)
4. [Create DAX Measures](#create-dax-measures)
5. [Build Dashboard Visuals](#build-dashboard-visuals)
6. [Regional Dashboard Recreation](#regional-dashboard-recreation)
7. [Pipeline Dashboard Recreation](#pipeline-dashboard-reception)
8. [Using Hierarchies for Drill-Down](#using-hierarchies-for-drill-down)
9. [Formatting & Themes](#formatting--themes)

---

## Initial Setup

### 1. Install Power BI Desktop
- Download from: https://powerbi.microsoft.com/desktop/
- Or from Microsoft Store (Windows 10/11)

### 2. Prepare Your Data File
- Ensure you have `RM-pipeline-workbook.xlsx` saved locally
- Note the full file path (e.g., `C:\Users\YourName\Downloads\RM-pipeline-workbook.xlsx`)

---

## RECOMMENDED: Star Schema with Hierarchies

**⭐ For the best experience, use the STAR SCHEMA approach with dimension tables and hierarchies.**

This gives you:
- ✅ Drill-down from Region → Market → RM
- ✅ Better performance on large datasets
- ✅ Easier filtering and slicing
- ✅ Time intelligence (YTD, QTD, MTD)
- ✅ Reusable dimension tables

**📁 Files needed:**
- `PowerQuery-WithDimensions.m` — Fact table (Deals)
- `PowerQuery-DimTables.m` — 6 dimension tables
- `DataModel-Setup.md` — Complete setup guide with hierarchies

**If you want hierarchies (RECOMMENDED):**
1. Skip the "Load Data with Power Query" section below
2. Follow the instructions in `DataModel-Setup.md` instead
3. Then come back here for visuals and formatting

**If you want the simple single-table approach:**
- Continue with the section below

---

## Load Data with Power Query

### Step 1: Import the Excel File

1. Open Power BI Desktop
2. Click **Home** → **Get Data** → **Excel Workbook**
3. Browse to `RM-pipeline-workbook.xlsx` and select it
4. In the Navigator window, **DO NOT** click Load yet
5. Click **Transform Data** to open Power Query Editor

### Step 2: Replace with Custom M Code

1. In Power Query Editor, you'll see the auto-detected tables
2. Delete all existing queries (right-click each → Delete)
3. Click **Home** → **New Source** → **Blank Query**
4. Right-click the new query → **Rename** to `Deals`
5. Click **Home** → **Advanced Editor**
6. **Delete all the code** in the Advanced Editor window
7. Open the file `PowerQuery-LoadWorkbook.m` (provided separately)
8. **Copy ALL the M code** from that file
9. **Paste** it into the Advanced Editor in Power BI
10. **Update the file path** on line 22:
    ```m
    File.Contents("C:\Users\YourName\Downloads\RM-pipeline-workbook.xlsx")
    ```
    Change to your actual file path
11. Click **Done**
12. If prompted about privacy levels, select **Ignore Privacy Levels** for this file
13. Verify the data preview looks correct (should show columns: RM, Market, Customer, Product, Stage, etc.)
14. Click **Close & Apply** (top left)

### What This Does
The Power Query M code:
- Loads all RM sheets from the Excel file
- Excludes system sheets (README, Summary, Lookup)
- Extracts RM name and market from each sheet's banner
- Combines all deals into a single table
- Adds calculated columns for filtering and sorting
- Properly types all fields

---

## Create DAX Measures

### Step 1: Create a Measures Table (Optional but Recommended)

1. In Power BI Desktop (Data view), click **Home** → **Enter Data**
2. Leave the table empty, just name it `_Measures`
3. Click **Load**
4. This gives you a clean place to store all your measures

### Step 2: Add All DAX Measures

1. Open the file `DAX-Measures.txt` (provided separately)
2. For EACH measure in that file:
   - Click **Modeling** → **New Measure**
   - Copy the entire measure from the .txt file (name + formula)
   - Paste into the formula bar
   - Press Enter
   - Format the measure as indicated in the comments (click the measure, then Modeling tab → Format)

### Key Measures You'll Create
- `Open Deals` — count of non-closed deals
- `Total Annual Rev` — sum of annual revenue potential
- `Weighted Rev` — probability-adjusted revenue
- `Coverage Ratio` — weighted rev ÷ revenue gap
- `Avg Days in Stage` — average aging of open deals
- `Stuck Deals` — count of deals >90 days
- And 20+ more (see DAX-Measures.txt for complete list)

---

## Build Dashboard Visuals

### Color Palette (Use These Hex Codes)
Copy these for consistent styling:

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Primary Blue** | `#1864AB` | Main data bars, KPIs |
| **Gray** | `#ADB5BD` | Budget/target lines |
| **Green** | `#2B8A3E` | Positive indicators, "Commit" stage |
| **Red** | `#C92A2A` | Alerts, stuck deals |
| **Amber** | `#E67700` | Warnings, aging 61-90 days |
| **Purple** | `#7048E8` | Deposits product |
| **Teal** | `#0C8599` | Treasury Mgmt, "Proposal" stage |
| **Green BG** | `#D3F9D8` | Positive backgrounds |
| **Red BG** | `#FFE3E3` | Alert backgrounds |
| **Amber BG** | `#FFF3BF` | Warning backgrounds |

### General Formatting Guidelines

For ALL visuals:
- **Font**: Segoe UI (or system default)
- **Title font size**: 12pt, bold, color `#1864AB`
- **Data labels font**: 11pt, color `#78716C`
- **Background**: White or `#F8F9FA` (very light gray)
- **Border**: 1px, `#DEE2E6`
- **Padding**: 10-15px

---

## Regional Dashboard Recreation

The regional dashboard focuses on **market-level performance** (Houston vs Dallas).

### Page Setup
1. Create a new page, rename to "Regional"
2. Set canvas background to `#F8F9FA`
3. Add page-level filter: `IsOpen = True` (to show only open pipeline)

---

### Visual 1: Header KPI Cards (Top Row)

**Layout**: 4 cards across the top, equal width

#### Card 1: Open Deals
- Visual type: **Card**
- Field: `[Open Deals]` measure
- Title: "Open Deals"
- Font size: 32pt bold
- Color: `#1864AB`

#### Card 2: Total Pipeline
- Visual type: **Card**
- Field: `[Total Annual Rev]` measure
- Title: "Total Annual Revenue"
- Format: Currency, $0.0M
- Font size: 32pt bold
- Color: `#1864AB`

#### Card 3: Weighted Pipeline
- Visual type: **Card**
- Field: `[Weighted Rev]` measure
- Title: "Weighted Revenue"
- Format: Currency, $0.0M
- Font size: 32pt bold
- Color: `#1864AB`

#### Card 4: Coverage Ratio
- Visual type: **Card**
- Field: `[Coverage Card]` measure
- Title: "Pipeline Coverage"
- Font size: 32pt bold
- **Conditional formatting**:
  - If `[Coverage Ratio] >= 3.0`: Green (`#2B8A3E`)
  - If `[Coverage Ratio] >= 1.5`: Amber (`#E67700`)
  - Else: Red (`#C92A2A`)

---

### Visual 2: Pipeline by Market (Clustered Bar Chart)

- Visual type: **Clustered Bar Chart** (horizontal)
- **Y-axis**: `Market` field
- **X-axis**: `[Weighted Rev]` measure
- **Data labels**: On, format as currency
- **Colors**:
  - Houston: `#1864AB`
  - Dallas: `#0C8599`
- **Title**: "Weighted Revenue by Market"
- **Sort**: Descending by Weighted Rev

---

### Visual 3: Pipeline by Stage (Funnel Chart)

- Visual type: **Funnel** chart
- **Category**: `Stage` field
- **Values**: `[Weighted Rev]` measure
- **Sort by**: `StageOrder` (ascending) — this ensures Lead → Qualified → Proposal → Commit → Closed
- **Colors** (assign manually by stage):
  - Lead: `#ADB5BD`
  - Qualified: `#1864AB`
  - Proposal: `#0C8599`
  - Commit: `#2B8A3E`
  - Closed: `#1E6E2D`
- **Data labels**: On, show percentage and value
- **Title**: "Pipeline by Stage"

---

### Visual 4: Top RMs by Weighted Revenue (Stacked Bar Chart)

- Visual type: **Clustered Bar Chart** (horizontal)
- **Y-axis**: `RM` field
- **X-axis**: `[Weighted Rev]` measure
- **Legend**: `Market` field (shows Houston/Dallas split per RM)
- **Top N filter**: Show top 10 RMs by `[Weighted Rev]`
- **Data labels**: On, inside end
- **Colors**:
  - Houston: `#1864AB`
  - Dallas: `#0C8599`
- **Sort**: Descending by Weighted Rev
- **Title**: "Top 10 RMs by Weighted Revenue"

---

### Visual 5: Pipeline Aging (Stacked Column Chart)

- Visual type: **Stacked Column Chart**
- **X-axis**: `AgingBucket` field
- **Y-axis**: `[Weighted Rev]` measure
- **Legend**: `Market` field (optional, or show total)
- **Sort by**: `AgingOrder` (ascending)
- **Colors** (by aging bucket):
  - 0-30 days: `#2B8A3E` (green)
  - 31-60 days: `#ADB5BD` (gray)
  - 61-90 days: `#E67700` (amber)
  - 90+ days: `#C92A2A` (red)
- **Data labels**: On
- **Title**: "Pipeline Aging — Weighted Revenue by Days in Stage"

---

### Visual 6: Pipeline by Product (Donut Chart)

- Visual type: **Donut Chart**
- **Legend**: `Product` field
- **Values**: `[Weighted Rev]` measure
- **Colors** (by product):
  - Comm Loan: `#1864AB`
  - Deposits: `#7048E8`
  - Treasury Mgmt: `#0C8599`
  - Other Fees: `#E67700`
- **Data labels**: Category name and percentage
- **Title**: "Pipeline Mix by Product"

---

### Visual 7: Market Comparison Table

- Visual type: **Matrix** or **Table**
- **Rows**: `Market` field
- **Values** (in this order):
  - `[Open Deals]`
  - `[Total Balance]` (format: Currency)
  - `[Total Annual Rev]` (format: Currency)
  - `[Weighted Rev]` (format: Currency)
  - `[Avg Days in Stage]` (format: Whole number)
  - `[Stuck Deals]` (format: Whole number)
- **Conditional formatting**:
  - `[Avg Days in Stage]`: Red background if >60
  - `[Stuck Deals]`: Red background if >5
- **Title**: "Market Performance Summary"
- **Totals**: Show row totals

---

### Visual 8: Expected Close Trend (Area Chart)

- Visual type: **Stacked Area Chart**
- **X-axis**: `ExpectedCloseYearMonth` field
- **Y-axis**: `[Weighted Rev]` measure
- **Legend**: `Market` field
- **Colors**:
  - Houston: `#1864AB`
  - Dallas: `#0C8599`
- **Sort**: Ascending by ExpectedCloseYearMonth
- **Title**: "Expected Revenue by Close Date"
- **X-axis label**: "Month"
- **Y-axis label**: "Weighted Revenue ($)"

---

### Slicers (Filters Panel — Left Side or Top)

Add these slicers for interactivity:

#### Slicer 1: Market
- Visual type: **Slicer** (vertical list or buttons)
- Field: `Market`
- Style: **Tile** (button style)
- Multi-select: Enabled

#### Slicer 2: Product
- Visual type: **Slicer**
- Field: `Product`
- Style: **Tile**
- Multi-select: Enabled

#### Slicer 3: Stage
- Visual type: **Slicer**
- Field: `Stage`
- Style: **Dropdown**
- Multi-select: Enabled

#### Slicer 4: RM
- Visual type: **Slicer**
- Field: `RM`
- Style: **Dropdown**
- Multi-select: Enabled

#### Slicer 5: Aging Bucket
- Visual type: **Slicer**
- Field: `AgingBucket`
- Style: **Tile**
- Multi-select: Enabled
- Sort by: `AgingOrder`

---

## Pipeline Dashboard Recreation

The pipeline dashboard is an **individual RM drill-down view** showing deal-level detail.

### Page Setup
1. Create a new page, rename to "Pipeline Detail"
2. Set canvas background to `#F8F9FA`
3. Add page-level filter: `IsOpen = True`

---

### Visual 1: RM Selector (Top)

- Visual type: **Slicer** (dropdown or tile)
- Field: `RM`
- Style: **Tile** (large buttons)
- **Sync this slicer** with Regional page if desired

---

### Visual 2: RM KPI Cards (Top Row)

Same layout as Regional, but filtered to selected RM.

#### Card 1: RM Open Deals
- Visual type: **Card**
- Field: `[Open Deals]`
- Title: "My Open Deals"
- (Will auto-filter to selected RM)

#### Card 2: RM Total Pipeline
- Visual type: **Card**
- Field: `[Total Annual Rev]`
- Title: "My Total Revenue"

#### Card 3: RM Weighted Pipeline
- Visual type: **Card**
- Field: `[Weighted Rev]`
- Title: "My Weighted Revenue"

#### Card 4: RM Rank
- Visual type: **Card**
- Field: `[RM Rank]`
- Title: "My Rank"
- Font color: Conditional based on rank (1-3: Green, 4-7: Amber, 8+: Red)

---

### Visual 3: RM Stage Funnel

- Visual type: **Funnel**
- **Category**: `Stage`
- **Values**: `[Deals by Stage]` count measure
- **Sort**: By `StageOrder`
- **Colors**: Same as Regional (by stage)
- **Title**: "My Pipeline by Stage"

---

### Visual 4: Top 10 Deals Table

- Visual type: **Table**
- **Columns** (in order):
  - `Customer`
  - `Product`
  - `Stage`
  - `Amount` (format: Currency)
  - `Probability` (format: Percentage)
  - `WeightedRev` (format: Currency)
  - `DaysInStage` (format: Whole number)
  - `ExpectedClose` (format: Short date)
- **Sort**: Descending by `WeightedRev`
- **Top N filter**: Show top 10 by `WeightedRev`
- **Conditional formatting**:
  - `DaysInStage`:
    - Red background if ≥90
    - Amber background if 61-90
    - Green background if ≤30
  - `Probability`:
    - Data bars (green)
- **Title**: "My Top 10 Deals by Weighted Revenue"

---

### Visual 5: Deal Aging Distribution

- Visual type: **Clustered Column Chart**
- **X-axis**: `AgingBucket`
- **Y-axis**: `[Open Deals]` measure
- **Sort**: By `AgingOrder`
- **Colors**: Same as Regional aging colors
- **Data labels**: On
- **Title**: "My Deals by Days in Stage"

---

### Visual 6: Product Mix (Donut)

- Visual type: **Donut Chart**
- **Legend**: `Product`
- **Values**: `[Weighted Rev]`
- **Colors**: Same as Regional product colors
- **Title**: "My Pipeline Mix"

---

### Visual 7: Expected Close Timeline (Line Chart)

- Visual type: **Line Chart**
- **X-axis**: `ExpectedCloseYearMonth`
- **Y-axis**: `[Expected Rev by Month]` measure
- **Legend**: `Stage` (optional, show as stacked area instead)
- **Sort**: Ascending by month
- **Title**: "My Expected Revenue by Month"
- **Markers**: On
- **Line color**: `#1864AB`

---

### Visual 8: Detailed Deal List (Scrollable Table)

- Visual type: **Table**
- **Columns**:
  - `Customer`
  - `Product`
  - `Stage`
  - `Amount`
  - `Probability`
  - `AnnualRev`
  - `WeightedRev`
  - `DateEnteredStage`
  - `DaysInStage`
  - `ExpectedClose`
  - `Notes`
- **Sorting**: User-sortable by any column
- **Conditional formatting**: Same as Top 10 table
- **Title**: "All My Deals"
- **Enable scrolling**: Yes (table can grow beyond visual height)

---

## Using Hierarchies for Drill-Down

**Note: This section applies ONLY if you set up the star schema model (see `DataModel-Setup.md`).**

If you're using the simple single-table approach, skip this section.

---

### Hierarchies Available

After setting up the star schema, you have these hierarchies:

1. **Organization** (DimRM): Region → Market → RM
2. **Geography** (DimGeography): Region → Market
3. **Product Hierarchy** (DimProduct): ProductCategory → Product
4. **Sales Funnel** (DimStage): FunnelPhase → Stage
5. **Calendar** (DimCalendar): Year → Quarter → Month → Date

---

### Example: Drill-Down Chart with Organization Hierarchy

**Create a Regional Performance Chart with Drill-Down:**

1. Add a **Clustered Column Chart**
2. **X-axis**: Drag the **Organization** hierarchy (from DimRM)
3. **Y-axis**: `[Weighted Rev]` measure
4. The chart starts showing Region level (one bar: "South Central Region")
5. Enable drill-down icons:
   - **Format visual** → **General** → **Title** → Turn on "Drill-down icons"
6. Click the **↓ (drill down)** icon in the visual header
7. Click the bar to drill to **Market** level (now shows Houston and Dallas)
8. Click a market bar to drill to **RM** level (shows individual RMs)
9. Click **↑ (drill up)** to go back up

**Drill modes:**
- **Drill down one level**: Click the drill-down arrow, then click a data point
- **Expand to next level**: Click the expand arrow to show all children at once
- **Drill through**: Right-click a data point → Drill through

---

### Example: Matrix with Multiple Hierarchies

**Create a cross-tab with Organization × Time:**

1. Add a **Matrix** visual
2. **Rows**: **Organization** hierarchy (from DimRM)
3. **Columns**: **Calendar** hierarchy (from DimCalendar)
4. **Values**: `[Weighted Rev]`
5. Click the **Expand all down one level in the hierarchy** button (looks like ⇊)
6. The matrix expands to show:
   - Rows: Region → Markets → RMs
   - Columns: Years → Quarters → Months
7. Users can expand/collapse individual nodes by clicking the +/− icons

**Formatting tip:**
- Turn on **Stepped layout** for cleaner row hierarchy display
- Format → Row headers → Stepped layout → On

---

### Example: Slicer with Hierarchy

**Create an interactive Organization slicer:**

1. Add a **Slicer** visual
2. **Field**: **Organization** hierarchy
3. Format → Slicer settings:
   - **Selection**: Multi-select with Ctrl
   - **Show "Select all"**: On
4. In the slicer header, click the hierarchy icon
5. Enable **Hierarchy** mode
6. Users can now:
   - Select entire Region (filters all markets and RMs)
   - Expand and select specific Markets
   - Expand and select individual RMs
7. Selections cascade down the hierarchy

---

### Example: Product Mix by Region (Drill to Detail)

**Show product distribution at any org level:**

1. Add a **Stacked Bar Chart**
2. **Y-axis**: **Organization** hierarchy
3. **X-axis**: `[Weighted Rev]`
4. **Legend**: `Product` (from DimProduct, or use Product Hierarchy for drill-down)
5. Data labels: On
6. Users can drill from Region → Market → RM
7. At each level, the product mix adjusts automatically

---

### Using Hierarchy-Aware DAX Measures

If you created the measures from `DAX-HierarchyMeasures.txt`, you can use:

**Current Level indicator:**
- Add a **Card** visual
- Field: `[Current Level Name]`
- Shows "Region", "Houston", "M. Reyes", etc. based on filter context

**Rank within parent:**
- Add `[Rank in Parent]` to a table
- Shows each RM's rank within their market
- Or each market's rank within the region

**% of Parent Total:**
- Add `[% of Parent Total]` to visuals
- Shows what % of the parent's total this entity represents
- Useful for contribution analysis

**Parent Level Average:**
- Compare `[Weighted Rev]` vs `[Parent Level Avg]`
- See which RMs are above/below their market average
- Or which markets are above/below regional average

---

### Drill-Through Pages with Hierarchies

**Enable drill-through from summary to detail:**

1. Create a **Regional Dashboard** page (summary)
2. Create a **Market Detail** page
   - Add `Market` to **Drill through** field well
   - Build visuals that show market-level detail
3. Create an **RM Detail** page
   - Add `RM` to **Drill through** field well
   - Build visuals for individual RM analysis

**Usage:**
- On Regional Dashboard, right-click a Market name
- Select **Drill through** → **Market Detail**
- Power BI navigates to the Market Detail page with that market pre-selected
- Add a **Back** button to return to Regional Dashboard

---

### Best Practices for Hierarchies

1. **Always sort hierarchy levels** (e.g., Stage by StageOrder)
2. **Use hierarchy-aware measures** that work at any level
3. **Test drill-down at all levels** to ensure measures aggregate correctly
4. **Enable drill icons** in visual headers for discoverability
5. **Use tooltips** to show additional hierarchy context
6. **Add breadcrumbs** (text box showing current path: Region > Market > RM)

---

## Formatting & Themes

### Create a Custom Theme

1. Save this JSON as `pipeline-theme.json`:

```json
{
  "name": "Pipeline Dashboard",
  "dataColors": [
    "#1864AB", "#7048E8", "#0C8599", "#E67700",
    "#2B8A3E", "#C92A2A", "#ADB5BD"
  ],
  "background": "#FFFFFF",
  "foreground": "#212529",
  "tableAccent": "#1864AB",
  "good": "#2B8A3E",
  "neutral": "#E67700",
  "bad": "#C92A2A",
  "textClasses": {
    "callout": {
      "fontSize": 32,
      "fontFace": "Segoe UI",
      "color": "#1864AB"
    },
    "title": {
      "fontSize": 12,
      "fontFace": "Segoe UI",
      "color": "#1864AB"
    },
    "header": {
      "fontSize": 11,
      "fontFace": "Segoe UI",
      "color": "#495057"
    },
    "label": {
      "fontSize": 10,
      "fontFace": "Segoe UI",
      "color": "#78716C"
    }
  }
}
```

2. In Power BI Desktop:
   - Go to **View** → **Themes** → **Browse for themes**
   - Select your `pipeline-theme.json` file
   - All visuals will now use these colors by default

### Visual-Level Formatting Tips

For **consistency across all visuals**:

1. **Titles**:
   - Font: Segoe UI
   - Size: 12pt
   - Weight: Bold
   - Color: `#1864AB`
   - Alignment: Left

2. **Data Labels**:
   - Font: Segoe UI
   - Size: 11pt
   - Color: `#78716C`
   - Background: White with 80% transparency

3. **Gridlines**:
   - Color: `#DEE2E6`
   - Stroke width: 1px
   - Style: Solid

4. **Tooltips** (customize for each visual):
   - Add relevant fields
   - Show: Customer, Product, Stage, Amount, Weighted Rev, Days in Stage
   - Format: Clean, concise

---

## Advanced: Drill-Through from Regional to Pipeline

Enable drill-through so users can right-click an RM on the Regional page and jump to their Pipeline detail.

### Setup Drill-Through

1. Go to **Pipeline Detail** page
2. In the **Visualizations** pane, find **Drill through** section
3. Drag `RM` field into the **Drill-through fields** well
4. Set "Keep all filters" to **On**

### Usage

On the Regional page:
- Right-click any RM name (in table or chart)
- Select **Drill through** → **Pipeline Detail**
- Power BI jumps to the Pipeline page with that RM pre-selected

---

## Refresh Data

When the Excel file is updated by RMs:

1. Save the updated `RM-pipeline-workbook.xlsx` in the same location
2. In Power BI Desktop, click **Home** → **Refresh**
3. All visuals update automatically
4. Publish to Power BI Service if sharing online

---

## Publishing to Power BI Service (Optional)

To share dashboards online:

1. In Power BI Desktop, click **Home** → **Publish**
2. Sign in with your Microsoft 365 / Power BI account
3. Select a workspace (or create new)
4. Once published, click the link to view in browser
5. Set up **scheduled refresh** in Power BI Service:
   - Go to dataset settings
   - Configure data source credentials (if Excel is on OneDrive/SharePoint)
   - Set refresh schedule (e.g., daily at 9 AM)

---

## Troubleshooting

### "File not found" error
- Check the file path in Power Query M code (line 22)
- Use full path with double backslashes: `C:\\Users\\...` or single forward slashes: `C:/Users/...`

### Visuals show "(Blank)" or no data
- Verify `IsOpen = TRUE` filter is applied where needed
- Check that measures are summing/counting the right table
- Ensure relationships are correct (shouldn't need any for single table model)

### Colors not matching
- Double-check hex codes (case-insensitive but must include `#`)
- Apply theme first, then override specific visuals as needed

### Conditional formatting not working
- Ensure the field you're formatting is numeric (not text)
- Use "Rules" or "Field value" conditional formatting
- Test with simple conditions first (e.g., >100)

---

## Summary Checklist

- [ ] Load data using Power Query M code
- [ ] Create all DAX measures from DAX-Measures.txt
- [ ] Apply custom color theme
- [ ] Build Regional dashboard page with 8 visuals
- [ ] Build Pipeline Detail dashboard page with 8 visuals
- [ ] Add slicers for filtering
- [ ] Set up drill-through from Regional to Pipeline
- [ ] Test all visuals with different filters
- [ ] Format titles, labels, and colors consistently
- [ ] Test data refresh with updated Excel file
- [ ] (Optional) Publish to Power BI Service

---

## Files Referenced

- `PowerQuery-LoadWorkbook.m` — M code to load Excel data
- `DAX-Measures.txt` — All DAX measures to create
- `RM-pipeline-workbook.xlsx` — Source data file
- `pipeline-theme.json` — (Create this yourself from JSON above)

---

## Support & Customization

This guide recreates the web dashboards in Power BI. Customize as needed:
- Add more visuals (scatter plots, gauges, etc.)
- Create additional pages for drill-downs (by market, by product)
- Add bookmarks for saved views
- Enable Q&A natural language queries
- Add row-level security (RLS) so each RM sees only their data

Enjoy your Power BI dashboards! 🚀
