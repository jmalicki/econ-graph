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
        #[max_length = 255]
        series_id -> Nullable<Varchar>,
        chart_id -> Nullable<Uuid>,
        annotation_date -> Date,
        annotation_value -> Nullable<Numeric>,
        #[max_length = 255]
        title -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 7]
        color -> Nullable<Varchar>,
        #[max_length = 20]
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
        #[max_length = 20]
        role -> Nullable<Varchar>,
        permissions -> Nullable<Jsonb>,
        created_at -> Nullable<Timestamptz>,
        last_accessed_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    crawl_queue (id) {
        id -> Uuid,
        #[max_length = 50]
        source -> Varchar,
        #[max_length = 255]
        series_id -> Varchar,
        priority -> Int4,
        #[max_length = 20]
        status -> Varchar,
        retry_count -> Int4,
        max_retries -> Int4,
        error_message -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        scheduled_for -> Nullable<Timestamptz>,
        #[max_length = 100]
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
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 500]
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
        #[max_length = 255]
        external_id -> Varchar,
        #[max_length = 500]
        title -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 100]
        units -> Nullable<Varchar>,
        #[max_length = 50]
        frequency -> Varchar,
        #[max_length = 100]
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
    user_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        created_at -> Nullable<Timestamptz>,
        last_used_at -> Nullable<Timestamptz>,
        user_agent -> Nullable<Text>,
        ip_address -> Nullable<Text>,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        avatar_url -> Nullable<Text>,
        #[max_length = 50]
        provider -> Varchar,
        #[max_length = 255]
        provider_id -> Nullable<Varchar>,
        #[max_length = 255]
        password_hash -> Nullable<Varchar>,
        #[max_length = 50]
        role -> Varchar,
        #[max_length = 255]
        organization -> Nullable<Varchar>,
        #[max_length = 20]
        theme -> Nullable<Varchar>,
        #[max_length = 50]
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

diesel::joinable!(annotation_comments -> chart_annotations (annotation_id));
diesel::joinable!(annotation_comments -> users (user_id));
diesel::joinable!(chart_annotations -> users (user_id));
diesel::joinable!(data_points -> economic_series (series_id));
diesel::joinable!(economic_series -> data_sources (source_id));
diesel::joinable!(user_sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    annotation_comments,
    chart_annotations,
    chart_collaborators,
    crawl_queue,
    data_points,
    data_sources,
    economic_series,
    user_sessions,
    users,
);
