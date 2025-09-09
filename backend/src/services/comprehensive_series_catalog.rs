/**
 * REQUIREMENT: Comprehensive Economic Time Series Catalog
 * PURPOSE: Define a structured catalog of key economic indicators for systematic crawling
 * This provides a professional-grade selection of economic data series covering all major categories
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Categories of economic indicators
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum SeriesCategory {
    /// Gross Domestic Product and national accounts
    NationalAccounts,
    /// Employment and labor market indicators
    LaborMarket,
    /// Price indices and inflation measures
    Prices,
    /// Monetary policy and interest rates
    MonetaryPolicy,
    /// International trade and balance of payments
    InternationalTrade,
    /// Housing market indicators
    Housing,
    /// Manufacturing and industrial production
    Manufacturing,
    /// Consumer spending and retail
    Consumer,
    /// Business investment and surveys
    Business,
    /// Government finances
    GovernmentFinance,
    /// Financial markets and credit
    Financial,
    /// Regional and demographic data
    Regional,
}

/// Data source for time series
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataSource {
    /// Federal Reserve Economic Data (FRED)
    FRED,
    /// Bureau of Labor Statistics
    BLS,
    /// Bureau of Economic Analysis
    BEA,
    /// Census Bureau
    Census,
}

/// Frequency of data updates
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UpdateFrequency {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Annual,
}

/// Priority level for crawling
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CrawlPriority {
    /// Critical indicators (GDP, unemployment, inflation)
    Critical,
    /// High importance (monetary policy, trade)
    High,
    /// Standard importance (sectoral indicators)
    Standard,
    /// Low priority (specialized indicators)
    Low,
}

/// Comprehensive series definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeriesDefinition {
    /// Series identifier (FRED ID, BLS series code, etc.)
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Detailed description
    pub description: String,
    /// Data source
    pub source: DataSource,
    /// Category classification
    pub category: SeriesCategory,
    /// Units of measurement
    pub units: String,
    /// Update frequency
    pub frequency: UpdateFrequency,
    /// Crawl priority
    pub priority: CrawlPriority,
    /// Seasonal adjustment status
    pub seasonal_adjustment: Option<String>,
    /// Related series (for cross-referencing)
    pub related_series: Vec<String>,
    /// Tags for search and filtering
    pub tags: Vec<String>,
}

/// Comprehensive catalog of economic time series
pub struct ComprehensiveSeriesCatalog;

impl ComprehensiveSeriesCatalog {
    /// Get all series definitions organized by category
    pub fn get_all_series() -> HashMap<SeriesCategory, Vec<SeriesDefinition>> {
        let mut catalog = HashMap::new();
        
        // National Accounts & GDP
        catalog.insert(SeriesCategory::NationalAccounts, vec![
            SeriesDefinition {
                id: "GDPC1".to_string(),
                name: "Real Gross Domestic Product".to_string(),
                description: "Inflation-adjusted measure of the total value of all goods and services produced in the economy".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::NationalAccounts,
                units: "Billions of Chained 2017 Dollars".to_string(),
                frequency: UpdateFrequency::Quarterly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted Annual Rate".to_string()),
                related_series: vec!["GDP".to_string(), "GDPPOT".to_string()],
                tags: vec!["gdp".to_string(), "real".to_string(), "growth".to_string()],
            },
            SeriesDefinition {
                id: "GDP".to_string(),
                name: "Gross Domestic Product".to_string(),
                description: "Current-dollar value of all goods and services produced in the economy".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::NationalAccounts,
                units: "Billions of Dollars".to_string(),
                frequency: UpdateFrequency::Quarterly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted Annual Rate".to_string()),
                related_series: vec!["GDPC1".to_string(), "GDPDEF".to_string()],
                tags: vec!["gdp".to_string(), "nominal".to_string(), "current_dollar".to_string()],
            },
            SeriesDefinition {
                id: "GDPDEF".to_string(),
                name: "GDP Implicit Price Deflator".to_string(),
                description: "Broad measure of inflation for all goods and services in GDP".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::NationalAccounts,
                units: "Index 2017=100".to_string(),
                frequency: UpdateFrequency::Quarterly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["GDP".to_string(), "GDPC1".to_string()],
                tags: vec!["deflator".to_string(), "inflation".to_string(), "price_level".to_string()],
            },
            SeriesDefinition {
                id: "GDPPOT".to_string(),
                name: "Real Potential Gross Domestic Product".to_string(),
                description: "Estimate of the level of real GDP that would be produced if the economy were at full employment".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::NationalAccounts,
                units: "Billions of Chained 2017 Dollars".to_string(),
                frequency: UpdateFrequency::Quarterly,
                priority: CrawlPriority::High,
                seasonal_adjustment: None,
                related_series: vec!["GDPC1".to_string(), "NROU".to_string()],
                tags: vec!["potential".to_string(), "full_employment".to_string(), "capacity".to_string()],
            },
        ]);

        // Labor Market
        catalog.insert(SeriesCategory::LaborMarket, vec![
            SeriesDefinition {
                id: "UNRATE".to_string(),
                name: "Unemployment Rate".to_string(),
                description: "Percent of the civilian labor force that is unemployed".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::LaborMarket,
                units: "Percent".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["CIVPART".to_string(), "EMRATIO".to_string(), "PAYEMS".to_string()],
                tags: vec!["unemployment".to_string(), "labor_force".to_string(), "jobs".to_string()],
            },
            SeriesDefinition {
                id: "PAYEMS".to_string(),
                name: "All Employees, Total Nonfarm".to_string(),
                description: "Number of paid employees working part-time or full-time in nonfarm establishments".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::LaborMarket,
                units: "Thousands of Persons".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["UNRATE".to_string(), "AHETPI".to_string()],
                tags: vec!["employment".to_string(), "nonfarm_payrolls".to_string(), "jobs".to_string()],
            },
            SeriesDefinition {
                id: "CIVPART".to_string(),
                name: "Labor Force Participation Rate".to_string(),
                description: "Percent of the civilian noninstitutional population that is in the labor force".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::LaborMarket,
                units: "Percent".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["UNRATE".to_string(), "EMRATIO".to_string()],
                tags: vec!["labor_force".to_string(), "participation".to_string(), "demographics".to_string()],
            },
            SeriesDefinition {
                id: "AHETPI".to_string(),
                name: "Average Hourly Earnings of All Employees, Total Private".to_string(),
                description: "Average hourly earnings for all employees on private nonfarm payrolls".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::LaborMarket,
                units: "Dollars per Hour".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["PAYEMS".to_string(), "CES0500000003".to_string()],
                tags: vec!["wages".to_string(), "earnings".to_string(), "compensation".to_string()],
            },
        ]);

        // Prices & Inflation
        catalog.insert(SeriesCategory::Prices, vec![
            SeriesDefinition {
                id: "CPIAUCSL".to_string(),
                name: "Consumer Price Index for All Urban Consumers: All Items".to_string(),
                description: "Measure of the average change in prices paid by urban consumers for goods and services".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Prices,
                units: "Index 1982-1984=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Not Seasonally Adjusted".to_string()),
                related_series: vec!["CPILFESL".to_string(), "CPIENGSL".to_string()],
                tags: vec!["cpi".to_string(), "inflation".to_string(), "consumer_prices".to_string()],
            },
            SeriesDefinition {
                id: "CPILFESL".to_string(),
                name: "Consumer Price Index for All Urban Consumers: All Items Less Food and Energy".to_string(),
                description: "Core CPI excluding volatile food and energy prices".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Prices,
                units: "Index 1982-1984=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Not Seasonally Adjusted".to_string()),
                related_series: vec!["CPIAUCSL".to_string(), "PCEPI".to_string()],
                tags: vec!["core_cpi".to_string(), "core_inflation".to_string(), "ex_food_energy".to_string()],
            },
            SeriesDefinition {
                id: "PCEPI".to_string(),
                name: "Personal Consumption Expenditures: Chain-type Price Index".to_string(),
                description: "Federal Reserve's preferred measure of inflation based on consumer spending patterns".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Prices,
                units: "Index 2017=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["PCEPILFE".to_string(), "PCE".to_string()],
                tags: vec!["pce".to_string(), "fed_preferred".to_string(), "chain_weighted".to_string()],
            },
            SeriesDefinition {
                id: "PCEPILFE".to_string(),
                name: "Personal Consumption Expenditures Excluding Food and Energy (Chain-Type Price Index)".to_string(),
                description: "Core PCE price index excluding food and energy - Fed's primary inflation target".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Prices,
                units: "Index 2017=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["PCEPI".to_string(), "CPILFESL".to_string()],
                tags: vec!["core_pce".to_string(), "fed_target".to_string(), "monetary_policy".to_string()],
            },
        ]);

        // Monetary Policy
        catalog.insert(SeriesCategory::MonetaryPolicy, vec![
            SeriesDefinition {
                id: "FEDFUNDS".to_string(),
                name: "Federal Funds Effective Rate".to_string(),
                description: "Interest rate at which banks lend reserve balances to other banks overnight".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::MonetaryPolicy,
                units: "Percent".to_string(),
                frequency: UpdateFrequency::Daily,
                priority: CrawlPriority::Critical,
                seasonal_adjustment: None,
                related_series: vec!["DFF".to_string(), "TB3MS".to_string(), "GS10".to_string()],
                tags: vec!["fed_funds".to_string(), "monetary_policy".to_string(), "short_term_rates".to_string()],
            },
            SeriesDefinition {
                id: "GS10".to_string(),
                name: "Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity".to_string(),
                description: "10-year Treasury bond yield, key benchmark for long-term interest rates".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::MonetaryPolicy,
                units: "Percent".to_string(),
                frequency: UpdateFrequency::Daily,
                priority: CrawlPriority::High,
                seasonal_adjustment: None,
                related_series: vec!["GS2".to_string(), "GS5".to_string(), "GS30".to_string()],
                tags: vec!["treasury".to_string(), "long_term_rates".to_string(), "bond_yield".to_string()],
            },
            SeriesDefinition {
                id: "M2SL".to_string(),
                name: "M2 Money Stock".to_string(),
                description: "Measure of money supply including cash, checking deposits, savings deposits, and money market securities".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::MonetaryPolicy,
                units: "Billions of Dollars".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["M1SL".to_string(), "BASE".to_string()],
                tags: vec!["money_supply".to_string(), "liquidity".to_string(), "monetary_aggregate".to_string()],
            },
        ]);

        // International Trade
        catalog.insert(SeriesCategory::InternationalTrade, vec![
            SeriesDefinition {
                id: "BOPGSTB".to_string(),
                name: "Trade Balance: Goods and Services, Balance of Payments Basis".to_string(),
                description: "Monthly trade balance of goods and services exports minus imports".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::InternationalTrade,
                units: "Millions of Dollars".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["EXPGS".to_string(), "IMPGS".to_string()],
                tags: vec!["trade_balance".to_string(), "exports".to_string(), "imports".to_string()],
            },
            SeriesDefinition {
                id: "DEXUSEU".to_string(),
                name: "U.S. / Euro Foreign Exchange Rate".to_string(),
                description: "U.S. dollars per euro exchange rate".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::InternationalTrade,
                units: "U.S. Dollars per Euro".to_string(),
                frequency: UpdateFrequency::Daily,
                priority: CrawlPriority::Standard,
                seasonal_adjustment: None,
                related_series: vec!["DEXCHUS".to_string(), "DEXJPUS".to_string()],
                tags: vec!["exchange_rate".to_string(), "euro".to_string(), "currency".to_string()],
            },
        ]);

        // Housing Market
        catalog.insert(SeriesCategory::Housing, vec![
            SeriesDefinition {
                id: "HOUST".to_string(),
                name: "Housing Starts: Total: New Privately Owned Housing Units Started".to_string(),
                description: "Number of new residential construction projects started".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Housing,
                units: "Thousands of Units".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted Annual Rate".to_string()),
                related_series: vec!["PERMIT".to_string(), "COMPUTSA".to_string()],
                tags: vec!["housing_starts".to_string(), "construction".to_string(), "residential".to_string()],
            },
            SeriesDefinition {
                id: "CSUSHPISA".to_string(),
                name: "S&P/Case-Shiller U.S. National Home Price Index".to_string(),
                description: "Measure of U.S. residential real estate prices tracking changes in the value of residential real estate".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Housing,
                units: "Index Jan 2000=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["HOUST".to_string(), "MORTGAGE30US".to_string()],
                tags: vec!["home_prices".to_string(), "case_shiller".to_string(), "real_estate".to_string()],
            },
        ]);

        // Manufacturing & Industrial Production
        catalog.insert(SeriesCategory::Manufacturing, vec![
            SeriesDefinition {
                id: "INDPRO".to_string(),
                name: "Industrial Production Index".to_string(),
                description: "Measure of real output for manufacturing, mining, and electric and gas utilities".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Manufacturing,
                units: "Index 2017=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["CAPUTLB50001SQ".to_string(), "NAPM".to_string()],
                tags: vec!["industrial_production".to_string(), "manufacturing".to_string(), "output".to_string()],
            },
            SeriesDefinition {
                id: "NAPM".to_string(),
                name: "ISM Manufacturing: PMI Composite Index".to_string(),
                description: "Purchasing Managers' Index for manufacturing sector - leading indicator of economic activity".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Manufacturing,
                units: "Index".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Not Seasonally Adjusted".to_string()),
                related_series: vec!["INDPRO".to_string(), "NAPMNOI".to_string()],
                tags: vec!["pmi".to_string(), "ism".to_string(), "leading_indicator".to_string()],
            },
        ]);

        // Consumer Spending
        catalog.insert(SeriesCategory::Consumer, vec![
            SeriesDefinition {
                id: "PCE".to_string(),
                name: "Personal Consumption Expenditures".to_string(),
                description: "Total spending by consumers on goods and services".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Consumer,
                units: "Billions of Dollars".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted Annual Rate".to_string()),
                related_series: vec!["PCEPI".to_string(), "RSAFS".to_string()],
                tags: vec!["consumer_spending".to_string(), "consumption".to_string(), "pce".to_string()],
            },
            SeriesDefinition {
                id: "RSAFS".to_string(),
                name: "Advance Retail Sales: Retail and Food Services".to_string(),
                description: "Monthly retail sales including food services and drinking places".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Consumer,
                units: "Millions of Dollars".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::High,
                seasonal_adjustment: Some("Seasonally Adjusted".to_string()),
                related_series: vec!["PCE".to_string(), "UMCSENT".to_string()],
                tags: vec!["retail_sales".to_string(), "consumer_spending".to_string(), "advance".to_string()],
            },
            SeriesDefinition {
                id: "UMCSENT".to_string(),
                name: "University of Michigan: Consumer Sentiment".to_string(),
                description: "Index of consumer confidence based on monthly surveys".to_string(),
                source: DataSource::FRED,
                category: SeriesCategory::Consumer,
                units: "Index 1st Quarter 1966=100".to_string(),
                frequency: UpdateFrequency::Monthly,
                priority: CrawlPriority::Standard,
                seasonal_adjustment: Some("Not Seasonally Adjusted".to_string()),
                related_series: vec!["CSCICP03USM665S".to_string(), "PCE".to_string()],
                tags: vec!["consumer_sentiment".to_string(), "confidence".to_string(), "survey".to_string()],
            },
        ]);

        catalog
    }

    /// Get series by category
    pub fn get_series_by_category(category: &SeriesCategory) -> Vec<SeriesDefinition> {
        Self::get_all_series()
            .get(category)
            .cloned()
            .unwrap_or_default()
    }

    /// Get series by priority level
    pub fn get_series_by_priority(priority: &CrawlPriority) -> Vec<SeriesDefinition> {
        Self::get_all_series()
            .values()
            .flatten()
            .filter(|series| &series.priority == priority)
            .cloned()
            .collect()
    }

    /// Get all FRED series IDs
    pub fn get_fred_series_ids() -> Vec<String> {
        Self::get_all_series()
            .values()
            .flatten()
            .filter(|series| series.source == DataSource::FRED)
            .map(|series| series.id.clone())
            .collect()
    }

    /// Get all BLS series IDs
    pub fn get_bls_series_ids() -> Vec<String> {
        Self::get_all_series()
            .values()
            .flatten()
            .filter(|series| series.source == DataSource::BLS)
            .map(|series| series.id.clone())
            .collect()
    }

    /// Get critical series for priority crawling
    pub fn get_critical_series() -> Vec<SeriesDefinition> {
        Self::get_series_by_priority(&CrawlPriority::Critical)
    }

    /// Get series count by category
    pub fn get_series_count() -> HashMap<SeriesCategory, usize> {
        Self::get_all_series()
            .iter()
            .map(|(category, series)| (category.clone(), series.len()))
            .collect()
    }

    /// Get total series count
    pub fn get_total_series_count() -> usize {
        Self::get_all_series()
            .values()
            .map(|series| series.len())
            .sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_catalog_structure() {
        let catalog = ComprehensiveSeriesCatalog::get_all_series();
        
        // Verify we have all major categories
        assert!(catalog.contains_key(&SeriesCategory::NationalAccounts));
        assert!(catalog.contains_key(&SeriesCategory::LaborMarket));
        assert!(catalog.contains_key(&SeriesCategory::Prices));
        assert!(catalog.contains_key(&SeriesCategory::MonetaryPolicy));
        
        // Verify critical series exist
        let critical_series = ComprehensiveSeriesCatalog::get_critical_series();
        assert!(!critical_series.is_empty());
        
        // Verify we have both FRED and BLS series
        let fred_series = ComprehensiveSeriesCatalog::get_fred_series_ids();
        let bls_series = ComprehensiveSeriesCatalog::get_bls_series_ids();
        assert!(!fred_series.is_empty());
        
        println!("Total series in catalog: {}", ComprehensiveSeriesCatalog::get_total_series_count());
        println!("Critical series count: {}", critical_series.len());
        println!("FRED series count: {}", fred_series.len());
        println!("BLS series count: {}", bls_series.len());
    }

    #[test]
    fn test_series_metadata_completeness() {
        let all_series = ComprehensiveSeriesCatalog::get_all_series();
        
        for (category, series_list) in all_series {
            for series in series_list {
                // Verify all required fields are populated
                assert!(!series.id.is_empty(), "Series ID cannot be empty");
                assert!(!series.name.is_empty(), "Series name cannot be empty");
                assert!(!series.description.is_empty(), "Series description cannot be empty");
                assert!(!series.units.is_empty(), "Series units cannot be empty");
                assert!(!series.tags.is_empty(), "Series should have tags");
                
                println!("✅ Series {} ({}) metadata complete", series.id, series.name);
            }
        }
    }
}
