// REQUIREMENT: Comprehensive test setup for React frontend testing
// PURPOSE: Configure testing environment with necessary polyfills and mocks
// This ensures all tests have access to required testing utilities and API mocks

// CRITICAL: Import polyfills FIRST before any other imports
require('./test-utils/polyfills');

import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill for fetch in test environment
// Mock GraphQL client directly instead of using MSW
import { mockSeriesData, mockDataSources, mockSearchResults, mockSuggestions } from './test-utils/mocks/data';

// Mock the hook functions directly - this is simpler and more reliable
jest.mock('./hooks/useSeriesData', () => ({
  useSeriesDetail: jest.fn((seriesId, options = {}) => {
    if (seriesId === 'test-series-1') {
      return {
        data: {
          id: 'test-series-1',
          title: 'Test Economic Series',
          description: 'A test series for unit testing',
          frequency: 'Monthly',
          units: 'Percent',
          startDate: '2020-01-01',
          endDate: '2024-12-01',
          isActive: true,
          source: { name: 'Test Source', description: 'Test data source' }
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: jest.fn(),
      };
    }
    if (seriesId === 'nonexistent-series') {
      return {
        data: null,
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: new Error('Series not found'),
        refetch: jest.fn(),
      };
    }
    if (!seriesId || options.enabled === false) {
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useSeriesData: jest.fn((seriesId, options = {}) => {
    if (seriesId && options.enabled !== false) {
      const dataPoints = Array.from({ length: 12 }, (_, index) => ({
        date: `2024-${String(index + 1).padStart(2, '0')}-01`,
        value: Math.random() * 100 + 50,
        revisionDate: `2024-${String(index + 1).padStart(2, '0')}-15`,
        isOriginalRelease: index % 3 === 0,
      }));
      return {
        data: dataPoints,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useSeriesSearch: jest.fn((options) => {
    if (options.query && options.query.length >= 2 && options.enabled !== false) {
      const mockResults = [
        { id: '1', title: 'GDP Growth Rate', description: 'Economic growth indicator', rank: 1, similarityScore: 0.95 },
        { id: '2', title: 'Unemployment Rate', description: 'Labor market indicator', rank: 2, similarityScore: 0.87 },
        { id: '3', title: 'Inflation Rate', description: 'Price level indicator', rank: 3, similarityScore: 0.79 }
      ];
      return {
        data: mockResults,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useSearchSuggestions: jest.fn((options) => {
    if (options.partialQuery && options.partialQuery.length >= 2 && options.enabled !== false) {
      const mockSuggestions = [
        { suggestion: 'unemployment', matchCount: 15, suggestionType: 'COMPLETION', confidence: 0.9 },
        { suggestion: 'inflation', matchCount: 12, suggestionType: 'COMPLETION', confidence: 0.8 }
      ];
      return {
        data: mockSuggestions,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useDataSources: jest.fn(() => {
    const mockSources = [
      { id: '1', name: 'Federal Reserve', description: 'US Federal Reserve Economic Data' },
      { id: '2', name: 'Bureau of Labor Statistics', description: 'US Labor Statistics' }
    ];
    return {
      data: mockSources,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useCrawlerStatus: jest.fn((options = {}) => {
    if (options.enabled !== false) {
      return {
        data: {
          crawlerStatus: {
            isRunning: true,
            lastRunAt: new Date().toISOString(),
            nextRunAt: new Date(Date.now() + 60000).toISOString(),
          },
          queueStatistics: {
            totalItems: 1000,
            pendingItems: 25,
            completedItems: 950,
          }
        },
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: jest.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: jest.fn(),
    };
  }),
  
  useDataTransformation: jest.fn((data, transformation = 'NONE') => {
    return data || [];
  }),
}));

// Mock Chart.js and related modules for component tests (they require canvas and have ESM issues)
jest.mock('chartjs-adapter-date-fns', () => ({}));

// Mock MUI date pickers to avoid version compatibility issues
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: any) => children,
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'date-picker',
      ...props
    }, children);
  },
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'line-chart',
      'data-chart-data': JSON.stringify(data),
      ...props
    }, 'Mock Line Chart');
  },
  Bar: ({ data, options, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'bar-chart', 
      'data-chart-data': JSON.stringify(data),
      ...props
    }, 'Mock Bar Chart');
  },
}));

// Mock ResizeObserver for chart components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for Material-UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage for components that use it
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Suppress console warnings during tests (optional)
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
