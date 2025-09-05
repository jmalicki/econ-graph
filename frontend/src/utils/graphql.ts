/**
 * REQUIREMENT: GraphQL integration for efficient data fetching
 * PURPOSE: Provide GraphQL client configuration and query utilities
 * This enables efficient data fetching with the Rust backend GraphQL API
 */

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || '/graphql';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

/**
 * Execute a GraphQL query against the backend
 */
export async function executeGraphQL<T = any>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(result.errors[0].message);
  }

  return result;
}

// Common GraphQL queries
export const QUERIES = {
  // Get economic series list with filtering
  GET_SERIES_LIST: `
    query GetSeriesList(
      $filter: SeriesFilter
      $pagination: PaginationInput
    ) {
      seriesList(filter: $filter, pagination: $pagination) {
        nodes {
          id
          title
          description
          source {
            name
          }
          frequency
          units
          startDate
          endDate
          lastUpdated
          dataPointCount
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `,

  // Get detailed series information
  GET_SERIES_DETAIL: `
    query GetSeriesDetail($id: ID!) {
      series(id: $id) {
        id
        title
        description
        source {
          name
          description
        }
        frequency
        units
        seasonalAdjustment
        startDate
        endDate
        lastUpdated
        isActive
        dataPointCount
      }
    }
  `,

  // Get series data with transformations
  GET_SERIES_DATA: `
    query GetSeriesData(
      $seriesId: ID!
      $filter: DataFilter
      $transformation: DataTransformation
      $first: Int
      $after: String
    ) {
      seriesData(
        seriesId: $seriesId
        filter: $filter
        transformation: $transformation
        first: $first
        after: $after
      ) {
        nodes {
          date
          value
          revisionDate
          isOriginalRelease
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `,

  // Full-text search with spelling correction and synonyms
  SEARCH_SERIES_FULLTEXT: `
    query SearchSeriesFulltext($params: SearchParamsInput!) {
      searchSeries(params: $params) {
        id
        title
        description
        externalId
        sourceId
        frequency
        units
        startDate
        endDate
        lastUpdated
        isActive
        rank
        similarityScore
      }
    }
  `,
  
  // Get search suggestions for query completion and spelling correction
  GET_SEARCH_SUGGESTIONS: `
    query GetSearchSuggestions($partialQuery: String!, $limit: Int) {
      searchSuggestions(partialQuery: $partialQuery, limit: $limit) {
        suggestion
        matchCount
        suggestionType
        confidence
      }
    }
  `,

  // Legacy search series (kept for backward compatibility)
  SEARCH_SERIES: `
    query SearchSeries(
      $query: String!
      $source: String
      $frequency: SeriesFrequencyType
      $first: Int
      $after: String
    ) {
      searchSeries(
        query: $query
        source: $source
        frequency: $frequency
        first: $first
        after: $after
      ) {
        series {
          id
          title
          description
          source {
            name
          }
          frequency
          units
          lastUpdated
        }
        totalCount
        query
        tookMs
      }
    }
  `,

  // Get data sources
  GET_DATA_SOURCES: `
    query GetDataSources {
      dataSources {
        id
        name
        description
        baseUrl
        apiKeyRequired
        rateLimitPerMinute
        seriesCount
        createdAt
        updatedAt
      }
    }
  `,

  // Get crawler status for monitoring
  GET_CRAWLER_STATUS: `
    query GetCrawlerStatus {
      crawlerStatus {
        isRunning
        activeWorkers
        lastCrawl
        nextScheduledCrawl
      }
      queueStatistics {
        totalItems
        pendingItems
        processingItems
        completedItems
        failedItems
        retryingItems
        oldestPending
        averageProcessingTime
      }
    }
  `,
};

// Common GraphQL mutations
export const MUTATIONS = {
  // Trigger manual crawl
  TRIGGER_CRAWL: `
    mutation TriggerCrawl($input: TriggerCrawlInput!) {
      triggerCrawl(input: $input) {
        isRunning
        activeWorkers
        lastCrawl
        nextScheduledCrawl
      }
    }
  `,
};

// Type definitions for better TypeScript support
export interface SeriesListNode {
  id: string;
  title: string;
  description: string;
  source: {
    name: string;
  };
  frequency: string;
  units: string;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  dataPointCount: number;
}

export interface SeriesListResponse {
  seriesList: {
    nodes: SeriesListNode[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

export interface SeriesDetailResponse {
  series: {
    id: string;
    title: string;
    description: string;
    source: {
      name: string;
      description: string;
    };
    frequency: string;
    units: string;
    seasonalAdjustment?: string;
    startDate: string;
    endDate: string;
    lastUpdated: string;
    isActive: boolean;
    dataPointCount: number;
  };
}

export interface DataPoint {
  date: string;
  value: number | null;
  revisionDate: string;
  isOriginalRelease: boolean;
}

export interface SeriesDataResponse {
  seriesData: {
    nodes: DataPoint[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  };
}

export interface SearchSeriesResponse {
  searchSeries: {
    series: SeriesListNode[];
    totalCount: number;
    query: string;
    tookMs: number;
  };
}
