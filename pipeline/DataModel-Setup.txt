# Data Model Setup — Star Schema with Hierarchies

This guide shows how to set up a **star schema data model** in Power BI with proper relationships and hierarchies for drill-down analysis.

---

## Star Schema Architecture

```
                    ┌─────────────┐
                    │ DimCalendar │
                    └─────────────┘
                           │
                           │ 1:M
                           ▼
┌──────────┐        ┌─────────────┐        ┌────────────┐
│ DimRM    │        │   DEALS     │        │ DimStage   │
│          │◄───────┤   (FACT)    │───────►│            │
└──────────┘  1:M   └─────────────┘  M:1   └────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │ 1:M             │ 1:M             │ 1:M
         ▼                 ▼                 ▼
  ┌────────────┐    ┌────────────┐    ┌────────────┐
  │DimGeography│    │ DimProduct │    │  DimAging  │
  └────────────┘    └────────────┘    └────────────┘
```

### Tables

1. **Deals** (Fact) — Central transaction table with measures
2. **DimRM** — RM dimension with Region → Market → RM hierarchy
3. **DimGeography** — Geography dimension with Region → Market hierarchy
4. **DimProduct** — Product dimension with category groupings
5. **DimStage** — Sales stage dimension with funnel phases
6. **DimAging** — Aging bucket dimension with risk levels
7. **DimCalendar** — Date dimension for time intelligence

---

## Step-by-Step Setup

### Step 1: Load the Fact Table

1. Open Power BI Desktop
2. **Home** → **Get Data** → **Blank Query**
3. **Home** → **Advanced Editor**
4. Paste the contents of `PowerQuery-WithDimensions.m`
5. Update the `FilePath` variable at the top (line 19)
6. Click **Done**
7. Rename the query to **"Deals"**
8. **DO NOT** click Close & Apply yet

---

### Step 2: Load All Dimension Tables

For **each** dimension table, repeat these steps:

1. **Home** → **New Source** → **Blank Query**
2. **Home** → **Advanced Editor**
3. Open `PowerQuery-DimTables.m` and find the section for that dimension
4. Copy ONLY that dimension's code (from `let` to `in`)
5. Paste into the Advanced Editor
6. Click **Done**
7. Rename the query to match the dimension name

**Create these 6 dimension queries:**

| Query Name | Code Section to Copy |
|------------|---------------------|
| DimGeography | Lines 15-73 (// DIM GEOGRAPHY) |
| DimRM | Lines 78-155 (// DIM RM) |
| DimProduct | Lines 160-205 (// DIM PRODUCT) |
| DimStage | Lines 210-255 (// DIM STAGE) |
| DimAging | Lines 260-290 (// DIM AGING) |
| DimCalendar | Lines 295-360 (// DIM CALENDAR) |

---

### Step 3: Apply and Load

1. Click **Home** → **Close & Apply**
2. Wait for all tables to load (you should see 7 tables in the Fields pane)

---

### Step 4: Create Relationships

Power BI may auto-detect some relationships. Verify and create these manually:

1. Go to **Model** view (left sidebar, third icon)
2. Create the following relationships by dragging from one table to another:

| From Table | From Column | To Table | To Column | Cardinality | Cross Filter |
|------------|-------------|----------|-----------|-------------|--------------|
| Deals | RMKey | DimRM | RM | Many-to-One (*:1) | Single |
| Deals | MarketKey | DimGeography | Market | Many-to-One (*:1) | Single |
| Deals | ProductKey | DimProduct | ProductKey | Many-to-One (*:1) | Single |
| Deals | StageKey | DimStage | StageKey | Many-to-One (*:1) | Single |
| Deals | AgingBucket | DimAging | AgingBucket | Many-to-One (*:1) | Single |
| Deals | ExpectedClose | DimCalendar | Date | Many-to-One (*:1) | Single |

**How to create a relationship:**
- Drag the column from the "From Table" to the "To Column" in the "To Table"
- In the dialog, verify the cardinality is Many-to-One (*:1)
- Ensure "Cross filter direction" is **Single** (not Both)
- Click OK

---

### Step 5: Mark DimCalendar as Date Table

1. In Model view, click on **DimCalendar** table
2. **Table tools** → **Mark as date table**
3. Select **Date** as the date column
4. Click OK

This enables time intelligence functions like YTD, MTD, etc.

---

### Step 6: Create Hierarchies

Hierarchies enable drill-down in visuals (e.g., Region → Market → RM).

#### Hierarchy 1: Geography

1. In the **Fields** pane (right side), find **DimGeography** table
2. Right-click **Region** → **Create hierarchy**
3. A new item appears: "Region Hierarchy"
4. Drag **Market** onto "Region Hierarchy"
5. Rename to **"Geography"** (right-click → Rename)

**Result**: Geography hierarchy with 2 levels: Region → Market

---

#### Hierarchy 2: Organization (RM Hierarchy)

1. In **DimRM** table, right-click **Region** → **Create hierarchy**
2. Drag these fields onto the hierarchy **in order**:
   - Market
   - RM
3. Rename to **"Organization"**

**Result**: Organization hierarchy with 3 levels: Region → Market → RM

---

#### Hierarchy 3: Product Category

1. In **DimProduct** table, right-click **ProductCategory** → **Create hierarchy**
2. Drag **Product** onto the hierarchy
3. Rename to **"Product Hierarchy"**

**Result**: Product Hierarchy with 2 levels: ProductCategory → Product

---

#### Hierarchy 4: Sales Funnel

1. In **DimStage** table, right-click **FunnelPhase** → **Create hierarchy**
2. Drag **Stage** onto the hierarchy
3. Rename to **"Sales Funnel"**

**Result**: Sales Funnel hierarchy with 2 levels: FunnelPhase → Stage

---

#### Hierarchy 5: Time Hierarchy

1. In **DimCalendar** table, right-click **Year** → **Create hierarchy**
2. Drag these fields onto the hierarchy **in order**:
   - Quarter
   - MonthName
   - Date
3. Rename to **"Calendar"**

**Result**: Calendar hierarchy with 4 levels: Year → Quarter → Month → Date

---

### Step 7: Hide Technical Columns

Keep your model clean by hiding columns users don't need:

**In Deals table, hide these:**
- RMKey
- MarketKey
- ProductKey
- StageKey
- ExpectedCloseYear
- ExpectedCloseQuarter
- ExpectedCloseYearMonth

**How to hide:**
- Right-click column → **Hide in report view**
- Or select column → **Column tools** → **Hide**

---

### Step 8: Set Sort Orders

Ensure text fields sort correctly:

1. In **DimStage** table:
   - Click **Stage** column
   - **Column tools** → **Sort by column** → **StageOrder**

2. In **DimAging** table:
   - Click **AgingBucket** column
   - **Sort by column** → **AgingOrder**

3. In **DimProduct** table:
   - Click **Product** column
   - **Sort by column** → **ProductOrder**

4. In **DimGeography** table:
   - Click **Market** column
   - **Sort by column** → **MarketOrder**

5. In **DimCalendar** table:
   - Click **MonthName** column
   - **Sort by column** → **Month**
   - Click **Quarter** column
   - **Sort by column** → **QuarterNum**

---

### Step 9: Organize Display Folders (Optional)

Group related fields in the Fields pane:

**In Deals table:**

1. Select these columns: Amount, AnnualRev, WeightedRev
   - Right-click → **New group** → Name: "Values"

2. Select: DateEnteredStage, DaysInStage, AgingBucket
   - **New group** → Name: "Aging"

3. Select: ExpectedClose, IsOpen, IsClosed
   - **New group** → Name: "Status"

---

## Using Hierarchies in Visuals

### Drill-Down in Charts

1. Create a **Clustered Column Chart**
2. Add the **Organization** hierarchy to the X-axis
3. Add a measure (e.g., `[Weighted Rev]`) to the Y-axis
4. The chart starts at Region level
5. Click the **drill-down** arrow in the visual header
6. Click a bar to drill to Market level
7. Click again to drill to RM level
8. Use the **drill-up** arrow to go back up

### Matrix with Hierarchies

1. Create a **Matrix** visual
2. Add **Organization** hierarchy to Rows
3. Add **Calendar** hierarchy to Columns
4. Add `[Weighted Rev]` to Values
5. Click the **Expand all down one level** button to drill through all levels
6. Users can expand/collapse individual nodes

### Slicers with Hierarchies

1. Create a **Slicer**
2. Add **Organization** hierarchy as the field
3. Enable **Hierarchy** mode in slicer settings
4. Users can select at any level (e.g., select all of "Houston" market)

---

## Benefits of This Model

✅ **Drill-down analysis**: Start at Region, drill to Market, drill to individual RM
✅ **Consistent aggregations**: All measures roll up correctly
✅ **Easier filtering**: Filter by FunnelPhase to see all Early/Mid/Late stage deals
✅ **Better performance**: Star schema is optimized for BI queries
✅ **Reusable dimensions**: Same DimRM table can be used in future dashboards
✅ **Time intelligence**: DimCalendar enables YTD, QTD, MTD calculations
✅ **Cleaner visuals**: Use hierarchies instead of multiple drill-through pages

---

## Sample DAX for Hierarchies

These measures automatically work at any hierarchy level:

```dax
// Works at Region, Market, or RM level
Weighted Rev by Level =
CALCULATE(
    SUM(Deals[WeightedRev]),
    Deals[IsOpen] = TRUE
)

// Automatically aggregates by selected time level
Pipeline by Period =
CALCULATE(
    SUM(Deals[WeightedRev]),
    Deals[IsOpen] = TRUE
)

// Compares current RM to parent (Market) average
RM vs Market Avg =
VAR CurrentLevel = [Weighted Rev]
VAR MarketAvg =
    CALCULATE(
        AVERAGE(DimRM[MarketAverage]),
        ALLEXCEPT(DimRM, DimRM[Market])
    )
RETURN
CurrentLevel - MarketAvg
```

---

## Validation Checklist

After setup, verify:

- [ ] All 7 tables loaded successfully
- [ ] 6 relationships created (all Many-to-One, Single direction)
- [ ] DimCalendar marked as date table
- [ ] 5 hierarchies created (Geography, Organization, Product, Funnel, Calendar)
- [ ] Sort orders set on Stage, AgingBucket, Product, Market, Month
- [ ] Technical key columns hidden in report view
- [ ] Test drill-down: Create a chart with Organization hierarchy and drill through all levels

---

## Data Model Best Practices

1. **Always filter at the fact table level** in DAX measures
2. **Use dimension attributes** for slicing (e.g., DimRM[Title], DimProduct[ProductCategory])
3. **Never create relationships between dimensions** (only fact to dimension)
4. **Use RELATED() function** to pull dimension attributes into fact-level calculations
5. **Test at all hierarchy levels** to ensure measures aggregate correctly

---

## Troubleshooting

**Issue**: Relationships won't create
- **Fix**: Check that key columns have matching data types (both text or both number)

**Issue**: Hierarchy doesn't drill correctly
- **Fix**: Ensure sort order columns are set (e.g., Stage sorted by StageOrder)

**Issue**: Measures show wrong values at different hierarchy levels
- **Fix**: Avoid using FILTER() on dimension tables; use CALCULATE() with Deals table filters

**Issue**: Circular dependency detected
- **Fix**: Ensure no relationships exist between dimension tables (only fact-to-dimension)

---

## Next Steps

1. Create DAX measures (see `DAX-Measures.txt`)
2. Build visuals using hierarchies (see `PowerBI-Setup-Guide.md`)
3. Test drill-down at all hierarchy levels
4. Add row-level security if needed (filter DimRM by USERPRINCIPALNAME())
