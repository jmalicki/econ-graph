// REQUIREMENT: Comprehensive test setup for React frontend testing
// PURPOSE: Configure testing environment with necessary polyfills and mocks
// This ensures all tests have access to required testing utilities and API mocks

// Polyfills for Node.js test environment (must be first!)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import '@testing-library/jest-dom';
// import { server } from './test-utils/mocks/server';
import 'whatwg-fetch'; // Polyfill for fetch in test environment

// Establish API mocking before all tests
beforeAll(() => {
  // REQUIREMENT: Mock GraphQL API responses for isolated testing
  // Start the Mock Service Worker server
  // server.listen({
  //   onUnhandledRequest: 'warn', // Warn about unhandled requests during development
  // });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  // server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  // server.close();
});

// Mock Chart.js for component tests (it requires canvas)
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
