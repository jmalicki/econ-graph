use crate::database::DatabasePool;
use crate::error::{AppError, AppResult};
use crate::models::{
    Country, CountryCorrelation, CountryWithEconomicData, CorrelationNetworkNode,
    GlobalEconomicEvent, GlobalEventWithImpacts, NewCountryCorrelation, TradePartner,
    CorrelationConnection, IndicatorCategory
};
use bigdecimal::{BigDecimal, ToPrimitive};
use rust_decimal::prelude::{Decimal, FromStr};
use crate::schema::{
    countries, country_correlations, global_economic_indicators, global_indicator_data,
    trade_relationships, global_economic_events, event_country_impacts
};
use diesel::prelude::*;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use std::collections::HashMap;
use chrono::{NaiveDate, Utc};
// Removed duplicate Decimal import - already imported from prelude

/// Service for global economic network analysis
pub struct GlobalAnalysisService;

impl GlobalAnalysisService {
    /// Get all active countries with basic economic data
    pub async fn get_countries_with_economic_data(
        pool: &DatabasePool,
    ) -> AppResult<Vec<CountryWithEconomicData>> {
        use crate::schema::countries::dsl::*;

        let mut conn = pool.get().await.map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AppError::database_error("Database connection failed".to_string())
        })?;

        let countries_data = countries
            .filter(is_active.eq(true))
            .order(name.asc())
            .load::<Country>(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load countries: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut result = Vec::new();

        for country in countries_data {
            let economic_data = Self::get_latest_economic_indicators(&mut conn, country.id).await?;
            let trade_partners = Self::get_top_trade_partners(&mut conn, country.id, 5).await?;
            let health_score = Self::calculate_economic_health_score(&economic_data);

            result.push(CountryWithEconomicData {
                country,
                latest_gdp: economic_data.get("GDP").map(|d| BigDecimal::from_str(&d.to_string()).unwrap_or_default()),
                latest_gdp_growth: economic_data.get("GDP_GROWTH").map(|d| BigDecimal::from_str(&d.to_string()).unwrap_or_default()),
                latest_inflation: economic_data.get("INFLATION").map(|d| BigDecimal::from_str(&d.to_string()).unwrap_or_default()),
                latest_unemployment: economic_data.get("UNEMPLOYMENT").map(|d| BigDecimal::from_str(&d.to_string()).unwrap_or_default()),
                trade_partners,
                economic_health_score: health_score,
            });
        }

        Ok(result)
    }

    /// Calculate correlations between countries for a specific indicator category
    pub async fn calculate_country_correlations(
        pool: &DatabasePool,
        indicator_category: &str,
        start_date: NaiveDate,
        end_date: NaiveDate,
        min_correlation: f64,
    ) -> AppResult<Vec<CountryCorrelation>> {
        let mut conn = pool.get().await.map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AppError::database_error("Database connection failed".to_string())
        })?;

        // Get all country pairs
        let countries_list = countries::table
            .filter(countries::is_active.eq(true))
            .load::<Country>(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load countries: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut correlations = Vec::new();

        // Calculate correlations for each country pair
        for (i, country_a) in countries_list.iter().enumerate() {
            for country_b in countries_list.iter().skip(i + 1) {
                if let Ok(correlation) = Self::calculate_pairwise_correlation(
                    &mut conn,
                    country_a.id,
                    country_b.id,
                    indicator_category,
                    start_date,
                    end_date,
                ).await {
                    if correlation.correlation_coefficient.to_f64().unwrap_or(0.0).abs() >= min_correlation {
                        correlations.push(correlation);
                    }
                }
            }
        }

        // Store correlations in database
        for correlation in &correlations {
            let new_correlation = NewCountryCorrelation {
                country_a_id: correlation.country_a_id,
                country_b_id: correlation.country_b_id,
                indicator_category: correlation.indicator_category.clone(),
                correlation_coefficient: correlation.correlation_coefficient.clone(),
                time_period_start: correlation.time_period_start,
                time_period_end: correlation.time_period_end,
                sample_size: correlation.sample_size,
                p_value: correlation.p_value.clone(),
                is_significant: Some(correlation.is_significant),
            };

            diesel::insert_into(country_correlations::table)
                .values(&new_correlation.clone())
                .on_conflict((
                    country_correlations::country_a_id,
                    country_correlations::country_b_id,
                    country_correlations::indicator_category,
                    country_correlations::time_period_start,
                    country_correlations::time_period_end,
                ))
                .do_update()
                .set((
                    country_correlations::correlation_coefficient.eq(new_correlation.correlation_coefficient.clone()),
                    country_correlations::sample_size.eq(new_correlation.sample_size),
                    country_correlations::p_value.eq(new_correlation.p_value.clone()),
                    country_correlations::is_significant.eq(new_correlation.is_significant.unwrap_or(false)),
                    country_correlations::calculated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to store correlation: {}", e);
                    AppError::database_error(e.to_string())
                })?;
        }

        Ok(correlations)
    }

    /// Get correlation network for visualization
    pub async fn get_correlation_network(
        pool: &DatabasePool,
        indicator_category: &str,
        min_correlation: f64,
    ) -> AppResult<Vec<CorrelationNetworkNode>> {
        use crate::schema::country_correlations::dsl::*;

        let mut conn = pool.get().await.map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AppError::database_error("Database connection failed".to_string())
        })?;

        // Get significant correlations for the category
        let correlations = country_correlations
            .filter(indicator_category.eq(indicator_category))
            .filter(is_significant.eq(true))
            .filter(correlation_coefficient.ge(BigDecimal::from(min_correlation as i64)))
            .load::<CountryCorrelation>(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load correlations: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        // Build network nodes
        let mut country_connections: HashMap<uuid::Uuid, Vec<CorrelationConnection>> = HashMap::new();
        let mut countries_map: HashMap<uuid::Uuid, Country> = HashMap::new();

        // Load all countries involved in correlations
        for correlation in &correlations {
            if let std::collections::hash_map::Entry::Vacant(e) = countries_map.entry(correlation.country_a_id) {
                let country = countries::table
                    .find(correlation.country_a_id)
                    .first::<Country>(&mut conn)
                    .await
                    .map_err(|e| {
                        tracing::error!("Failed to load country: {}", e);
                        AppError::database_error(e.to_string())
                    })?;
                e.insert(country);
            }

            if let std::collections::hash_map::Entry::Vacant(e) = countries_map.entry(correlation.country_b_id) {
                let country = countries::table
                    .find(correlation.country_b_id)
                    .first::<Country>(&mut conn)
                    .await
                    .map_err(|e| {
                        tracing::error!("Failed to load country: {}", e);
                        AppError::database_error(e.to_string())
                    })?;
                e.insert(country);
            }

            // Add connections for both directions
            let corr_value = correlation.correlation_coefficient.to_f64().unwrap_or(0.0);
            let connection_strength = corr_value.abs();

            let connection_a_to_b = CorrelationConnection {
                target_country: countries_map[&correlation.country_b_id].clone(),
                correlation_coefficient: corr_value,
                indicator_category: correlation.indicator_category.clone(),
                significance_level: correlation.p_value.clone().map(|p| p.to_f64().unwrap_or(1.0)).unwrap_or(1.0),
                connection_strength,
            };

            let connection_b_to_a = CorrelationConnection {
                target_country: countries_map[&correlation.country_a_id].clone(),
                correlation_coefficient: corr_value,
                indicator_category: correlation.indicator_category.clone(),
                significance_level: correlation.p_value.clone().map(|p| p.to_f64().unwrap_or(1.0)).unwrap_or(1.0),
                connection_strength,
            };

            country_connections.entry(correlation.country_a_id)
                .or_default()
                .push(connection_a_to_b);

            country_connections.entry(correlation.country_b_id)
                .or_default()
                .push(connection_b_to_a);
        }

        // Calculate centrality scores and build network nodes
        let mut network_nodes = Vec::new();
        for (country_id, connections) in country_connections {
            let country = countries_map[&country_id].clone();
            let centrality_score = Self::calculate_centrality_score(&connections);

            network_nodes.push(CorrelationNetworkNode {
                country,
                connections,
                centrality_score,
                cluster_id: None, // TODO: Implement clustering algorithm
            });
        }

        // Sort by centrality score (most central first)
        network_nodes.sort_by(|a, b| b.centrality_score.partial_cmp(&a.centrality_score).unwrap_or(std::cmp::Ordering::Equal));

        Ok(network_nodes)
    }

    /// Get global economic events with their country impacts
    pub async fn get_global_events_with_impacts(
        pool: &DatabasePool,
        start_date_filter: Option<NaiveDate>,
        end_date_filter: Option<NaiveDate>,
        min_impact_score: Option<f64>,
    ) -> AppResult<Vec<GlobalEventWithImpacts>> {
        use crate::schema::global_economic_events::dsl::*;

        let mut conn = pool.get().await.map_err(|e| {
            tracing::error!("Failed to get database connection: {}", e);
            AppError::database_error("Database connection failed".to_string())
        })?;

        let mut query = global_economic_events.into_boxed();

        if let Some(start) = start_date_filter {
            query = query.filter(start_date.ge(start));
        }

        if let Some(end) = end_date_filter {
            query = query.filter(end_date.le(end));
        }

        if let Some(min_score) = min_impact_score {
            query = query.filter(economic_impact_score.ge(BigDecimal::from(min_score as i64)));
        }

        let events = query
            .order(start_date.desc())
            .load::<GlobalEconomicEvent>(&mut conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load global events: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut result = Vec::new();

        for event in events {
            let country_impacts = Self::get_event_country_impacts(&mut conn, event.id).await?;
            let affected_country_count = country_impacts.len() as i64;
            let total_economic_impact = event.economic_impact_score.clone();

            result.push(GlobalEventWithImpacts {
                event,
                country_impacts,
                affected_country_count,
                total_economic_impact,
            });
        }

        Ok(result)
    }

    /// Get top trade partners for a country
    async fn get_top_trade_partners(
        conn: &mut AsyncPgConnection,
        country_id: uuid::Uuid,
        limit: i64,
    ) -> AppResult<Vec<TradePartner>> {
        use crate::schema::trade_relationships::dsl::*;

        let trade_data = trade_relationships
            .filter(exporter_country_id.eq(country_id).or(importer_country_id.eq(country_id)))
            .order(export_value_usd.desc().nulls_last())
            .limit(limit)
            .load::<crate::models::TradeRelationship>(conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load trade relationships: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut partners = Vec::new();

        for trade in trade_data {
            let partner_id = if trade.exporter_country_id == country_id {
                trade.importer_country_id
            } else {
                trade.exporter_country_id
            };

            let partner_country = countries::table
                .find(partner_id)
                .first::<Country>(conn)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to load partner country: {}", e);
                    AppError::database_error(e.to_string())
                })?;

            let trade_value = trade.export_value_usd.unwrap_or_default();
            let trade_intensity_value = trade.trade_intensity.map(|t| t.to_f64().unwrap_or(0.0)).unwrap_or(0.0);
            let relationship_type = if trade.exporter_country_id == country_id {
                "Export".to_string()
            } else {
                "Import".to_string()
            };

            partners.push(TradePartner {
                country: partner_country,
                trade_value_usd: trade_value,
                trade_intensity: trade_intensity_value,
                relationship_type,
            });
        }

        Ok(partners)
    }

    /// Get latest economic indicators for a country
    async fn get_latest_economic_indicators(
        conn: &mut AsyncPgConnection,
        country_id: uuid::Uuid,
    ) -> AppResult<HashMap<String, Decimal>> {
        use crate::schema::global_economic_indicators::dsl::*;
        use crate::schema::global_indicator_data::dsl::*;

        let indicators = global_economic_indicators
            .filter(country_id.eq(country_id))
            .load::<crate::models::GlobalEconomicIndicator>(conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load indicators: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut result = HashMap::new();

        for indicator in indicators {
            if let Ok(latest_data) = global_indicator_data
                .filter(indicator_id.eq(indicator.id))
                .filter(value.is_not_null())
                .order(date.desc())
                .first::<crate::models::GlobalIndicatorData>(conn)
                .await
            {
                // Convert BigDecimal to Decimal for compatibility
                let decimal_value = Decimal::from_str(&latest_data.value.unwrap_or_default().to_string()).unwrap_or_default();
                result.insert(indicator.category.clone(), decimal_value);
            }
        }

        Ok(result)
    }

    /// Calculate economic health score based on indicators
    fn calculate_economic_health_score(indicators: &HashMap<String, Decimal>) -> Option<f64> {
        let mut score: f64 = 50.0; // Base score
        let mut factors = 0;

        // GDP growth factor
        if let Some(gdp_growth) = indicators.get("GDP_GROWTH") {
            let growth_rate = gdp_growth.to_f64().unwrap_or(0.0);
            score += (growth_rate * 10.0).min(20.0).max(-20.0);
            factors += 1;
        }

        // Unemployment factor (inverse)
        if let Some(unemployment) = indicators.get("UNEMPLOYMENT") {
            let unemployment_rate = unemployment.to_f64().unwrap_or(0.0);
            score -= (unemployment_rate * 2.0).min(20.0);
            factors += 1;
        }

        // Inflation factor (optimal around 2%)
        if let Some(inflation) = indicators.get("INFLATION") {
            let inflation_rate = inflation.to_f64().unwrap_or(0.0);
            let inflation_deviation = (inflation_rate - 2.0).abs();
            score -= (inflation_deviation * 5.0).min(15.0);
            factors += 1;
        }

        if factors > 0 {
            Some(score.max(0.0).min(100.0))
        } else {
            None
        }
    }

    /// Calculate pairwise correlation between two countries
    async fn calculate_pairwise_correlation(
        conn: &mut AsyncPgConnection,
        country_a_id: uuid::Uuid,
        country_b_id: uuid::Uuid,
        indicator_category: &str,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> AppResult<CountryCorrelation> {
        // This is a simplified implementation
        // In a real system, you'd fetch the actual time series data and calculate Pearson correlation

        // For now, return a mock correlation
        Ok(CountryCorrelation {
            id: uuid::Uuid::new_v4(),
            country_a_id,
            country_b_id,
            indicator_category: indicator_category.to_string(),
            correlation_coefficient: BigDecimal::from(75) / BigDecimal::from(100), // Mock correlation 0.75
            time_period_start: start_date,
            time_period_end: end_date,
            sample_size: 100,
            p_value: Some(BigDecimal::from(1) / BigDecimal::from(100)), // 0.01
            is_significant: true,
            calculated_at: Utc::now(),
        })
    }

    /// Calculate centrality score for a country in the network
    fn calculate_centrality_score(connections: &[CorrelationConnection]) -> f64 {
        if connections.is_empty() {
            return 0.0;
        }

        // Simple degree centrality weighted by connection strength
        let total_strength: f64 = connections.iter()
            .map(|c| c.connection_strength)
            .sum();

        total_strength / connections.len() as f64
    }

    /// Get country impacts for a global event
    async fn get_event_country_impacts(
        conn: &mut AsyncPgConnection,
        event_id: uuid::Uuid,
    ) -> AppResult<Vec<crate::models::CountryImpactDetail>> {
        use crate::schema::event_country_impacts::dsl::*;

        let impacts = event_country_impacts
            .filter(event_id.eq(event_id))
            .load::<crate::models::EventCountryImpact>(conn)
            .await
            .map_err(|e| {
                tracing::error!("Failed to load event impacts: {}", e);
                 AppError::database_error(e.to_string())
            })?;

        let mut result = Vec::new();

        for impact in impacts {
            let country = countries::table
                .find(impact.country_id)
                .first::<Country>(conn)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to load country: {}", e);
                    AppError::database_error(e.to_string())
                })?;

            let impact_severity = Self::classify_impact_severity(&impact);
            let recovery_status = Self::classify_recovery_status(&impact);

            result.push(crate::models::CountryImpactDetail {
                country,
                impact,
                impact_severity,
                recovery_status,
            });
        }

        Ok(result)
    }

    /// Classify impact severity based on magnitude
    fn classify_impact_severity(impact: &crate::models::EventCountryImpact) -> String {
        match impact.impact_magnitude.as_ref().map(|m| m.to_f64().unwrap_or(0.0).abs()) {
            Some(magnitude) if magnitude >= 10.0 => "Critical".to_string(),
            Some(magnitude) if magnitude >= 5.0 => "Severe".to_string(),
            Some(magnitude) if magnitude >= 2.0 => "Moderate".to_string(),
            _ => "Mild".to_string(),
        }
    }

    /// Classify recovery status based on recovery time
    fn classify_recovery_status(impact: &crate::models::EventCountryImpact) -> String {
        match impact.recovery_time_days {
            Some(days) if days <= 90 => "Recovered".to_string(),
            Some(days) if days <= 365 => "Recovering".to_string(),
            _ => "Ongoing".to_string(),
        }
    }
}
