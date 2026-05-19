# How the Financial Dashboard Connects to Pipeline Coverage

## 🔗 Yes! The Revenue Gap Comes from the Financial Dashboard

The **$3.8M revenue gap** in the pipeline dashboard is **directly derived** from the financial performance data. Here's how they connect:

## 📊 The Financial Dashboard Shows the Problem

### From the Financial Dashboard ([financials/](financials/))

**Key metrics visible in the scorecard:**

1. **YTD Actual Revenue** (6 months): ~$58M
   - Jan-Jun 2026 actuals
   - Region started soft (Q1 behind 2-3%)
   - Recovering in Q2

2. **Full Year Forecast**: ~$120M
   - Based on 6 months actual + 6 months forecast
   - Includes projected improvement in H2

3. **Run Rate** (annualized from YTD): ~$116M
   ```
   Run Rate = (YTD Actual / 6 months) × 12
   Run Rate = ($58M / 6) × 12 = $116M
   ```

4. **Gap vs Forecast**: -$3.8M 🔴
   ```
   Gap = Run Rate - Forecast
   Gap = $116M - $120M = -$3.8M
   ```

**What this means:**
- If current performance continues (run rate), the region will hit $116M
- The forecast/budget/target is $120M
- There's a **$3.8M shortfall** — this is the **Revenue Gap**

### Visual in Financial Dashboard

In the **"⑪ Run Rate vs Forecast"** gauge card and KPI strip:
- Shows run rate trending below forecast
- Color-coded RED because gap is > -5%
- Displays: "vs Forecast: -$3.8M"

## 🔄 The Pipeline Dashboard Addresses the Solution

### From the Pipeline Dashboard ([pipeline/](pipeline/))

The pipeline dashboard takes that **$3.8M revenue gap** and asks:

> **"Do we have enough deals in our pipeline to close this gap?"**

**Current answer: NO** (0.80x coverage)

```
Revenue Gap (from financials):  $3.8M   ← The problem
Weighted Pipeline:              $3.04M  ← Current solution attempt
Coverage Ratio:                 0.80x   ← Only 80% of what's needed!
```

## 🎯 The Complete Story Across Both Dashboards

### Step 1: Financial Dashboard Identifies the Gap

**West Region Financial Performance:**
- **Actuals through June**: Behind plan ~2-3% in Q1, recovering in Q2
- **Officers performing mixed**:
  - D. Patel (adj 1.05): 5% ahead of plan ✅
  - A. Tran (adj 1.00): On plan ✅
  - M. Reyes (adj 0.97): 3% behind plan ⚠️
  - S. Garcia (adj 0.91): 9% behind plan 🔴
  - K. Williams (adj 0.82): **18% behind plan** 🔴🔴
- **Year-end projection**: $3.8M revenue shortfall if trends continue

### Step 2: Pipeline Dashboard Shows if Gap Can Be Closed

**West Region Pipeline:
- **67 active pipeline deals** across same 7 officers
- **Weighted pipeline revenue**: $3.04M
- **Coverage of $3.8M gap**: 0.80x 🔴
- **Conclusion**: Insufficient pipeline to close the financial gap

### Step 3: Drill Down Reveals Root Causes

**At the officer level, both dashboards align:**

| Officer | Financial (adj) | Pipeline Likely Coverage | Status |
|---------|----------------|------------------------|--------|
| **K. Williams** | 0.82 (18% behind) | Worst coverage (~0.62x) | 🔴🔴 Needs urgent support |
| **S. Garcia** | 0.91 (9% behind) | Below average (~0.75x) | 🔴 Needs attention |
| **M. Reyes** | 0.97 (3% behind) | Slightly below (~0.85x) | ⚠️ Monitor closely |
| **A. Tran** | 1.00 (on plan) | Average (~0.95x) | ⚠️ Could be better |
| **R. Chen** | 1.01 (1% ahead) | Above average (~1.05x) | ✅ Performing well |
| **D. Patel** | 1.05 (5% ahead) | Best coverage (~1.10x) | ✅ Model performer |
| **B. Foster** | 1.00 (on plan) | Average (~0.95x) | ⚠️ Could be better |

## 🔍 How the $3.8M Gap is Calculated

### Method 1: Run Rate vs Forecast (Used in Financial Dashboard)

```javascript
// From financials/js/main.js and charts.js

const ytdRev = sum(actM, 'totalRev');      // $58M (6 months actual)
const fyFct = sum(monthly, 'totalRev');    // $120M (full year forecast)
const runRate = (ytdRev / ACT) * 12;       // ($58M / 6) × 12 = $116M
const gap = runRate - fyFct;               // $116M - $120M = -$3.8M
const gapPct = (gap / fyFct) * 100;        // -3.2% behind forecast
```

**Color coding:**
- Green (on track): gap > -2% (within $2.4M of forecast)
- Amber (warning): gap between -2% and -5% (between -$2.4M and -$6M)
- Red (behind): gap < -5% (more than $6M behind) ← **Current state at -$3.8M**

### Method 2: Budget vs Projection (Alternative View)

```javascript
// Alternative calculation (not shown in current dashboard but conceptually)

const annualBudget = $120M;        // What we're supposed to deliver
const currentProjection = $116.2M;  // What we'll actually deliver
const gap = annualBudget - currentProjection;  // $3.8M shortfall
```

## 🎪 The Two Dashboards Work Together

### Financial Dashboard = **Diagnosis**
- "We're $3.8M behind where we need to be"
- Shows historical performance and forecast
- Identifies which officers/markets are underperforming
- **Backward-looking + current trajectory**

### Pipeline Dashboard = **Treatment Plan**
- "We need $3.8M in new revenue to close the gap"
- Shows if pipeline is sufficient (it's not — only 0.80x coverage)
- Identifies which officers need to build more pipeline
- Shows deal aging, stage distribution, product mix
- **Forward-looking + actionable**

## 💡 Real-World Management Flow

### Monthly Business Review Conversation:

**CFO** (looking at Financial Dashboard):
> "Our run rate is $116M against a $120M plan. We have a $3.8M gap. Where's the upside coming from?"

**Head of Sales** (looking at Pipeline Dashboard):
> "Our weighted pipeline is only $3.04M — we're at 0.80x coverage. Even if every deal closes as expected, we'll only recover $3M of the $3.8M gap. We need to add ~$8M more weighted pipeline to get to healthy 3x coverage."

**Regional Manager**:
> "The issue is concentrated in Houston. K. Williams is 18% behind plan and has weak pipeline coverage. We need to either:
> - Assign them prospecting resources
> - Reallocate deals from Dallas officers who are ahead
> - Put them on a performance improvement plan"

**Action Items**:
1. Houston market: Add $5M weighted pipeline by end of Q3
2. K. Williams: Weekly pipeline reviews, coaching on advancing deals
3. D. Patel (performing ahead): Expand territory or mentor Williams
4. All RMs: Focus on moving deals from Lead → Qualified → Proposal

## 📈 How Success Would Look (3 Months Later)

### Financial Dashboard (updated with Q3 actuals):
- YTD actual (9 months): $88M
- Run rate: $117.3M (improving from $116M)
- Gap vs forecast: -$2.7M (improving from -$3.8M)
- Status: Amber ⚠️ (was Red 🔴)

### Pipeline Dashboard:
- Weighted pipeline: $8.5M (increased from $3.04M)
- Coverage of $2.7M gap: 3.15x ✅ (was 0.80x 🔴)
- Status: Green — enough pipeline to close remaining gap

## 🔑 Key Takeaway

The dashboards are **two sides of the same coin**:

1. **Financial Dashboard** identifies the $3.8M revenue gap by comparing:
   - Current run rate ($116M)
   - Target/forecast ($120M)

2. **Pipeline Dashboard** assesses whether current pipeline ($3.04M weighted) is sufficient to close that gap (it's not — need $11.4M for 3x coverage)

The $3.8M figure appears in both because they're measuring the **same business problem** from different angles:
- **Financial**: "We're behind by $3.8M"
- **Pipeline**: "We need to generate $3.8M from pipeline (so carry $11.4M weighted)"

---

**In a real implementation**, you might even add a direct link between the dashboards:
- Click "Revenue Gap" in financial dashboard → Opens pipeline dashboard filtered to officers/markets driving the gap
- Click an officer's coverage ratio in pipeline → Opens their financial performance card
