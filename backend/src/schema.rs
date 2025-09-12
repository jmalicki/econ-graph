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
    audit_logs (id) {
        id -> Uuid,
        user_id -> Uuid,
        user_name -> Varchar,
        action -> Varchar,
        resource_type -> Varchar,
        resource_id -> Nullable<Varchar>,
        ip_address -> Nullable<Text>,
        user_agent -> Nullable<Text>,
        details -> Nullable<Jsonb>,
        created_at -> Timestamptz,
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
        name -> Varchar,
        code -> Varchar,
        region -> Varchar,
        income_group -> Varchar,
        population -> Nullable<BigInt>,
        gdp_usd -> Nullable<Numeric>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    crawl_queue (id) {
        id -> Uuid,
        source_id -> Uuid,
        series_id -> Nullable<Varchar>,
        status -> Varchar,
        priority -> Integer,
        retry_count -> Integer,
        last_attempt_at -> Nullable<Timestamptz>,
        next_attempt_at -> Nullable<Timestamptz>,
        error_message -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
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
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    event_country_impacts (id) {
        id -> Uuid,
        event_id -> Uuid,
        country_id -> Uuid,
        impact_score -> Nullable<Numeric>,
        impact_description -> Nullable<Text>,
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
    security_events (id) {
        id -> Uuid,
        event_type -> Varchar,
        user_id -> Nullable<Uuid>,
        user_email -> Nullable<Varchar>,
        severity -> Varchar,
        ip_address -> Nullable<Text>,
        user_agent -> Nullable<Text>,
        description -> Text,
        metadata -> Nullable<Jsonb>,
        resolved -> Bool,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
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
        #[max_length = 20]
        theme -> Varchar,
        #[max_length = 50]
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
diesel::joinable!(audit_logs -> users (user_id));
diesel::joinable!(chart_annotations -> users (user_id));
diesel::joinable!(chart_collaborators -> users (user_id));
diesel::joinable!(chart_collaborators -> users (invited_by));
diesel::joinable!(crawl_queue -> data_sources (source_id));
diesel::joinable!(data_points -> economic_series (series_id));
diesel::joinable!(economic_series -> data_sources (source_id));
diesel::joinable!(event_country_impacts -> countries (country_id));
diesel::joinable!(event_country_impacts -> global_economic_events (event_id));
diesel::joinable!(global_economic_events -> countries (primary_country_id));
diesel::joinable!(security_events -> users (user_id));
diesel::joinable!(security_events -> users (resolved_by));
diesel::joinable!(trade_relationships -> countries (exporter_country_id));
diesel::joinable!(trade_relationships -> countries (importer_country_id));
diesel::joinable!(user_sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    annotation_comments,
    audit_logs,
    chart_annotations,
    chart_collaborators,
    countries,
    crawl_queue,
    data_points,
    data_sources,
    economic_series,
    event_country_impacts,
    global_economic_events,
    security_events,
    trade_relationships,
    user_sessions,
    users,
);
