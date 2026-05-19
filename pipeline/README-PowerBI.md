# Power BI Setup Files — Quick Reference

This directory contains everything you need to recreate the RM Pipeline dashboards in Power BI Desktop.

---

## 📁 Files Overview

### Core Setup Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **PowerQuery-LoadWorkbook.m** | Simple single-table data load | Quick start, no hierarchies needed |
| **PowerQuery-WithDimensions.m** | Fact table for star schema | ⭐ RECOMMENDED: When you want hierarchies |
| **PowerQuery-DimTables.m** | 6 dimension tables | ⭐ Use with star schema approach |
| **DataModel-Setup.md** | Complete star schema guide | ⭐ Step-by-step setup with hierarchies |
| **PowerBI-Setup-Guide.md** | Full dashboard recreation guide | All visual specs and instructions |

### DAX Measures

| File | Purpose |
|------|---------|
| **DAX-Measures.txt** | 30+ basic measures (Open Deals, Weighted Rev, etc.) |
| **DAX-HierarchyMeasures.txt** | 50+ advanced hierarchy-aware measures |

### Styling

| File | Purpose |
|------|---------|
| **pipeline-theme.json** | Power BI theme with matching colors |

---

## 🚀 Quick Start Guide

### Option 1: Simple Approach (No Hierarchies)

**Best for**: Quick setup, single table model, basic analysis

1. Open Power BI Desktop
2. Get Data → Blank Query → Advanced Editor
3. Paste contents of **PowerQuery-LoadWorkbook.m**
4. Update file path (line 22)
5. Close & Apply
6. Create measures from **DAX-Measures.txt**
7. Build visuals using **PowerBI-Setup-Guide.md**

**Time**: ~30 minutes

---

### Option 2: Star Schema with Hierarchies (⭐ RECOMMENDED)

**Best for**: Professional dashboards, drill-down analysis, best performance

1. Follow **DataModel-Setup.md** (step-by-step)
   - Load fact table from **PowerQuery-WithDimensions.m**
   - Load 6 dimension tables from **PowerQuery-DimTables.m**
   - Create relationships
   - Build hierarchies (Region → Market → RM, etc.)
2. Create measures from **DAX-HierarchyMeasures.txt**
3. Build visuals using **PowerBI-Setup-Guide.md**
4. Use hierarchy drill-down section for interactive charts

**Time**: ~90 minutes

**Benefits**:
- ✅ Drill from Region → Market → RM
- ✅ Time intelligence (YTD, QTD, MTD)
- ✅ Better performance on large datasets
- ✅ Cleaner data model
- ✅ Reusable dimensions

---

## 📊 What You'll Build

### Regional Dashboard
- KPI cards (Open Deals, Pipeline Value, Coverage)
- Pipeline by Market (bar chart)
- Pipeline by Stage (funnel)
- Top 10 RMs (ranked bar chart)
- Aging distribution (column chart)
- Product mix (donut chart)
- Market comparison table
- Expected close trend (area chart)

### Pipeline Dashboard (Individual RM View)
- RM-specific KPI cards
- Stage funnel
- Top 10 deals table
- Aging distribution
- Product mix
- Expected close timeline
- Detailed deal list (scrollable table)

---

## 🎨 Color Palette

Use these hex codes for consistent styling:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#1864AB` | Main data, KPIs |
| Gray | `#ADB5BD` | Budget/targets |
| Green | `#2B8A3E` | Positive, Commit stage |
| Red | `#C92A2A` | Alerts, stuck deals |
| Amber | `#E67700` | Warnings |
| Purple | `#7048E8` | Deposits |
| Teal | `#0C8599` | Treasury Mgmt |

Apply the theme by importing **pipeline-theme.json** (View → Themes → Browse).

---

## 📋 Setup Checklist

### Simple Single-Table Model
- [ ] Load data from PowerQuery-LoadWorkbook.m
- [ ] Update file path in M code
- [ ] Create all measures from DAX-Measures.txt
- [ ] Apply pipeline-theme.json
- [ ] Build Regional dashboard visuals
- [ ] Build Pipeline dashboard visuals
- [ ] Add slicers for filtering
- [ ] Test all visuals

### Star Schema Model (Recommended)
- [ ] Load Deals fact table from PowerQuery-WithDimensions.m
- [ ] Load 6 dimension tables from PowerQuery-DimTables.m
- [ ] Create 6 relationships (Deals to each dimension)
- [ ] Mark DimCalendar as date table
- [ ] Create 5 hierarchies (Organization, Geography, Product, Funnel, Calendar)
- [ ] Set sort orders (Stage by StageOrder, etc.)
- [ ] Hide technical columns (keys, YearMonth, etc.)
- [ ] Create measures from DAX-HierarchyMeasures.txt
- [ ] Apply pipeline-theme.json
- [ ] Build dashboards with hierarchy drill-down
- [ ] Test drill-down at all levels

---

## 💡 Tips & Best Practices

### Data Loading
- Update the file path to where you saved `RM-pipeline-workbook.xlsx`
- Use forward slashes or double backslashes in paths: `C:/Users/...` or `C:\\Users\\...`
- If Excel file is on OneDrive/SharePoint, use the web path for auto-refresh

### Measures
- Create a `_Measures` table (Home → Enter Data, leave empty) to organize measures
- Format each measure as indicated in the .txt file (currency, %, whole number)
- Test measures at different hierarchy levels to ensure they aggregate correctly

### Visuals
- Enable drill-down icons in visual headers (Format → General → Title)
- Use conditional formatting for Days in Stage (green <30, amber 61-90, red >90)
- Add data labels to all charts for clarity
- Set tooltips to show additional context

### Performance
- Use star schema for datasets with >10,000 rows
- Avoid calculated columns; use measures instead
- Import mode is fine for this dataset; consider DirectQuery for live data

### Sharing
- Publish to Power BI Service (Home → Publish)
- Set up scheduled refresh if Excel is on OneDrive
- Use row-level security (RLS) to filter by RM if needed

---

## 🔧 Troubleshooting

**"File not found"**
- Check file path in Power Query M code (must be absolute path)

**Relationships won't create**
- Verify matching data types (text to text, date to date)

**Measures show wrong values**
- Ensure you're using the right table (Deals for fact-level, Dim* for attributes)

**Visuals are blank**
- Check for `IsOpen = TRUE` filter on open pipeline visuals

**Hierarchies don't drill correctly**
- Set sort orders (Stage by StageOrder, Market by MarketOrder, etc.)

---

## 📚 Additional Resources

- [Power BI Documentation](https://docs.microsoft.com/power-bi/)
- [DAX Guide](https://dax.guide/)
- [Star Schema Best Practices](https://docs.microsoft.com/power-bi/guidance/star-schema)

---

## 🎯 Next Steps

1. Choose your approach (simple or star schema)
2. Follow the setup guide
3. Build the dashboards
4. Customize to your needs
5. Publish and share!

**Questions?** Refer to the detailed guides:
- **DataModel-Setup.md** — Star schema setup
- **PowerBI-Setup-Guide.md** — Visual specifications
- **DAX-Measures.txt** and **DAX-HierarchyMeasures.txt** — Measure formulas
