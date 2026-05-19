// ════════════════════════════════════════════════════════════════
// DIMENSION TABLES — Create these as SEPARATE queries in Power BI
// ════════════════════════════════════════════════════════════════
//
// For EACH dimension below, create a NEW BLANK QUERY and paste the code.
// These will auto-reference the "Deals" fact table you created.
//
// ════════════════════════════════════════════════════════════════


// ────────────────────────────────────────────────────────────────
// DIM GEOGRAPHY — Region → Market hierarchy
// ────────────────────────────────────────────────────────────────
// Query Name: "DimGeography"

let
    Source = Deals,

    // Get distinct markets
    DistinctMarkets = Table.Distinct(Table.SelectColumns(Source, {"MarketKey"})),

    // Add Region (all markets belong to "South Central Region")
    AddRegion = Table.AddColumn(DistinctMarkets, "Region", each "South Central Region", type text),

    // Rename for clarity
    RenameMarket = Table.RenameColumns(AddRegion, {{"MarketKey", "Market"}}),

    // Add sort order
    AddMarketOrder = Table.AddColumn(
        RenameMarket,
        "MarketOrder",
        each if [Market] = "Houston" then 1 else if [Market] = "Dallas" then 2 else 3,
        Int64.Type
    ),

    // Add region code
    AddRegionCode = Table.AddColumn(AddMarketOrder, "RegionCode", each "SCR", type text),

    // Add market code
    AddMarketCode = Table.AddColumn(
        AddRegionCode,
        "MarketCode",
        each if [Market] = "Houston" then "HOU" else if [Market] = "Dallas" then "DAL" else "OTH",
        type text
    ),

    // Final column order
    ReorderCols = Table.ReorderColumns(
        AddMarketCode,
        {"Region", "RegionCode", "Market", "MarketCode", "MarketOrder"}
    )
in
    ReorderCols


// ────────────────────────────────────────────────────────────────
// DIM RM — Region → Market → RM hierarchy with attributes
// ────────────────────────────────────────────────────────────────
// Query Name: "DimRM"

let
    Source = Deals,

    // Get distinct RMs with their market
    DistinctRMs = Table.Distinct(Table.SelectColumns(Source, {"RMKey", "MarketKey"})),

    // Rename for clarity
    RenameColumns = Table.RenameColumns(DistinctRMs, {{"RMKey", "RM"}, {"MarketKey", "Market"}}),

    // Add Region
    AddRegion = Table.AddColumn(RenameColumns, "Region", each "South Central Region", type text),

    // Add RM attributes from the original data.js file
    // (In real scenario, this would come from HR/CRM system)
    AddAttributes = Table.AddColumn(
        AddRegion,
        "Attributes",
        each
            if [RM] = "M. Reyes" then [Tenure = 12, Title = "VP", Performance = "On Track"]
            else if [RM] = "D. Patel" then [Tenure = 7, Title = "SVP", Performance = "Ahead"]
            else if [RM] = "A. Tran" then [Tenure = 9, Title = "VP", Performance = "On Track"]
            else if [RM] = "K. Williams" then [Tenure = 4, Title = "AVP", Performance = "Below Plan"]
            else if [RM] = "R. Chen" then [Tenure = 15, Title = "SVP", Performance = "On Track"]
            else if [RM] = "S. Garcia" then [Tenure = 6, Title = "VP", Performance = "Below Plan"]
            else if [RM] = "B. Foster" then [Tenure = 3, Title = "AVP", Performance = "On Track"]
            else [Tenure = null, Title = null, Performance = null]
    ),

    // Expand attributes
    ExpandedAttrs = Table.ExpandRecordColumn(
        AddAttributes,
        "Attributes",
        {"Tenure", "Title", "Performance"}
    ),

    // Add tenure bands
    AddTenureBand = Table.AddColumn(
        ExpandedAttrs,
        "TenureBand",
        each if [Tenure] = null then null
             else if [Tenure] < 5 then "0-5 years"
             else if [Tenure] < 10 then "5-10 years"
             else "10+ years",
        type text
    ),

    // Add RM ID (first initial + last name)
    AddRMID = Table.AddColumn(
        AddTenureBand,
        "RMID",
        each
            if [RM] = "M. Reyes" then "h-reyes"
            else if [RM] = "D. Patel" then "h-patel"
            else if [RM] = "A. Tran" then "h-tran"
            else if [RM] = "K. Williams" then "h-williams"
            else if [RM] = "R. Chen" then "d-chen"
            else if [RM] = "S. Garcia" then "d-garcia"
            else if [RM] = "B. Foster" then "d-foster"
            else Text.Lower(Text.Replace([RM], ".", "")),
        type text
    ),

    // Final column order
    ReorderCols = Table.ReorderColumns(
        AddRMID,
        {"Region", "Market", "RM", "RMID", "Title", "Tenure", "TenureBand", "Performance"}
    )
in
    ReorderCols


// ────────────────────────────────────────────────────────────────
// DIM PRODUCT — Product hierarchy with attributes
// ────────────────────────────────────────────────────────────────
// Query Name: "DimProduct"

let
    // Create product dimension manually (since it's a fixed list)
    Source = #table(
        {"ProductKey", "Product", "ProductCategory", "RevenueType", "SpreadRate", "ProductOrder"},
        {
            {"Comm Loan", "Comm Loan", "Lending", "Interest Income", 0.034, 1},
            {"Deposits", "Deposits", "Funding", "Interest Income", 0.005, 2},
            {"Treasury Mgmt", "Treasury Mgmt", "Fees", "Non-Interest Income", 1.0, 3},
            {"Other Fees", "Other Fees", "Fees", "Non-Interest Income", 1.0, 4}
        }
    ),

    // Set data types
    ChangedTypes = Table.TransformColumnTypes(
        Source,
        {
            {"ProductKey", type text},
            {"Product", type text},
            {"ProductCategory", type text},
            {"RevenueType", type text},
            {"SpreadRate", type number},
            {"ProductOrder", Int64.Type}
        }
    ),

    // Add product codes
    AddProductCode = Table.AddColumn(
        ChangedTypes,
        "ProductCode",
        each
            if [ProductKey] = "Comm Loan" then "CL"
            else if [ProductKey] = "Deposits" then "DEP"
            else if [ProductKey] = "Treasury Mgmt" then "TM"
            else "OTH",
        type text
    )
in
    AddProductCode


// ────────────────────────────────────────────────────────────────
// DIM STAGE — Sales stage funnel with probabilities
// ────────────────────────────────────────────────────────────────
// Query Name: "DimStage"

let
    Source = #table(
        {"StageKey", "Stage", "StageOrder", "DefaultProbability", "FunnelPhase", "IsOpen"},
        {
            {"Lead", "Lead", 1, 0.10, "Early", true},
            {"Qualified", "Qualified", 2, 0.25, "Early", true},
            {"Proposal", "Proposal", 3, 0.50, "Mid", true},
            {"Commit", "Commit", 4, 0.80, "Late", true},
            {"Closed", "Closed", 5, 1.00, "Won", false}
        }
    ),

    ChangedTypes = Table.TransformColumnTypes(
        Source,
        {
            {"StageKey", type text},
            {"Stage", type text},
            {"StageOrder", Int64.Type},
            {"DefaultProbability", Percentage.Type},
            {"FunnelPhase", type text},
            {"IsOpen", type logical}
        }
    ),

    // Add phase order
    AddPhaseOrder = Table.AddColumn(
        ChangedTypes,
        "PhaseOrder",
        each if [FunnelPhase] = "Early" then 1
             else if [FunnelPhase] = "Mid" then 2
             else if [FunnelPhase] = "Late" then 3
             else 4,
        Int64.Type
    )
in
    AddPhaseOrder


// ────────────────────────────────────────────────────────────────
// DIM AGING — Days in stage buckets
// ────────────────────────────────────────────────────────────────
// Query Name: "DimAging"

let
    Source = #table(
        {"AgingBucket", "MinDays", "MaxDays", "AgingOrder", "RiskLevel", "ColorHex"},
        {
            {"0-30 days", 0, 30, 1, "Healthy", "#2B8A3E"},
            {"31-60 days", 31, 60, 2, "Normal", "#ADB5BD"},
            {"61-90 days", 61, 90, 3, "Warning", "#E67700"},
            {"90+ days", 91, 9999, 4, "At Risk", "#C92A2A"}
        }
    ),

    ChangedTypes = Table.TransformColumnTypes(
        Source,
        {
            {"AgingBucket", type text},
            {"MinDays", Int64.Type},
            {"MaxDays", Int64.Type},
            {"AgingOrder", Int64.Type},
            {"RiskLevel", type text},
            {"ColorHex", type text}
        }
    )
in
    ChangedTypes


// ────────────────────────────────────────────────────────────────
// DIM CALENDAR — Date dimension for time intelligence
// ────────────────────────────────────────────────────────────────
// Query Name: "DimCalendar"

let
    // Generate date range covering all expected close dates
    StartDate = #date(2026, 1, 1),
    EndDate = #date(2027, 12, 31),
    DayCount = Duration.Days(EndDate - StartDate) + 1,

    // Create list of dates
    DateList = List.Dates(StartDate, DayCount, #duration(1, 0, 0, 0)),

    // Convert to table
    DateTable = Table.FromList(DateList, Splitter.SplitByNothing(), {"Date"}),

    // Add date attributes
    WithYear = Table.AddColumn(DateTable, "Year", each Date.Year([Date]), Int64.Type),
    WithQuarter = Table.AddColumn(WithYear, "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    WithQuarterNum = Table.AddColumn(WithQuarter, "QuarterNum", each Date.QuarterOfYear([Date]), Int64.Type),
    WithMonth = Table.AddColumn(WithQuarterNum, "Month", each Date.Month([Date]), Int64.Type),
    WithMonthName = Table.AddColumn(WithMonth, "MonthName", each Date.MonthName([Date]), type text),
    WithMonthShort = Table.AddColumn(WithMonthName, "MonthShort", each Date.ToText([Date], "MMM"), type text),
    WithYearMonth = Table.AddColumn(WithMonthShort, "YearMonth", each Date.ToText([Date], "yyyy-MM"), type text),
    WithYearQuarter = Table.AddColumn(WithYearMonth, "YearQuarter", each Text.From([Year]) & " " & [Quarter], type text),
    WithDayOfWeek = Table.AddColumn(WithYearQuarter, "DayOfWeek", each Date.DayOfWeek([Date], Day.Monday) + 1, Int64.Type),
    WithDayName = Table.AddColumn(WithDayOfWeek, "DayName", each Date.DayOfWeekName([Date]), type text),
    WithDayShort = Table.AddColumn(WithDayName, "DayShort", each Date.ToText([Date], "ddd"), type text),
    WithIsWeekend = Table.AddColumn(WithDayShort, "IsWeekend", each [DayOfWeek] >= 6, type logical),

    // Add fiscal attributes (assuming fiscal year = calendar year; adjust if needed)
    WithFiscalYear = Table.AddColumn(WithIsWeekend, "FiscalYear", each [Year], Int64.Type),
    WithFiscalQuarter = Table.AddColumn(WithFiscalYear, "FiscalQuarter", each [Quarter], type text),

    // Change Date column type
    ChangedTypes = Table.TransformColumnTypes(WithFiscalQuarter, {{"Date", type date}})
in
    ChangedTypes
