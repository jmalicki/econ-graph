/**
 * REQUIREMENT: Tests for Performance Dashboard component
 * PURPOSE: Ensure real-time performance monitoring works correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../../../test-utils/test-providers';
import PerformanceDashboard from '../PerformanceDashboard';

describe('PerformanceDashboard', () => {
  test('should render performance metrics successfully', () => {
    render(
      <TestProviders>
        <PerformanceDashboard />
      </TestProviders>
    );

    expect(screen.getByTestId('response-time-value')).toBeInTheDocument();
    expect(screen.getByTestId('cache-hit-rate-value')).toBeInTheDocument();
    expect(screen.getByTestId('memory-usage-value')).toBeInTheDocument();
    expect(screen.getByTestId('uptime-value')).toBeInTheDocument();
  });

  test('should display performance alerts', () => {
    render(
      <TestProviders>
        <PerformanceDashboard />
      </TestProviders>
    );

    expect(screen.getByTestId('performance-alerts')).toBeInTheDocument();
    expect(screen.getByText(/Slow response detected/)).toBeInTheDocument();
  });

  test('should show endpoint performance table', () => {
    render(
      <TestProviders>
        <PerformanceDashboard />
      </TestProviders>
    );

    expect(screen.getByTestId('endpoint-performance-table')).toBeInTheDocument();
    expect(screen.getByText('Slowest Endpoints')).toBeInTheDocument();
    expect(screen.getByTestId('endpoint-row-0')).toBeInTheDocument();
  });
});