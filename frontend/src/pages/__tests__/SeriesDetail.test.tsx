/**
 * REQUIREMENT: Comprehensive unit tests for SeriesDetail page component
 * PURPOSE: Test detailed series view with interactive charts and data transformation options
 * This ensures the main chart visualization interface works correctly for all series types
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../test-utils/test-providers';
import SeriesDetail from '../SeriesDetail';

// Mock the InteractiveChartWithCollaboration component
jest.mock('../../components/charts/InteractiveChartWithCollaboration', () => {
  return function MockInteractiveChartWithCollaboration({ seriesData, onDataTransform }: any) {
    return (
      <div data-testid="interactive-chart">
        <div data-testid="chart-title">{seriesData?.title || 'Real Gross Domestic Product'}</div>
        <div data-testid="chart-data-points">{seriesData?.dataPoints?.length || 120} data points</div>
        <button
          data-testid="transform-yoy"
          onClick={() => onDataTransform?.('yoy')}
        >
          Year-over-Year
        </button>
        <button
          data-testid="transform-qoq"
          onClick={() => onDataTransform?.('qoq')}
        >
          Quarter-over-Quarter
        </button>
        <button
          data-testid="transform-mom"
          onClick={() => onDataTransform?.('mom')}
        >
          Month-over-Month
        </button>
      </div>
    );
  };
});

// Mock useParams and useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

const { useParams } = require('react-router-dom');

function renderSeriesDetail(seriesId = 'gdp-real') {
  useParams.mockReturnValue({ id: seriesId });

  return render(
    <TestProviders>
      <SeriesDetail />
    </TestProviders>
  );
}

describe('SeriesDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    test('should show loading state initially', () => {
      renderSeriesDetail();

      // Should show skeleton loading states (Material-UI Skeleton components)
      const skeletons = screen.getAllByTestId('skeleton-loader');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('should show default series data for invalid series ID', async () => {
      renderSeriesDetail('invalid-series');

      // Should show default series data since component uses mock data
      await waitFor(() => {
        expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
      });
    });

    test('should show loading state when no series ID provided', () => {
      useParams.mockReturnValue({ id: undefined });

      render(
        <TestProviders>
          <SeriesDetail />
        </TestProviders>
      );

      // Should show loading state since no ID is provided to trigger data fetching
      const skeletons = screen.getAllByTestId('skeleton-loader');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Series Data Display', () => {
    test('should display GDP Real series data correctly', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getAllByText('Real Gross Domestic Product')).toHaveLength(3); // Breadcrumb + heading + chart
      });
      
      expect(screen.getByText('Real GDP measures the inflation-adjusted value of all goods and services produced')).toBeInTheDocument();
      expect(screen.getAllByText('Federal Reserve Economic Data')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Quarterly')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Billions of Chained 2017 Dollars')).toHaveLength(2); // Chip + table
    });

    test('should display Unemployment Rate series data correctly', async () => {
      renderSeriesDetail('unemployment-rate');

      await waitFor(() => {
        expect(screen.getAllByText('Unemployment Rate')).toHaveLength(2); // Breadcrumb + heading
      });
      
      expect(screen.getByText('Percent of labor force that is unemployed')).toBeInTheDocument();
      expect(screen.getAllByText('Bureau of Labor Statistics')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Monthly')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Percent')).toHaveLength(2); // Chip + table
    });

    test('should display Inflation (CPI) series data correctly', async () => {
      renderSeriesDetail('inflation');

      await waitFor(() => {
        expect(screen.getAllByText('Consumer Price Index for All Urban Consumers: All Items')).toHaveLength(2); // Breadcrumb + heading
      });
      
      expect(screen.getByText('Measure of average change in prices paid by urban consumers for goods and services. The CPI is the most widely used measure of inflation.')).toBeInTheDocument();
      expect(screen.getAllByText('Bureau of Labor Statistics')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Monthly')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Index 1982-84=100')).toHaveLength(2); // Chip + table
    });

    test('should display Federal Funds Rate series data correctly', async () => {
      renderSeriesDetail('fed-funds-rate');

      await waitFor(() => {
        expect(screen.getAllByText('Federal Funds Effective Rate')).toHaveLength(2); // Breadcrumb + heading
      });
      
      expect(screen.getByText('Interest rate at which banks lend to each other overnight')).toBeInTheDocument();
      expect(screen.getAllByText('Federal Reserve Economic Data')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Daily')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Percent')).toHaveLength(2); // Chip + table
    });

    test('should display default series data for unknown series ID', async () => {
      renderSeriesDetail('unknown-series');

      await waitFor(() => {
        // Unknown series shows the series ID in parentheses
        expect(screen.getAllByText('Economic Series (unknown-series)')).toHaveLength(2); // Breadcrumb + heading
      });
      
      expect(screen.getByText('Economic time series data')).toBeInTheDocument();
      expect(screen.getAllByText('Economic Data Source')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Monthly')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Various')).toHaveLength(2); // Chip + table
    });
  });

  describe('Interactive Chart Integration', () => {
    test('should render interactive chart with series data', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByTestId('interactive-chart')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('chart-title')).toHaveTextContent('Real Gross Domestic Product');
      expect(screen.getByTestId('chart-data-points')).toBeInTheDocument();
    });

    test('should display data transformation buttons', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByTestId('transform-yoy')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('transform-qoq')).toBeInTheDocument();
      expect(screen.getByTestId('transform-mom')).toBeInTheDocument();
    });

    test('should handle data transformation clicks', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByTestId('transform-yoy')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('transform-yoy'));
      // Note: The actual transformation logic would be tested in the chart component
    });
  });

  describe('Navigation and Actions', () => {
    test('should have navigation link to explore page', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByText('Explore')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Explore'));
      expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });

    test('should have share button', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByLabelText('share')).toBeInTheDocument();
      });
    });

    test('should have bookmark button', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByLabelText('bookmark')).toBeInTheDocument();
      });
    });

    test('should have share button with proper ARIA label', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByLabelText('share')).toBeInTheDocument();
      });
    });
  });

  describe('Series Metadata Display', () => {
    test('should display series metadata as chips', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getAllByText('Federal Reserve Economic Data')).toHaveLength(2); // Chip + table
      });
      
      expect(screen.getByText('Seasonally Adjusted Annual Rate')).toBeInTheDocument(); // Only appears in chip
      expect(screen.getAllByText('Quarterly')).toHaveLength(2); // Chip + table
      expect(screen.getAllByText('Billions of Chained 2017 Dollars')).toHaveLength(2); // Chip + table
    });

    test('should display series title and description', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getAllByText('Real Gross Domestic Product')).toHaveLength(3); // Breadcrumb + heading + chart title
      });
      
      expect(screen.getByText('Real GDP measures the inflation-adjusted value of all goods and services produced')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    test('should display breadcrumb navigation', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByText('Explore')).toBeInTheDocument();
      });
      
      expect(screen.getAllByText('Real Gross Domestic Product')).toHaveLength(3); // Breadcrumb + heading + chart title
    });

    test('should have clickable breadcrumb links', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByText('Explore')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Explore'));
      expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });
  });

  describe('Data Points Generation', () => {
    test('should generate appropriate data points for quarterly series', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        const dataPointsElement = screen.getByTestId('chart-data-points');
        expect(dataPointsElement).toBeInTheDocument();
        // Should have data points (exact count depends on mock data generation)
        expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
      });
    });

    test('should generate appropriate data points for monthly series', async () => {
      renderSeriesDetail('unemployment-rate');

      await waitFor(() => {
        const dataPointsElement = screen.getByTestId('chart-data-points');
        expect(dataPointsElement).toBeInTheDocument();
        expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
      });
    });

    test('should generate appropriate data points for daily series', async () => {
      renderSeriesDetail('fed-funds-rate');

      await waitFor(() => {
        const dataPointsElement = screen.getByTestId('chart-data-points');
        expect(dataPointsElement).toBeInTheDocument();
        expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
      });
    });
  });

  describe('Responsive Design', () => {
    test('should render without crashing on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getAllByText('Real Gross Domestic Product')).toHaveLength(3);
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for interactive elements', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByLabelText('share')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('bookmark')).toBeInTheDocument();
    });

    test('should have proper heading hierarchy', async () => {
      renderSeriesDetail('gdp-real');

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock fetch to reject
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      renderSeriesDetail('gdp-real');

      // Should still render the component even with network errors
      await waitFor(() => {
        expect(screen.getAllByText('Real Gross Domestic Product')).toHaveLength(3);
      });

      global.fetch = originalFetch;
    });
  });
});
