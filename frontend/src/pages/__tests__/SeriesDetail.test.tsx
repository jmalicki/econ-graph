/**
 * REQUIREMENT: Comprehensive unit tests for SeriesDetail page component
 * PURPOSE: Test detailed series view with interactive charts and data transformation options
 * This ensures the main chart visualization interface works correctly for all series types
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../test-utils/test-providers';
import SeriesDetail from '../SeriesDetail';

// Mock the InteractiveChartWithCollaboration component
jest.mock('../../components/charts/InteractiveChartWithCollaboration', () => {
  return function MockInteractiveChartWithCollaboration({ seriesData, onDataTransform }: any) {
    return (
      <div data-testid="interactive-chart">
        <div data-testid="chart-title">{seriesData?.title}</div>
        <div data-testid="chart-data-points">{seriesData?.dataPoints?.length || 0} data points</div>
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
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('should show default series data for invalid series ID', () => {
      renderSeriesDetail('invalid-series');

      // Should show default series data since component uses mock data
      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
    });

    test('should show default series data when no series ID provided', () => {
      useParams.mockReturnValue({ id: undefined });

      render(
        <TestProviders>
          <SeriesDetail />
        </TestProviders>
      );

      // Should show default series data since component uses mock data
      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
    });
  });

  describe('Series Data Display', () => {
    test('should display GDP Real series data correctly', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
      expect(screen.getByText('Real GDP measures the inflation-adjusted value of all goods and services produced')).toBeInTheDocument();
      expect(screen.getByText('Federal Reserve Economic Data')).toBeInTheDocument();
      expect(screen.getByText('Quarterly')).toBeInTheDocument();
      expect(screen.getByText('Billions of Chained 2017 Dollars')).toBeInTheDocument();
    });

    test('should display Unemployment Rate series data correctly', () => {
      renderSeriesDetail('unemployment-rate');

      expect(screen.getByText('Unemployment Rate')).toBeInTheDocument();
      expect(screen.getByText('Percent of labor force that is unemployed')).toBeInTheDocument();
      expect(screen.getByText('Bureau of Labor Statistics')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Percent')).toBeInTheDocument();
    });

    test('should display Inflation (CPI) series data correctly', () => {
      renderSeriesDetail('inflation');

      expect(screen.getByText('Consumer Price Index for All Urban Consumers: All Items')).toBeInTheDocument();
      expect(screen.getByText('Measure of average change in prices paid by urban consumers for goods and services. The CPI is the most widely used measure of inflation.')).toBeInTheDocument();
      expect(screen.getByText('Bureau of Labor Statistics')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Index 1982-84=100')).toBeInTheDocument();
    });

    test('should display Federal Funds Rate series data correctly', () => {
      renderSeriesDetail('fed-funds-rate');

      expect(screen.getByText('Federal Funds Effective Rate')).toBeInTheDocument();
      expect(screen.getByText('Interest rate at which banks lend to each other overnight')).toBeInTheDocument();
      expect(screen.getByText('Federal Reserve Economic Data')).toBeInTheDocument();
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Percent')).toBeInTheDocument();
    });

    test('should display default series data for unknown series ID', () => {
      renderSeriesDetail('unknown-series');

      expect(screen.getByText('Economic Series (unknown-series)')).toBeInTheDocument();
      expect(screen.getByText('Economic time series data')).toBeInTheDocument();
      expect(screen.getByText('Economic Data Source')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Various')).toBeInTheDocument();
    });
  });

  describe('Interactive Chart Integration', () => {
    test('should render interactive chart with series data', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByTestId('interactive-chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-title')).toHaveTextContent('Real Gross Domestic Product');
      expect(screen.getByTestId('chart-data-points')).toBeInTheDocument();
    });

    test('should display data transformation buttons', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByTestId('transform-yoy')).toBeInTheDocument();
      expect(screen.getByTestId('transform-qoq')).toBeInTheDocument();
      expect(screen.getByTestId('transform-mom')).toBeInTheDocument();
    });

    test('should handle data transformation clicks', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      expect(screen.getByTestId('transform-yoy')).toBeInTheDocument();

      await user.click(screen.getByTestId('transform-yoy'));
      // Note: The actual transformation logic would be tested in the chart component
    });
  });

  describe('Navigation and Actions', () => {
    test('should have back button that navigates to explore page', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Back to Explorer')).toBeInTheDocument();

      await user.click(screen.getByText('Back to Explorer'));
      expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });

    test('should have share button', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByLabelText('share')).toBeInTheDocument();
    });

    test('should have download button', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Download Data')).toBeInTheDocument();
    });

    test('should have bookmark button', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByLabelText('bookmark')).toBeInTheDocument();
    });

    test('should have info button', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Series Information')).toBeInTheDocument();
    });
  });

  describe('Series Metadata Display', () => {
    test('should display series metadata table', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Series Information')).toBeInTheDocument();
      expect(screen.getByText('Seasonal Adjustment')).toBeInTheDocument();
      expect(screen.getByText('Seasonally Adjusted Annual Rate')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });

    test('should display correct date ranges', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('1947-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-09-30')).toBeInTheDocument();
      expect(screen.getByText('2024-12-15')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    test('should display breadcrumb navigation', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
    });

    test('should have clickable breadcrumb links', async () => {
      const user = userEvent.setup();
      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Explore')).toBeInTheDocument();

      await user.click(screen.getByText('Explore'));
      expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });
  });

  describe('Data Points Generation', () => {
    test('should generate appropriate data points for quarterly series', () => {
      renderSeriesDetail('gdp-real');

      const dataPointsElement = screen.getByTestId('chart-data-points');
      expect(dataPointsElement).toBeInTheDocument();
      // Should have data points (exact count depends on mock data generation)
      expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
    });

    test('should generate appropriate data points for monthly series', () => {
      renderSeriesDetail('unemployment-rate');

      const dataPointsElement = screen.getByTestId('chart-data-points');
      expect(dataPointsElement).toBeInTheDocument();
      expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
    });

    test('should generate appropriate data points for daily series', () => {
      renderSeriesDetail('fed-funds-rate');

      const dataPointsElement = screen.getByTestId('chart-data-points');
      expect(dataPointsElement).toBeInTheDocument();
      expect(dataPointsElement.textContent).toMatch(/\d+ data points/);
    });
  });

  describe('Responsive Design', () => {
    test('should render without crashing on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderSeriesDetail('gdp-real');

      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for interactive elements', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByLabelText('share')).toBeInTheDocument();
      expect(screen.getByLabelText('bookmark')).toBeInTheDocument();
    });

    test('should have proper heading hierarchy', () => {
      renderSeriesDetail('gdp-real');

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', () => {
      // Mock fetch to reject
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      renderSeriesDetail('gdp-real');

      // Should still render the component even with network errors
      expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();

      global.fetch = originalFetch;
    });
  });
});
