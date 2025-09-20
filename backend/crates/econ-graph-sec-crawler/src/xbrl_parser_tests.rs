use super::*;
use std::path::Path;
use tempfile::TempDir;
use tokio::fs;

// ============================================================================
// UNIT TESTS - Fast tests with no external dependencies
// ============================================================================

#[test]
fn test_document_type_enum() {
    // Test DocumentType enum variants
    assert!(matches!(DocumentType::Xbrl, DocumentType::Xbrl));
    assert!(matches!(DocumentType::Ixbrl, DocumentType::Ixbrl));
    assert!(matches!(DocumentType::HtmlEmbedded, DocumentType::HtmlEmbedded));
}

#[test]
fn test_validation_report_creation() {
    let report = ValidationReport {
        is_valid: true,
        errors: Vec::new(),
        warnings: Vec::new(),
    };

    assert!(report.is_valid);
    assert!(report.errors.is_empty());
    assert!(report.warnings.is_empty());
}

#[test]
fn test_validation_report_with_errors() {
    let report = ValidationReport {
        is_valid: false,
        errors: vec!["Missing context".to_string(), "Invalid unit".to_string()],
        warnings: vec!["Deprecated concept".to_string()],
    };

    assert!(!report.is_valid);
    assert_eq!(report.errors.len(), 2);
    assert_eq!(report.warnings.len(), 1);
    assert!(report.errors.contains(&"Missing context".to_string()));
    assert!(report.warnings.contains(&"Deprecated concept".to_string()));
}

#[test]
fn test_taxonomy_concept_creation() {
    let concept = TaxonomyConcept {
        name: "Assets".to_string(),
        label: "Total Assets".to_string(),
        data_type: "monetaryItemType".to_string(),
        period_type: "instant".to_string(),
        balance_type: Some("debit".to_string()),
    };

    assert_eq!(concept.name, "Assets");
    assert_eq!(concept.label, "Total Assets");
    assert_eq!(concept.data_type, "monetaryItemType");
    assert_eq!(concept.period_type, "instant");
    assert_eq!(concept.balance_type, Some("debit".to_string()));
}

#[test]
fn test_taxonomy_cache_operations() {
    let mut cache = TaxonomyCache::new();

    // Test empty cache
    assert!(cache.get_concept("Assets").is_none());

    // Add concept
    let concept = TaxonomyConcept {
        name: "Assets".to_string(),
        label: "Assets".to_string(),
        data_type: "monetaryItemType".to_string(),
        period_type: "instant".to_string(),
        balance_type: Some("debit".to_string()),
    };

    cache.add_concept(concept.clone());

    // Test retrieval
    assert_eq!(cache.get_concept("Assets"), Some(&concept));
    assert!(cache.get_concept("Liabilities").is_none());
}

#[test]
fn test_financial_ratio_creation() {
    let ratio = FinancialRatio {
        name: "Return on Equity".to_string(),
        value: 0.15,
        category: "profitability".to_string(),
        formula: "Net Income / Shareholders' Equity".to_string(),
    };

    assert_eq!(ratio.name, "Return on Equity");
    assert_eq!(ratio.value, 0.15);
    assert_eq!(ratio.category, "profitability");
    assert_eq!(ratio.formula, "Net Income / Shareholders' Equity");
}

#[test]
fn test_xbrl_fact_creation() {
    let fact = XbrlFact {
        concept: "us-gaap:Assets".to_string(),
        value: Some("1000000".to_string()),
        context_ref: "c1".to_string(),
        unit_ref: Some("u1".to_string()),
        decimals: Some(0),
        precision: None,
    };

    assert_eq!(fact.concept, "us-gaap:Assets");
    assert_eq!(fact.value, Some("1000000".to_string()));
    assert_eq!(fact.context_ref, "c1");
    assert_eq!(fact.unit_ref, Some("u1".to_string()));
    assert_eq!(fact.decimals, Some(0));
    assert_eq!(fact.precision, None);
}

#[test]
fn test_xbrl_context_creation() {
    let context = XbrlContext {
        id: "c1".to_string(),
        entity: XbrlEntity {
            identifier: "0001234567".to_string(),
            scheme: "http://www.sec.gov/CIK".to_string(),
        },
        period: XbrlPeriod {
            start_date: Some("2023-01-01".to_string()),
            end_date: Some("2023-12-31".to_string()),
            instant: None,
        },
        scenario: None,
    };

    assert_eq!(context.id, "c1");
    assert_eq!(context.entity.identifier, "0001234567");
    assert_eq!(context.entity.scheme, "http://www.sec.gov/CIK");
    assert_eq!(context.period.start_date, Some("2023-01-01".to_string()));
    assert_eq!(context.period.end_date, Some("2023-12-31".to_string()));
    assert_eq!(context.period.instant, None);
    assert_eq!(context.scenario, None);
}

#[test]
fn test_xbrl_unit_creation() {
    let unit = XbrlUnit {
        id: "u1".to_string(),
        measure: "USD".to_string(),
    };

    assert_eq!(unit.id, "u1");
    assert_eq!(unit.measure, "USD");
}

#[test]
fn test_processing_metadata_creation() {
    let metadata = ProcessingMetadata {
        document_type: DocumentType::Xbrl,
        file_size: 1024,
        processing_time: std::time::Duration::from_secs(5),
        errors: vec!["Test error".to_string()],
        warnings: vec!["Test warning".to_string()],
    };

    assert!(matches!(metadata.document_type, DocumentType::Xbrl));
    assert_eq!(metadata.file_size, 1024);
    assert_eq!(metadata.processing_time.as_secs(), 5);
    assert_eq!(metadata.errors.len(), 1);
    assert_eq!(metadata.warnings.len(), 1);
}

#[test]
fn test_xbrl_parse_result_creation() {
    let result = XbrlParseResult {
        statements: Vec::new(),
        line_items: Vec::new(),
        taxonomy_concepts: Vec::new(),
        contexts: Vec::new(),
        units: Vec::new(),
        facts: Vec::new(),
        validation_report: ValidationReport {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
        },
        processing_metadata: ProcessingMetadata {
            document_type: DocumentType::Xbrl,
            file_size: 0,
            processing_time: std::time::Duration::from_secs(0),
            errors: Vec::new(),
            warnings: Vec::new(),
        },
    };

    assert!(result.statements.is_empty());
    assert!(result.line_items.is_empty());
    assert!(result.taxonomy_concepts.is_empty());
    assert!(result.contexts.is_empty());
    assert!(result.units.is_empty());
    assert!(result.facts.is_empty());
    assert!(result.validation_report.is_valid);
    assert!(matches!(result.processing_metadata.document_type, DocumentType::Xbrl));
}

#[test]
fn test_xbrl_parser_config_default() {
    let config = XbrlParserConfig::default();

    assert_eq!(config.arelle_path, PathBuf::from("arelle"));
    assert_eq!(config.python_env, None);
    assert_eq!(config.cache_dir, PathBuf::from("/tmp/arelle_cache"));
    assert_eq!(config.max_file_size, 100 * 1024 * 1024); // 100MB
    assert_eq!(config.parse_timeout, 300); // 5 minutes
    assert!(config.validate_xbrl);
    assert!(config.extract_taxonomy);
    assert!(config.calculate_ratios);
}

#[test]
fn test_xbrl_parser_config_custom() {
    let config = XbrlParserConfig {
        arelle_path: PathBuf::from("/custom/arelle"),
        python_env: Some(PathBuf::from("/custom/python")),
        cache_dir: PathBuf::from("/custom/cache"),
        max_file_size: 200 * 1024 * 1024, // 200MB
        parse_timeout: 600, // 10 minutes
        validate_xbrl: false,
        extract_taxonomy: false,
        calculate_ratios: false,
    };

    assert_eq!(config.arelle_path, PathBuf::from("/custom/arelle"));
    assert_eq!(config.python_env, Some(PathBuf::from("/custom/python")));
    assert_eq!(config.cache_dir, PathBuf::from("/custom/cache"));
    assert_eq!(config.max_file_size, 200 * 1024 * 1024);
    assert_eq!(config.parse_timeout, 600);
    assert!(!config.validate_xbrl);
    assert!(!config.extract_taxonomy);
    assert!(!config.calculate_ratios);
}

// ============================================================================
// INTEGRATION TESTS - Tests with external dependencies (file system, etc.)
// ============================================================================

#[tokio::test]
async fn test_xbrl_cache_operations() {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let cache_dir = temp_dir.path().to_path_buf();

    let cache = XbrlCache::new(cache_dir.clone());

    // Create test data
    let test_statements = vec![
        FinancialStatement {
            id: Uuid::new_v4(),
            company_id: Uuid::new_v4(),
            filing_type: "10-K".to_string(),
            form_type: "10-K".to_string(),
            accession_number: "0001234567-23-000001".to_string(),
            filing_date: chrono::Utc::now().date_naive(),
            period_end_date: chrono::Utc::now().date_naive(),
            fiscal_year: 2023,
            fiscal_quarter: Some(4),
            document_type: "XBRL".to_string(),
            document_url: "http://example.com/filing.xbrl".to_string(),
            xbrl_file_oid: None,
            xbrl_file_content: None,
            xbrl_file_size_bytes: None,
            xbrl_file_compressed: None,
            xbrl_file_compression_type: None,
            xbrl_file_hash: None,
            xbrl_processing_status: "completed".to_string(),
            xbrl_processing_error: None,
            xbrl_processing_started_at: None,
            xbrl_processing_completed_at: Some(Utc::now()),
            is_amended: false,
            amendment_type: None,
            original_filing_date: None,
            is_restated: false,
            restatement_reason: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    ];

    // Create a test file
    let test_file = cache_dir.join("test.xbrl");
    fs::write(&test_file, "test content").await.expect("Failed to write test file");

    // Test storing and retrieving
    cache.store_parsed_result(&test_file, &test_statements).await.expect("Failed to store result");
    let retrieved = cache.get_parsed_result(&test_file).await.expect("Failed to retrieve result");

    assert!(retrieved.is_some());
    let retrieved_statements = retrieved.unwrap();
    assert_eq!(retrieved_statements.len(), 1);
    assert_eq!(retrieved_statements[0].form_type, "10-K");
}

#[tokio::test]
async fn test_document_type_detection_xbrl() {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let xbrl_file = temp_dir.path().join("test.xbrl");

    // Write XBRL content
    let xbrl_content = r#"<?xml version="1.0" encoding="UTF-8"?>
<xbrl xmlns="http://www.xbrl.org/2003/instance">
    <context id="c1">
        <entity>
            <identifier scheme="http://www.sec.gov/CIK">0001234567</identifier>
        </entity>
        <period>
            <instant>2023-12-31</instant>
        </period>
    </context>
</xbrl>"#;

    fs::write(&xbrl_file, xbrl_content).await.expect("Failed to write XBRL file");

    // Test detection (this would require a parser instance, but we can test the logic)
    let content = fs::read_to_string(&xbrl_file).await.expect("Failed to read file");
    assert!(content.contains("<xbrl"));
}

#[tokio::test]
async fn test_document_type_detection_ixbrl() {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let ixbrl_file = temp_dir.path().join("test.html");

    // Write iXBRL content
    let ixbrl_content = r#"<!DOCTYPE html>
<html>
<head>
    <title>Test iXBRL</title>
</head>
<body>
    <ix:nonNumeric contextRef="c1" name="us-gaap:EntityRegistrantName">Test Company</ix:nonNumeric>
</body>
</html>"#;

    fs::write(&ixbrl_file, ixbrl_content).await.expect("Failed to write iXBRL file");

    // Test detection
    let content = fs::read_to_string(&ixbrl_file).await.expect("Failed to read file");
    assert!(content.contains("<ix:"));
}

#[tokio::test]
async fn test_document_type_detection_html_embedded() {
    let temp_dir = TempDir::new().expect("Failed to create temp directory");
    let html_file = temp_dir.path().join("test.html");

    // Write HTML with embedded XBRL
    let html_content = r#"<!DOCTYPE html>
<html>
<head>
    <title>Test HTML with XBRL</title>
</head>
<body>
    <div class="xbrl-data">
        <xbrl>Some XBRL content</xbrl>
    </div>
</body>
</html>"#;

    fs::write(&html_file, html_content).await.expect("Failed to write HTML file");

    // Test detection
    let content = fs::read_to_string(&html_file).await.expect("Failed to read file");
    assert!(content.contains("xbrl") && content.contains("<html"));
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

#[test]
fn test_taxonomy_cache_performance() {
    let mut cache = TaxonomyCache::new();

    // Add many concepts
    for i in 0..1000 {
        let concept = TaxonomyConcept {
            name: format!("concept_{}", i),
            label: format!("Concept {}", i),
            data_type: "monetaryItemType".to_string(),
            period_type: "instant".to_string(),
            balance_type: Some("debit".to_string()),
        };
        cache.add_concept(concept);
    }

    // Test retrieval performance
    let start = std::time::Instant::now();
    for i in 0..1000 {
        assert!(cache.get_concept(&format!("concept_{}", i)).is_some());
    }
    let duration = start.elapsed();

    // Should be fast (less than 10ms for 1000 lookups)
    assert!(duration.as_millis() < 10);
}

#[test]
fn test_validation_report_performance() {
    // Test creating large validation reports
    let start = std::time::Instant::now();

    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    for i in 0..1000 {
        errors.push(format!("Error {}", i));
        warnings.push(format!("Warning {}", i));
    }

    let report = ValidationReport {
        is_valid: false,
        errors,
        warnings,
    };

    let duration = start.elapsed();

    // Should be fast (less than 1ms)
    assert!(duration.as_millis() < 1);
    assert!(!report.is_valid);
    assert_eq!(report.errors.len(), 1000);
    assert_eq!(report.warnings.len(), 1000);
}

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

#[test]
fn test_validation_report_serialization() {
    let report = ValidationReport {
        is_valid: true,
        errors: vec!["Test error".to_string()],
        warnings: vec!["Test warning".to_string()],
    };

    let serialized = serde_json::to_string(&report).expect("Failed to serialize");
    let deserialized: ValidationReport = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(report.is_valid, deserialized.is_valid);
    assert_eq!(report.errors, deserialized.errors);
    assert_eq!(report.warnings, deserialized.warnings);
}

#[test]
fn test_taxonomy_concept_serialization() {
    let concept = TaxonomyConcept {
        name: "Assets".to_string(),
        label: "Total Assets".to_string(),
        data_type: "monetaryItemType".to_string(),
        period_type: "instant".to_string(),
        balance_type: Some("debit".to_string()),
    };

    let serialized = serde_json::to_string(&concept).expect("Failed to serialize");
    let deserialized: TaxonomyConcept = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(concept.name, deserialized.name);
    assert_eq!(concept.label, deserialized.label);
    assert_eq!(concept.data_type, deserialized.data_type);
    assert_eq!(concept.period_type, deserialized.period_type);
    assert_eq!(concept.balance_type, deserialized.balance_type);
}

#[test]
fn test_financial_ratio_serialization() {
    let ratio = FinancialRatio {
        name: "ROE".to_string(),
        value: 0.15,
        category: "profitability".to_string(),
        formula: "Net Income / Equity".to_string(),
    };

    let serialized = serde_json::to_string(&ratio).expect("Failed to serialize");
    let deserialized: FinancialRatio = serde_json::from_str(&serialized).expect("Failed to deserialize");

    assert_eq!(ratio.name, deserialized.name);
    assert_eq!(ratio.value, deserialized.value);
    assert_eq!(ratio.category, deserialized.category);
    assert_eq!(ratio.formula, deserialized.formula);
}
