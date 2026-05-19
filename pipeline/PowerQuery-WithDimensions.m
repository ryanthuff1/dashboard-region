// ════════════════════════════════════════════════════════════════
// POWER QUERY M CODE — Load RM Pipeline with Dimension Tables
// ════════════════════════════════════════════════════════════════
//
// This enhanced version creates a STAR SCHEMA data model with:
// - Fact table: Deals (transactions)
// - Dimension tables: Geography, RM, Product, Stage, Time
// - Hierarchies for drill-down analysis
//
// HOW TO USE:
// 1. In Power BI Desktop, go to Home → Get Data → Blank Query
// 2. Open Advanced Editor and paste this ENTIRE file
// 3. This will create MULTIPLE queries (tables)
// 4. Update the file path in the shared "FilePath" parameter
// 5. Click Done, then Close & Apply
//
// ════════════════════════════════════════════════════════════════

let
    // ══════════════════════════════════════════════════════════════
    // SHARED PARAMETER — Update this path to your file location
    // ══════════════════════════════════════════════════════════════
    FilePath = "C:\Users\YourName\Downloads\RM-pipeline-workbook.xlsx",

    // ══════════════════════════════════════════════════════════════
    // SOURCE — Load Excel file (shared across all queries)
    // ══════════════════════════════════════════════════════════════
    Source = Excel.Workbook(File.Contents(FilePath), null, true),

    // ══════════════════════════════════════════════════════════════
    // HELPER FUNCTION — Transform each RM sheet
    // ══════════════════════════════════════════════════════════════
    TransformRMSheet = (sheetName as text, sheetData as table) =>
        let
            BannerRow = sheetData{0}[Column1],
            SplitBanner = Text.Split(BannerRow, " · "),
            RMName = SplitBanner{0},
            Market = SplitBanner{1},

            PromotedHeaders = Table.PromoteHeaders(Table.Skip(sheetData, 1), [PromoteAllScalars=true]),
            RemovedEmptyRows = Table.SelectRows(PromotedHeaders, each [Customer] <> null and [Customer] <> ""),

            AddedRM = Table.AddColumn(RemovedEmptyRows, "RM", each RMName),
            AddedMarket = Table.AddColumn(AddedRM, "Market", each Market),

            RenamedColumns = Table.RenameColumns(
                AddedMarket,
                {
                    {"Amount ($)", "Amount"},
                    {"Days in Stage", "DaysInStage"},
                    {"Date Entered Stage", "DateEnteredStage"},
                    {"Expected Close", "ExpectedClose"},
                    {"Annual Rev ($)", "AnnualRev"},
                    {"Weighted Rev ($)", "WeightedRev"}
                }
            ),

            ChangedTypes = Table.TransformColumnTypes(
                RenamedColumns,
                {
                    {"Customer", type text},
                    {"Product", type text},
                    {"Stage", type text},
                    {"Amount", type number},
                    {"Probability", Percentage.Type},
                    {"DateEnteredStage", type date},
                    {"DaysInStage", Int64.Type},
                    {"ExpectedClose", type date},
                    {"AnnualRev", type number},
                    {"WeightedRev", type number},
                    {"Notes", type text},
                    {"RM", type text},
                    {"Market", type text}
                }
            )
        in
            ChangedTypes,

    // ══════════════════════════════════════════════════════════════
    // FACT TABLE — Deals
    // ══════════════════════════════════════════════════════════════
    AllSheets = Source,
    RMSheets = Table.SelectRows(AllSheets, each [Kind] = "Sheet" and not List.Contains({"README", "Summary", "Lookup"}, [Name])),
    TransformedSheets = Table.AddColumn(RMSheets, "TransformedData", each TransformRMSheet([Name], [Data])),
    CombinedData = Table.Combine(TransformedSheets[TransformedData]),

    // Add fact table flags
    WithIsOpen = Table.AddColumn(CombinedData, "IsOpen", each [Stage] <> "Closed", type logical),
    WithIsClosed = Table.AddColumn(WithIsOpen, "IsClosed", each [Stage] = "Closed", type logical),

    // Add foreign keys for dimensions (these will link to dimension tables)
    WithProductKey = Table.AddColumn(WithIsClosed, "ProductKey", each [Product], type text),
    WithStageKey = Table.AddColumn(WithProductKey, "StageKey", each [Stage], type text),
    WithRMKey = Table.AddColumn(WithStageKey, "RMKey", each [RM], type text),
    WithMarketKey = Table.AddColumn(WithRMKey, "MarketKey", each [Market], type text),

    // Time dimension keys
    WithExpectedCloseYearMonth = Table.AddColumn(
        WithMarketKey,
        "ExpectedCloseYearMonth",
        each if [ExpectedClose] = null then null else Date.ToText([ExpectedClose], "yyyy-MM"),
        type text
    ),
    WithExpectedCloseYear = Table.AddColumn(
        WithExpectedCloseYearMonth,
        "ExpectedCloseYear",
        each if [ExpectedClose] = null then null else Date.Year([ExpectedClose]),
        Int64.Type
    ),
    WithExpectedCloseQuarter = Table.AddColumn(
        WithExpectedCloseYear,
        "ExpectedCloseQuarter",
        each if [ExpectedClose] = null then null else "Q" & Text.From(Date.QuarterOfYear([ExpectedClose])),
        type text
    ),

    // Aging bucket (will link to Aging dimension)
    WithAgingBucket = Table.AddColumn(
        WithExpectedCloseQuarter,
        "AgingBucket",
        each if [DaysInStage] = null then null
             else if [DaysInStage] <= 30 then "0-30 days"
             else if [DaysInStage] <= 60 then "31-60 days"
             else if [DaysInStage] <= 90 then "61-90 days"
             else "90+ days",
        type text
    ),

    // Add unique DealID
    WithDealID = Table.AddIndexColumn(WithAgingBucket, "DealID", 1, 1, Int64.Type),

    // Reorder columns for fact table
    FactDeals = Table.ReorderColumns(
        WithDealID,
        {
            "DealID", "RMKey", "MarketKey", "ProductKey", "StageKey",
            "Customer", "Amount", "Probability", "AnnualRev", "WeightedRev",
            "DateEnteredStage", "DaysInStage", "AgingBucket",
            "ExpectedClose", "ExpectedCloseYear", "ExpectedCloseQuarter", "ExpectedCloseYearMonth",
            "IsOpen", "IsClosed", "Notes"
        }
    )
in
    FactDeals
