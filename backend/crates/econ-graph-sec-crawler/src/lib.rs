//! SEC EDGAR XBRL Crawler
//!
//! This crate provides functionality for crawling SEC EDGAR filings and downloading
//! XBRL financial data. It includes comprehensive error handling, rate limiting,
//! retry logic, and progress tracking for reliable data acquisition.

pub mod crawler;
pub mod models;
pub mod rate_limiter;
pub mod storage;
pub mod utils;
pub mod xbrl_parser;
pub mod xbrl_parser_tests;
pub mod financial_ratio_calculator;

pub use crawler::SecEdgarCrawler;
pub use models::*;
pub use rate_limiter::RateLimiter;
pub use storage::XbrlStorage;
pub use xbrl_parser::{XbrlParser, XbrlParserConfig, ValidationReport, TaxonomyConcept, FinancialRatio, XbrlParseResult, DocumentType};
pub use financial_ratio_calculator::{FinancialRatioCalculator, RatioCalculationConfig, CalculatedRatio};

/// Re-export commonly used types
pub use anyhow::Result;
pub use uuid::Uuid;
pub use chrono::{DateTime, NaiveDate, Utc};
pub use bigdecimal::BigDecimal;
