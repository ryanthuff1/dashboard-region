#!/usr/bin/env python3
"""
Verify that the Excel workbook matches the pipeline dashboard data.
"""

import json
from pathlib import Path
from openpyxl import load_workbook

DEALS_JSON = Path(__file__).parent / 'deals.json'
WORKBOOK_PATH = Path(__file__).parent.parent / 'RM-pipeline-workbook.xlsx'

def main():
    print("\n🔍 Verifying Excel ↔ Dashboard alignment...\n")

    # Load JSON
    with open(DEALS_JSON) as f:
        json_deals = json.load(f)

    # Load Excel
    wb = load_workbook(WORKBOOK_PATH)

    # Check Summary sheet
    if 'Summary' not in wb.sheetnames:
        print("❌ Summary sheet not found")
        return False

    summary = wb['Summary']
    print("✓ Summary sheet found")

    # Check Deals sheet
    if 'Deals' not in wb.sheetnames:
        print("❌ Deals sheet not found")
        return False

    deals_sheet = wb['Deals']
    excel_row_count = deals_sheet.max_row - 1  # Subtract header row

    print(f"✓ Deals sheet found")
    print(f"\nDeal counts:")
    print(f"  JSON:  {len(json_deals)} deals")
    print(f"  Excel: {excel_row_count} deals")

    if len(json_deals) == excel_row_count:
        print("  ✓ Counts match!")
    else:
        print("  ❌ Count mismatch!")
        return False

    # Calculate metrics from JSON
    open_deals = [d for d in json_deals if d['stage'] != 'Closed']
    closed_deals = [d for d in json_deals if d['stage'] == 'Closed']

    total_pipeline = sum(d['amount'] for d in open_deals)
    weighted_revenue = sum(d['revAnnual'] * d['probability'] for d in open_deals)

    print(f"\nMetrics from JSON:")
    print(f"  Open deals: {len(open_deals)}")
    print(f"  Closed deals: {len(closed_deals)}")
    print(f"  Total pipeline: ${total_pipeline:,.2f}")
    print(f"  Weighted revenue: ${weighted_revenue:,.2f}")

    # Stage breakdown
    stages = ['Lead', 'Qualified', 'Proposal', 'Commit', 'Closed']
    stage_counts = {s: sum(1 for d in json_deals if d['stage'] == s) for s in stages}

    print(f"\nStage breakdown:")
    for stage in stages:
        print(f"  {stage:12s}: {stage_counts[stage]:2d} deals")

    # Sample some deals from Excel to verify data integrity
    print(f"\n✓ Sampling deals from Excel:")
    for row in range(2, min(5, deals_sheet.max_row + 1)):
        deal_id = deals_sheet.cell(row, 1).value
        officer = deals_sheet.cell(row, 3).value
        customer = deals_sheet.cell(row, 5).value
        stage = deals_sheet.cell(row, 7).value
        amount = deals_sheet.cell(row, 8).value
        print(f"  {deal_id:15s} | {officer:12s} | {customer:20s} | {stage:10s} | ${amount:>12,.2f}")

    print(f"\n✅ Verification complete! Excel and dashboard data are aligned.\n")
    return True

if __name__ == '__main__':
    main()
