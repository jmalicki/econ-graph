import { useQuery, UseQueryResult } from 'react-query';
import { executeGraphQL, QUERIES, SeriesDetailResponse, SeriesDataResponse, DataPoint } from '../utils/graphql';

/**
 * REQUIREMENT: Efficient data fetching with React Query and GraphQL
 * PURPOSE: Custom hooks for fetching economic series data with caching and error handling
 * This provides a clean interface for components to access backend data
 */

export interface UseSeriesDetailOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch detailed information about a specific economic series
 */
export function useSeriesDetail(
  seriesId: string | undefined,
  options: UseSeriesDetailOptions = {}
): UseQueryResult<SeriesDetailResponse['series'], Error> {
  return useQuery(
    ['series-detail', seriesId],
    async () => {
      if (!seriesId) throw new Error('Series ID is required');
      
      const response = await executeGraphQL<SeriesDetailResponse>({
        query: QUERIES.GET_SERIES_DETAIL,
        variables: { id: seriesId },
      });
      
      if (!response.data?.series) {
        throw new Error('Series not found');
      }
      
      return response.data.series;
    },
    {
      enabled: !!seriesId && options.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    }
  );
}

export interface UseSeriesDataOptions {
  startDate?: string;
  endDate?: string;
  originalOnly?: boolean;
  latestRevisionOnly?: boolean;
  transformation?: 'NONE' | 'YEAR_OVER_YEAR' | 'QUARTER_OVER_QUARTER' | 'MONTH_OVER_MONTH';
  enabled?: boolean;
}

/**
 * Hook to fetch data points for a specific economic series
 */
export function useSeriesData(
  seriesId: string | undefined,
  options: UseSeriesDataOptions = {}
): UseQueryResult<DataPoint[], Error> {
  const {
    startDate,
    endDate,
    originalOnly,
    latestRevisionOnly,
    transformation = 'NONE',
    enabled = true,
  } = options;

  return useQuery(
    [
      'series-data',
      seriesId,
      startDate,
      endDate,
      originalOnly,
      latestRevisionOnly,
      transformation,
    ],
    async () => {
      if (!seriesId) throw new Error('Series ID is required');
      
      const response = await executeGraphQL<SeriesDataResponse>({
        query: QUERIES.GET_SERIES_DATA,
        variables: {
          seriesId,
          filter: {
            startDate,
            endDate,
            originalOnly,
            latestRevisionOnly,
          },
          transformation: transformation !== 'NONE' ? transformation : null,
          first: 10000, // Large number to get all data points
        },
      });
      
      return response.data?.seriesData.nodes || [];
    },
    {
      enabled: !!seriesId && enabled,
      staleTime: 2 * 60 * 1000, // 2 minutes (data can be updated frequently)
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    }
  );
}

/**
 * Hook to search economic series using full-text search with spelling correction
 */
export interface UseSeriesSearchOptions {
  query: string;
  sourceId?: string;
  frequency?: string;
  similarityThreshold?: number;
  sortBy?: 'RELEVANCE' | 'TITLE' | 'LAST_UPDATED' | 'START_DATE';
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export interface SeriesSearchResult {
  id: string;
  title: string;
  description?: string;
  externalId: string;
  sourceId: string;
  frequency: string;
  units: string;
  startDate: string;
  endDate?: string;
  lastUpdated: string;
  isActive: boolean;
  rank: number;
  similarityScore: number;
}

export function useSeriesSearch(options: UseSeriesSearchOptions) {
  const { 
    query, 
    sourceId, 
    frequency, 
    similarityThreshold = 0.3,
    sortBy = 'RELEVANCE',
    includeInactive = false,
    limit = 50, 
    offset = 0,
    enabled = true 
  } = options;

  return useQuery(
    ['series-search-fulltext', query, sourceId, frequency, similarityThreshold, sortBy, includeInactive, limit, offset],
    async () => {
      const response = await executeGraphQL({
        query: QUERIES.SEARCH_SERIES_FULLTEXT,
        variables: {
          params: {
            query,
            sourceId,
            frequency,
            similarityThreshold,
            sortBy,
            includeInactive,
            limit,
            offset,
          },
        },
      });
      
      return response.data?.searchSeries || [];
    },
    {
      enabled: enabled && query.length >= 2, // Only search with 2+ characters
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );
}

/**
 * Hook to get search suggestions for query completion and spelling correction
 */
export interface UseSearchSuggestionsOptions {
  partialQuery: string;
  limit?: number;
  enabled?: boolean;
}

export interface SearchSuggestion {
  suggestion: string;
  matchCount: number;
  suggestionType: 'CORRECTION' | 'COMPLETION' | 'SYNONYM';
  confidence: number;
}

export function useSearchSuggestions(options: UseSearchSuggestionsOptions) {
  const { partialQuery, limit = 10, enabled = true } = options;

  return useQuery(
    ['search-suggestions', partialQuery, limit],
    async () => {
      const response = await executeGraphQL({
        query: QUERIES.GET_SEARCH_SUGGESTIONS,
        variables: {
          partialQuery,
          limit,
        },
      });
      
      return response.data?.searchSuggestions || [];
    },
    {
      enabled: enabled && partialQuery.length >= 2,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );
}

/**
 * Hook to fetch data sources information
 */
export function useDataSources() {
  return useQuery(
    ['data-sources'],
    async () => {
      const response = await executeGraphQL({
        query: QUERIES.GET_DATA_SOURCES,
      });
      
      return response.data?.dataSources || [];
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (data sources don't change often)
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
    }
  );
}

/**
 * Hook to fetch crawler status for monitoring
 */
export function useCrawlerStatus(options: { enabled?: boolean } = {}) {
  return useQuery(
    ['crawler-status'],
    async () => {
      const response = await executeGraphQL({
        query: QUERIES.GET_CRAWLER_STATUS,
      });
      
      return {
        crawlerStatus: response.data?.crawlerStatus,
        queueStatistics: response.data?.queueStatistics,
      };
    },
    {
      enabled: options.enabled !== false,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 60 * 1000, // 1 minute
      retry: 2,
      refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for monitoring
    }
  );
}

/**
 * Utility hook for data transformations
 */
export function useDataTransformation(
  data: DataPoint[],
  transformation: UseSeriesDataOptions['transformation'] = 'NONE'
): DataPoint[] {
  return React.useMemo(() => {
    if (transformation === 'NONE' || !data.length) return data;

    // Client-side transformation for immediate feedback
    // Note: Server-side transformation is preferred for accuracy
    return data.map((point, index) => {
      if (point.value === null) return point;

      let transformedValue: number | null = null;
      const currentDate = new Date(point.date);

      if (transformation === 'YEAR_OVER_YEAR') {
        // Find data point from same period previous year
        const previousYear = new Date(currentDate);
        previousYear.setFullYear(currentDate.getFullYear() - 1);
        const previousPoint = data.find(p => 
          Math.abs(new Date(p.date).getTime() - previousYear.getTime()) < 32 * 24 * 60 * 60 * 1000
        );
        if (previousPoint?.value && previousPoint.value !== 0) {
          transformedValue = ((point.value - previousPoint.value) / previousPoint.value) * 100;
        }
      }
      // Add other transformations as needed...

      return { ...point, value: transformedValue };
    }).filter(p => p.value !== null);
  }, [data, transformation]);
}

// Re-export React for the useMemo hook
import React from 'react';
