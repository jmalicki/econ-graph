// @generated automatically by Diesel CLI.

diesel::table! {
    crawl_queue (id) {
        id -> Uuid,
        source -> Varchar,
        series_id -> Varchar,
        priority -> Int4,
        status -> Varchar,
        retry_count -> Int4,
        max_retries -> Int4,
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
        rate_limit_per_minute -> Int4,
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
        theme -> Nullable<Varchar>,
        default_chart_type -> Nullable<Varchar>,
        notifications_enabled -> Nullable<Bool>,
        collaboration_enabled -> Nullable<Bool>,
        is_active -> Nullable<Bool>,
        email_verified -> Nullable<Bool>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
        last_login_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        created_at -> Nullable<Timestamptz>,
        last_used_at -> Nullable<Timestamptz>,
        user_agent -> Nullable<Text>,
        ip_address -> Nullable<Inet>,
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

// Note: crawl_queue.source is a string name, not a foreign key to data_sources.id
// diesel::joinable!(crawl_queue -> data_sources (source));
diesel::joinable!(data_points -> economic_series (series_id));
diesel::joinable!(economic_series -> data_sources (source_id));
diesel::joinable!(user_sessions -> users (user_id));
diesel::joinable!(chart_annotations -> users (user_id));
diesel::joinable!(annotation_comments -> chart_annotations (annotation_id));
diesel::joinable!(annotation_comments -> users (user_id));
diesel::joinable!(chart_collaborators -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    crawl_queue,
    data_points,
    data_sources,
    economic_series,
    users,
    user_sessions,
    chart_annotations,
    annotation_comments,
    chart_collaborators,
);
