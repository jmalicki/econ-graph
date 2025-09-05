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

// Note: crawl_queue.source is a string name, not a foreign key to data_sources.id
// diesel::joinable!(crawl_queue -> data_sources (source));
diesel::joinable!(data_points -> economic_series (series_id));
diesel::joinable!(economic_series -> data_sources (source_id));

diesel::allow_tables_to_appear_in_same_query!(
    crawl_queue,
    data_points,
    data_sources,
    economic_series,
);
