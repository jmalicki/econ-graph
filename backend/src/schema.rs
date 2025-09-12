// @generated automatically by Diesel CLI.

diesel::table! {
    annotation_comments (id) {
        id -> Uuid,
        annotation_id -> Uuid,
        user_id -> Uuid,
        content -> Text,
        is_resolved -> Nullable<Bool>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    chart_annotations (id) {
        id -> Uuid,
        user_id -> Uuid,
        series_id -> Nullable<Varchar>,
        chart_id -> Nullable<Uuid>,
        annotation_date -> Date,
        annotation_value -> Nullable<Numeric>,
        title -> Varchar,
        description -> Nullable<Text>,
        color -> Nullable<Varchar>,
        annotation_type -> Nullable<Varchar>,
        is_visible -> Nullable<Bool>,
        is_pinned -> Nullable<Bool>,
        tags -> Nullable<Array<Nullable<Text>>>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    chart_collaborators (id) {
        id -> Uuid,
        chart_id -> Uuid,
        user_id -> Uuid,
        invited_by -> Nullable<Uuid>,
        role -> Nullable<Varchar>,
        permissions -> Nullable<Jsonb>,
        created_at -> Nullable<Timestamptz>,
        last_accessed_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    countries (id) {
        id -> Uuid,
        iso_code -> Varchar,
        iso_code_2 -> Varchar,
        name -> Varchar,
        region -> Varchar,
        sub_region -> Nullable<Varchar>,
        income_group -> Nullable<Varchar>,
        population -> Nullable<BigInt>,
        gdp_usd -> Nullable<Numeric>,
        gdp_per_capita_usd -> Nullable<Numeric>,
        latitude -> Nullable<Numeric>,
        longitude -> Nullable<Numeric>,
        currency_code -> Nullable<Varchar>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    country_correlations (id) {
        id -> Uuid,
        country_a_id -> Uuid,
        country_b_id -> Uuid,
        indicator_category -> Varchar,
        correlation_coefficient -> Numeric,
        time_period_start -> Date,
        time_period_end -> Date,
        sample_size -> Integer,
        p_value -> Nullable<Numeric>,
        is_significant -> Bool,
        calculated_at -> Timestamptz,
    }
}

diesel::table! {
    crawl_attempts (id) {
        id -> Uuid,
        series_id -> Uuid,
        attempted_at -> Timestamptz,
        completed_at -> Nullable<Timestamptz>,
        crawl_method -> Varchar,
        crawl_url -> Nullable<Text>,
        http_status_code -> Nullable<Integer>,
        data_found -> Bool,
        new_data_points -> Integer,
        latest_data_date -> Nullable<Date>,
        data_freshness_hours -> Nullable<Integer>,
        success -> Bool,
        error_type -> Nullable<Varchar>,
        error_message -> Nullable<Text>,
        retry_count -> Integer,
        response_time_ms -> Nullable<Integer>,
        data_size_bytes -> Nullable<Integer>,
        rate_limit_remaining -> Nullable<Integer>,
        user_agent -> Nullable<Text>,
        request_headers -> Nullable<Jsonb>,
        response_headers -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    crawl_queue (id) {
        id -> Uuid,
        source -> Varchar,
        series_id -> Varchar,
        priority -> Integer,
        status -> Varchar,
        retry_count -> Integer,
        max_retries -> Integer,
        error_message -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        scheduled_for -> Nullable<Timestamptz>,
        locked_by -> Nullable<Varchar>,
        locked_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    data_points (id) {
        id -> Uuid,
        series_id -> Uuid,
        date -> Date,
        value -> Nullable<Numeric>,
        revision_date -> Date,
        is_original_release -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    data_sources (id) {
        id -> Uuid,
        name -> Varchar,
        description -> Nullable<Text>,
        base_url -> Varchar,
        api_key_required -> Bool,
        rate_limit_per_minute -> Integer,
        is_visible -> Bool,
        is_enabled -> Bool,
        requires_admin_approval -> Bool,
        crawl_frequency_hours -> Integer,
        last_crawl_at -> Nullable<Timestamptz>,
        crawl_status -> Nullable<Varchar>,
        crawl_error_message -> Nullable<Text>,
        api_documentation_url -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    economic_series (id) {
        id -> Uuid,
        source_id -> Uuid,
        external_id -> Varchar,
        title -> Varchar,
        description -> Nullable<Text>,
        units -> Nullable<Varchar>,
        frequency -> Varchar,
        seasonal_adjustment -> Nullable<Varchar>,
        last_updated -> Nullable<Timestamptz>,
        start_date -> Nullable<Date>,
        end_date -> Nullable<Date>,
        is_active -> Bool,
        first_discovered_at -> Nullable<Timestamptz>,
        last_crawled_at -> Nullable<Timestamptz>,
        first_missing_date -> Nullable<Date>,
        crawl_status -> Nullable<Varchar>,
        crawl_error_message -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    event_country_impacts (id) {
        id -> Uuid,
        event_id -> Uuid,
        country_id -> Uuid,
        impact_type -> Varchar,
        impact_magnitude -> Nullable<Numeric>,
        impact_duration_days -> Nullable<Integer>,
        recovery_time_days -> Nullable<Integer>,
        confidence_score -> Nullable<Numeric>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    global_economic_events (id) {
        id -> Uuid,
        name -> Varchar,
        description -> Nullable<Text>,
        event_type -> Varchar,
        severity -> Varchar,
        start_date -> Date,
        end_date -> Nullable<Date>,
        primary_country_id -> Nullable<Uuid>,
        affected_regions -> Nullable<Array<Nullable<Text>>>,
        economic_impact_score -> Nullable<Numeric>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    global_economic_indicators (id) {
        id -> Uuid,
        country_id -> Uuid,
        indicator_code -> Varchar,
        indicator_name -> Varchar,
        category -> Varchar,
        subcategory -> Nullable<Varchar>,
        unit -> Nullable<Varchar>,
        frequency -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    global_indicator_data (id) {
        id -> Uuid,
        indicator_id -> Uuid,
        date -> Date,
        value -> Nullable<Numeric>,
        is_preliminary -> Bool,
        data_source -> Varchar,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    leading_indicators (id) {
        id -> Uuid,
        leading_country_id -> Uuid,
        following_country_id -> Uuid,
        indicator_category -> Varchar,
        lead_time_months -> Integer,
        correlation_strength -> Numeric,
        predictive_accuracy -> Nullable<Numeric>,
        time_period_start -> Date,
        time_period_end -> Date,
        calculated_at -> Timestamptz,
    }
}

diesel::table! {
    trade_relationships (id) {
        id -> Uuid,
        exporter_country_id -> Uuid,
        importer_country_id -> Uuid,
        trade_flow_type -> Varchar,
        year -> Integer,
        export_value_usd -> Nullable<Numeric>,
        import_value_usd -> Nullable<Numeric>,
        trade_balance_usd -> Nullable<Numeric>,
        trade_intensity -> Nullable<Numeric>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    user_data_source_preferences (id) {
        id -> Uuid,
        user_id -> Uuid,
        data_source_id -> Uuid,
        is_visible -> Bool,
        is_favorite -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        created_at -> Timestamptz,
        last_used_at -> Timestamptz,
        user_agent -> Nullable<Text>,
        ip_address -> Nullable<Text>,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        email -> Varchar,
        name -> Varchar,
        avatar_url -> Nullable<Text>,
        provider -> Varchar,
        provider_id -> Nullable<Varchar>,
        password_hash -> Nullable<Varchar>,
        role -> Varchar,
        organization -> Nullable<Varchar>,
        theme -> Varchar,
        default_chart_type -> Varchar,
        notifications_enabled -> Bool,
        collaboration_enabled -> Bool,
        is_active -> Bool,
        email_verified -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        last_login_at -> Nullable<Timestamptz>,
    }
}

diesel::joinable!(annotation_comments -> chart_annotations (annotation_id));
diesel::joinable!(annotation_comments -> users (user_id));
diesel::joinable!(chart_annotations -> users (user_id));
diesel::joinable!(chart_collaborators -> users (user_id));
diesel::joinable!(crawl_attempts -> economic_series (series_id));
diesel::joinable!(data_points -> economic_series (series_id));
diesel::joinable!(economic_series -> data_sources (source_id));
diesel::joinable!(event_country_impacts -> countries (country_id));
diesel::joinable!(event_country_impacts -> global_economic_events (event_id));
diesel::joinable!(global_economic_events -> countries (primary_country_id));
diesel::joinable!(global_economic_indicators -> countries (country_id));
diesel::joinable!(global_indicator_data -> global_economic_indicators (indicator_id));
diesel::joinable!(leading_indicators -> countries (leading_country_id));
diesel::joinable!(trade_relationships -> countries (exporter_country_id));
diesel::joinable!(user_data_source_preferences -> data_sources (data_source_id));
diesel::joinable!(user_data_source_preferences -> users (user_id));
diesel::joinable!(user_sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    annotation_comments,
    chart_annotations,
    chart_collaborators,
    countries,
    country_correlations,
    crawl_attempts,
    crawl_queue,
    data_points,
    data_sources,
    economic_series,
    event_country_impacts,
    global_economic_events,
    global_economic_indicators,
    global_indicator_data,
    leading_indicators,
    trade_relationships,
    user_data_source_preferences,
    user_sessions,
    users,
);
