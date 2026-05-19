# Pipeline Excel ↔ Dashboard Sync

This directory contains tools to keep the Excel workbook (`RM-pipeline-workbook.xlsx`) in sync with the pipeline dashboard's synthetic data.

## 🔄 How to Sync

The Excel workbook and the web dashboard (`/pipeline/index.html`) use the **same underlying data**. To update the Excel file to match the dashboard:

### 1. Generate deals JSON from dashboard

```bash
node pipeline/templates/dump_deals.js > pipeline/templates/deals.json
```

This extracts all deals from the dashboard's JavaScript data layer (`/pipeline/js/data.js`) and saves them as JSON.

### 2. Sync Excel workbook

```bash
python3 -m venv venv  # First time only
source venv/bin/activate
pip install openpyxl  # First time only

python3 pipeline/templates/sync_excel.py
```

This reads `deals.json` and populates the Excel workbook with:
- **Active Pipeline sheet**: Open deals only (67 deals) - these are deals actively being worked
- **Closed YTD sheet**: Closed deals (9 deals) - kept separate as reference data, not part of active pipeline
- **Summary sheet**: Key metrics broken down by active pipeline vs closed YTD

### 3. Verify alignment (optional)

```bash
python3 pipeline/templates/verify_alignment.py
```

This confirms that the Excel data matches the dashboard exactly.

## 📊 What Gets Synced

From the dashboard's `data.js`:
- **7 officers** across Houston (4) and Dallas (3) markets
- **76 deals total** distributed by officer performance:
  - **67 active pipeline deals** (Lead, Qualified, Proposal, Commit stages)
  - **9 closed YTD deals** (Closed stage - kept separate for reference)
- **Active pipeline** includes:
  - Strong performers (adj > 1.0) carry more late-stage deals
  - Weak performers (adj < 0.9) have more early-stage, stuck deals
- **5 stages**: Lead, Qualified, Proposal, Commit, Closed
- **4 products**: Commercial Loan, Deposits, Treasury Management, Other Fees
- **Probability weighting** by stage (Lead 10%, Qualified 25%, Proposal 50%, Commit 80%, Closed 100%)
- **Annual revenue** calculated from deal amounts using product-specific conversion ratios

### Important: Active Pipeline vs Closed YTD

The Excel workbook **separates active pipeline from closed deals**:
- **Active Pipeline** sheet contains only open deals being actively worked
- **Closed YTD** sheet contains deals already won (reference data only)
- This separation ensures pipeline metrics focus on forward-looking opportunities
- Closed revenue is still tracked and reported, but separately

## 🎯 Use Cases

**Why sync them?**
- The web dashboard is great for **interactive exploration** and drill-down
- The Excel workbook is needed for **Power BI ingestion** and data modeling
- Keeping them aligned ensures Power BI reports match the web dashboard exactly

**When to sync:**
- After modifying officer data in `/pipeline/js/data.js`
- After changing deal generation logic
- Before creating a new Power BI report
- Anytime you want to verify the data layer is working correctly

## 📁 Files

- `dump_deals.js` - Extracts deals from dashboard JavaScript
- `sync_excel.py` - Populates Excel workbook from deals JSON
- `verify_alignment.py` - Validates Excel ↔ dashboard alignment
- `deals.json` - Intermediate JSON format (generated)
- `RM-pipeline-template.xlsx` - Original empty template
- `../RM-pipeline-workbook.xlsx` - Current workbook (synced data)

## ⚠️ Notes

- The dashboard data is **deterministically generated** using a seeded RNG, so the same deals appear every time you load the page
- The Excel sync completely **replaces** the Deals sheet to avoid merge cell issues
- Deal IDs are stable across syncs (e.g., `h-reyes-0`, `d-chen-3`)
- All amounts are in **USD**
- Dates use **ISO format** (YYYY-MM-DD) in JSON, converted to Excel date format in the workbook

## 🚀 Quick Sync (One Command)

```bash
cd /path/to/dashboard-region
node pipeline/templates/dump_deals.js > pipeline/templates/deals.json && \
python3 pipeline/templates/sync_excel.py && \
echo "✅ Sync complete!"
```
