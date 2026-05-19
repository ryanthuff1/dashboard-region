// ════════════════════════════════════════════════════════════════
// POWER QUERY M CODE — Load RM Pipeline Workbook into Power BI
// ════════════════════════════════════════════════════════════════
//
// This M script loads the RM-pipeline-workbook.xlsx file and
// transforms it into a single fact table for analysis in Power BI.
//
// HOW TO USE:
// 1. In Power BI Desktop, go to Home → Get Data → Excel Workbook
// 2. Select the RM-pipeline-workbook.xlsx file
// 3. Instead of loading directly, click "Transform Data"
// 4. In Power Query Editor, go to Home → Advanced Editor
// 5. Replace ALL the auto-generated code with this script
// 6. Update the file path in the "Source" line below to match your location
// 7. Click Done, then Close & Apply
//
// ════════════════════════════════════════════════════════════════

let
    // ──────────────────────────────────────────────────────────────
    // STEP 1: Load the Excel file
    // UPDATE THIS PATH to where you saved RM-pipeline-workbook.xlsx
    // ──────────────────────────────────────────────────────────────
    Source = Excel.Workbook(
        File.Contents("C:\Users\YourName\Downloads\RM-pipeline-workbook.xlsx"),
        null,
        true
    ),

    // ──────────────────────────────────────────────────────────────
    // STEP 2: Get list of all sheets (excluding README, Summary, Lookup)
    // Each RM has their own sheet named with their name
    // ──────────────────────────────────────────────────────────────
    AllSheets = Source,

    // Filter to only RM sheets (exclude system sheets)
    RMSheets = Table.SelectRows(
        AllSheets,
        each [Kind] = "Sheet"
        and not List.Contains({"README", "Summary", "Lookup"}, [Name])
    ),

    // ──────────────────────────────────────────────────────────────
    // STEP 3: Define function to transform each RM sheet
    // ──────────────────────────────────────────────────────────────
    TransformRMSheet = (sheetName as text, sheetData as table) =>
        let
            // Extract RM name and market from the banner row (A1)
            // Format: "M. Reyes · Houston · Pipeline"
            BannerRow = sheetData{0}[Column1],
            SplitBanner = Text.Split(BannerRow, " · "),
            RMName = SplitBanner{0},
            Market = SplitBanner{1},

            // Promote row 2 as headers (column names)
            PromotedHeaders = Table.PromoteHeaders(
                Table.Skip(sheetData, 1),
                [PromoteAllScalars=true]
            ),

            // Remove completely empty rows
            RemovedEmptyRows = Table.SelectRows(
                PromotedHeaders,
                each [Customer] <> null and [Customer] <> ""
            ),

            // Add RM Name and Market columns
            AddedRM = Table.AddColumn(RemovedEmptyRows, "RM", each RMName),
            AddedMarket = Table.AddColumn(AddedRM, "Market", each Market),

            // Rename columns to remove special characters and spaces
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

            // Set proper data types
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
            ),

            // Add calculated columns
            WithIsOpen = Table.AddColumn(
                ChangedTypes,
                "IsOpen",
                each [Stage] <> "Closed",
                type logical
            ),

            WithIsClosed = Table.AddColumn(
                WithIsOpen,
                "IsClosed",
                each [Stage] = "Closed",
                type logical
            ),

            // Add aging bucket
            WithAgingBucket = Table.AddColumn(
                WithIsClosed,
                "AgingBucket",
                each if [DaysInStage] = null then null
                     else if [DaysInStage] <= 30 then "0-30 days"
                     else if [DaysInStage] <= 60 then "31-60 days"
                     else if [DaysInStage] <= 90 then "61-90 days"
                     else "90+ days",
                type text
            ),

            // Add aging bucket sort order
            WithAgingOrder = Table.AddColumn(
                WithAgingBucket,
                "AgingOrder",
                each if [AgingBucket] = "0-30 days" then 1
                     else if [AgingBucket] = "31-60 days" then 2
                     else if [AgingBucket] = "61-90 days" then 3
                     else if [AgingBucket] = "90+ days" then 4
                     else 5,
                Int64.Type
            ),

            // Add stage order for proper sorting
            WithStageOrder = Table.AddColumn(
                WithAgingOrder,
                "StageOrder",
                each if [Stage] = "Lead" then 1
                     else if [Stage] = "Qualified" then 2
                     else if [Stage] = "Proposal" then 3
                     else if [Stage] = "Commit" then 4
                     else if [Stage] = "Closed" then 5
                     else 6,
                Int64.Type
            ),

            // Add Year/Month for time series
            WithYearMonth = Table.AddColumn(
                WithStageOrder,
                "ExpectedCloseYearMonth",
                each if [ExpectedClose] = null then null
                     else Date.ToText([ExpectedClose], "yyyy-MM"),
                type text
            )
        in
            WithYearMonth,

    // ──────────────────────────────────────────────────────────────
    // STEP 4: Apply transformation to each RM sheet and combine
    // ──────────────────────────────────────────────────────────────
    TransformedSheets = Table.AddColumn(
        RMSheets,
        "TransformedData",
        each TransformRMSheet([Name], [Data])
    ),

    // Combine all RM sheets into one table
    CombinedData = Table.Combine(TransformedSheets[TransformedData]),

    // ──────────────────────────────────────────────────────────────
    // STEP 5: Final cleanup and column ordering
    // ──────────────────────────────────────────────────────────────
    ReorderedColumns = Table.ReorderColumns(
        CombinedData,
        {
            "RM", "Market", "Customer", "Product", "Stage", "StageOrder",
            "Amount", "Probability", "AnnualRev", "WeightedRev",
            "DateEnteredStage", "DaysInStage", "AgingBucket", "AgingOrder",
            "ExpectedClose", "ExpectedCloseYearMonth",
            "IsOpen", "IsClosed", "Notes"
        }
    )
in
    ReorderedColumns
