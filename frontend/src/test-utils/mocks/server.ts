// REQUIREMENT: Mock Service Worker setup for API mocking in tests
// PURPOSE: Provide realistic API responses for isolated frontend testing
// This enables testing components without requiring a running backend

// Polyfills for Node.js test environment (required for MSW)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { setupServer } from 'msw/node';
import { graphql, http, HttpResponse } from 'msw';
import { mockSeriesData, mockDataSources, mockSearchResults, mockSuggestions } from './data';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:8080/graphql';

export const handlers = [
  // GraphQL handlers
  graphql.query('GetSeriesDetail', ({ variables }) => {
    // REQUIREMENT: Mock series detail query for component testing
    const { id } = variables as { id: string };
    const series = mockSeriesData.find(s => s.id === id);
    
    if (!series) {
      return HttpResponse.json({
        data: { series: null },
        errors: [{ message: 'Series not found' }],
      });
    }
    
    return HttpResponse.json({
      data: { series },
    });
  }),

  graphql.query('GetSeriesData', ({ variables }) => {
    // REQUIREMENT: Mock series data points for chart testing
    const { seriesId, filter, transformation } = variables as any;
    
    // Generate mock data points based on parameters
    const dataPoints = Array.from({ length: 12 }, (_, index) => ({
      date: `2024-${String(index + 1).padStart(2, '0')}-01`,
      value: Math.random() * 100 + 50, // Random values between 50-150
      revisionDate: `2024-${String(index + 1).padStart(2, '0')}-15`,
      isOriginalRelease: index % 3 === 0, // Every third point is original
    }));

    return HttpResponse.json({
      data: {
        seriesData: {
          nodes: dataPoints,
          totalCount: dataPoints.length,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    });
  }),

  graphql.query('SearchSeriesFulltext', ({ variables }) => {
    // REQUIREMENT: Mock full-text search for search component testing
    const { params } = variables as any;
    const { query, limit = 50 } = params;
    
    // Filter mock results based on query
    const filteredResults = mockSearchResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return HttpResponse.json({
      data: {
        searchSeries: filteredResults,
      },
    });
  }),

  graphql.query('GetSearchSuggestions', ({ variables }) => {
    // REQUIREMENT: Mock search suggestions for autocomplete testing
    const { partialQuery, limit = 10 } = variables as any;
    
    const filteredSuggestions = mockSuggestions.filter(suggestion =>
      suggestion.suggestion.toLowerCase().startsWith(partialQuery.toLowerCase())
    ).slice(0, limit);

    return HttpResponse.json({
      data: {
        searchSuggestions: filteredSuggestions,
      },
    });
  }),

  graphql.query('GetDataSources', () => {
    // REQUIREMENT: Mock data sources for dropdown testing
    return HttpResponse.json({
      data: {
        dataSources: mockDataSources,
      },
    });
  }),

  graphql.query('GetCrawlerStatus', () => {
    // REQUIREMENT: Mock crawler status for monitoring component testing
    return HttpResponse.json({
      data: {
        crawlerStatus: {
          isRunning: true,
          lastRunAt: new Date().toISOString(),
          nextRunAt: new Date(Date.now() + 60000).toISOString(),
          totalJobs: 150,
          completedJobs: 120,
          failedJobs: 5,
          pendingJobs: 25,
        },
        queueStatistics: {
          totalItems: 1000,
          pendingItems: 25,
          processingItems: 3,
          completedItems: 950,
          failedItems: 22,
        },
      },
    });
  }),

  // REST API fallback handlers
  http.get('/api/health', () => {
    // REQUIREMENT: Mock health check endpoint
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }),

  // Handle unmatched GraphQL requests
  graphql.operation(({ operationName }) => {
    console.warn(`Unhandled GraphQL operation: ${operationName}`);
    return HttpResponse.json({
      data: null,
      errors: [{ message: `Unhandled operation: ${operationName}` }],
    });
  }),
];

// Create and export the server
export const server = setupServer(...handlers);
