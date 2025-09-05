// REQUIREMENT: Comprehensive unit tests for InteractiveChart component
// PURPOSE: Test chart rendering, interactions, and data transformations
// This ensures the chart component works correctly with various data scenarios

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import { InteractiveChart } from '../InteractiveChart';
import { createMockDataPoints } from '../../../test-utils/mocks/data';

// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div 
      data-testid="line-chart" 
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      Mock Line Chart
    </div>
  ),
}));

const defaultProps = {
  seriesId: 'test-series-1',
  title: 'Test Economic Series',
  data: createMockDataPoints(12, 100),
  loading: false,
  error: null,
};

function renderInteractiveChart(props = {}) {
  const combinedProps = { ...defaultProps, ...props };
  return render(
    <TestProviders>
      <InteractiveChart {...combinedProps} />
    </TestProviders>
  );
}

describe('InteractiveChart', () => {
  test('should render chart with data successfully', () => {
    // REQUIREMENT: Test basic chart rendering with data
    // PURPOSE: Verify that chart displays when provided with valid data
    // This ensures the core functionality of displaying economic time series
    
    renderInteractiveChart();
    
    // Verify chart is rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Verify title is displayed
    expect(screen.getByText('Test Economic Series')).toBeInTheDocument();
    
    // Verify data is passed to chart
    const chartElement = screen.getByTestId('line-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    expect(chartData.datasets).toBeDefined();
    expect(chartData.datasets[0].data.length).toBe(12);
  });

  test('should display loading state', () => {
    // REQUIREMENT: Test loading state display
    // PURPOSE: Verify that users see appropriate feedback while data loads
    // This ensures good user experience during data fetching
    
    renderInteractiveChart({ loading: true, data: [] });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  test('should display error state', () => {
    // REQUIREMENT: Test error state display
    // PURPOSE: Verify that errors are communicated clearly to users
    // This ensures robust error handling in the UI
    
    const errorMessage = 'Failed to load chart data';
    renderInteractiveChart({ 
      error: new Error(errorMessage), 
      data: [] 
    });
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  test('should display empty state when no data', () => {
    // REQUIREMENT: Test empty data state
    // PURPOSE: Verify appropriate message when no data points are available
    // This handles edge cases where series might not have data
    
    renderInteractiveChart({ data: [] });
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  test('should handle date range selection', async () => {
    // REQUIREMENT: Test date range filtering functionality
    // PURPOSE: Verify that users can filter chart data by date range
    // This supports focused analysis of specific time periods
    
    const user = userEvent.setup();
    renderInteractiveChart();
    
    // Find date range controls
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    // Set date range
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-06-30');
    
    // Verify date inputs are updated
    expect(startDateInput).toHaveValue('2024-01-01');
    expect(endDateInput).toHaveValue('2024-06-30');
  });

  test('should handle data transformation selection', async () => {
    // REQUIREMENT: Test data transformation options
    // PURPOSE: Verify that users can switch between different data transformations
    // This supports various analytical perspectives (levels, YoY, etc.)
    
    const user = userEvent.setup();
    renderInteractiveChart();
    
    // Find transformation selector
    const transformationSelect = screen.getByLabelText(/transformation/i);
    
    // Change to Year-over-Year
    await user.click(transformationSelect);
    const yoyOption = screen.getByText(/year over year/i);
    await user.click(yoyOption);
    
    // Verify transformation is applied
    await waitFor(() => {
      expect(screen.getByDisplayValue(/year over year/i)).toBeInTheDocument();
    });
  });

  test('should handle original vs revised data toggle', async () => {
    // REQUIREMENT: Test original vs revised data filtering
    // PURPOSE: Verify that users can choose between original releases and revisions
    // This supports analysis of data revision patterns
    
    const user = userEvent.setup();
    renderInteractiveChart();
    
    // Find original data toggle
    const originalOnlyToggle = screen.getByLabelText(/original releases only/i);
    
    // Toggle original data only
    await user.click(originalOnlyToggle);
    
    // Verify toggle state
    expect(originalOnlyToggle).toBeChecked();
  });

  test('should display chart with proper configuration', () => {
    // REQUIREMENT: Test chart configuration and options
    // PURPOSE: Verify that chart is configured with appropriate settings
    // This ensures proper display of economic time series data
    
    renderInteractiveChart();
    
    const chartElement = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    // Verify responsive configuration
    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.maintainAspectRatio).toBe(false);
    
    // Verify scales configuration
    expect(chartOptions.scales).toBeDefined();
    expect(chartOptions.scales.x).toBeDefined();
    expect(chartOptions.scales.y).toBeDefined();
    
    // Verify interaction configuration
    expect(chartOptions.interaction).toBeDefined();
    expect(chartOptions.plugins.tooltip).toBeDefined();
  });

  test('should handle data with null values', () => {
    // REQUIREMENT: Test handling of missing data points
    // PURPOSE: Verify that charts gracefully handle gaps in time series data
    // This ensures robust display when data points are missing
    
    const dataWithNulls = createMockDataPoints(5, 100).map((point, index) => ({
      ...point,
      value: index === 2 ? null : point.value, // Make middle point null
    }));
    
    renderInteractiveChart({ data: dataWithNulls });
    
    // Chart should still render
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Verify data is passed correctly
    const chartElement = screen.getByTestId('line-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    expect(chartData.datasets[0].data).toBeDefined();
  });

  test('should display data point count information', () => {
    // REQUIREMENT: Test data point count display
    // PURPOSE: Verify that users can see how many data points are displayed
    // This provides context about the data being visualized
    
    const testData = createMockDataPoints(25, 100);
    renderInteractiveChart({ data: testData });
    
    // Should show data point count
    expect(screen.getByText(/25 data points/i)).toBeInTheDocument();
  });

  test('should handle very large datasets', () => {
    // REQUIREMENT: Test performance with large datasets
    // PURPOSE: Verify that chart can handle large amounts of time series data
    // This ensures scalability for long-running economic series
    
    const largeDataset = createMockDataPoints(1000, 100);
    renderInteractiveChart({ data: largeDataset });
    
    // Chart should still render efficiently
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText(/1000 data points/i)).toBeInTheDocument();
  });

  test('should show revision indicators when available', () => {
    // REQUIREMENT: Test revision indicator display
    // PURPOSE: Verify that data revisions are visually distinguished
    // This helps users understand data quality and revision history
    
    const dataWithRevisions = createMockDataPoints(5, 100).map((point, index) => ({
      ...point,
      isOriginalRelease: index % 2 === 0, // Alternate original/revised
    }));
    
    renderInteractiveChart({ data: dataWithRevisions });
    
    // Should indicate presence of revisions
    expect(screen.getByText(/includes revisions/i)).toBeInTheDocument();
  });

  test('should handle frequency-specific formatting', () => {
    // REQUIREMENT: Test frequency-aware date formatting
    // PURPOSE: Verify that dates are formatted appropriately for different frequencies
    // This ensures proper display of monthly, quarterly, and annual data
    
    renderInteractiveChart({ 
      frequency: 'Monthly',
      data: createMockDataPoints(12, 100)
    });
    
    const chartElement = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    // Should have appropriate time scale configuration
    expect(chartOptions.scales.x.type).toBe('time');
  });

  test('should export chart data functionality', async () => {
    // REQUIREMENT: Test data export functionality
    // PURPOSE: Verify that users can export chart data for external analysis
    // This supports data portability and further analysis
    
    const user = userEvent.setup();
    renderInteractiveChart();
    
    // Find export button
    const exportButton = screen.getByText(/export/i);
    await user.click(exportButton);
    
    // Should trigger export functionality
    // Note: Actual file download testing would require more complex setup
    expect(exportButton).toBeInTheDocument();
  });

  test('should handle chart resize events', () => {
    // REQUIREMENT: Test responsive chart behavior
    // PURPOSE: Verify that chart adapts to container size changes
    // This ensures good display on different screen sizes
    
    renderInteractiveChart();
    
    const chartElement = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    // Should be configured for responsiveness
    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.maintainAspectRatio).toBe(false);
  });

  test('should show appropriate units in axis labels', () => {
    // REQUIREMENT: Test unit display in chart axes
    // PURPOSE: Verify that data units are clearly displayed
    // This ensures users understand what the data represents
    
    renderInteractiveChart({ 
      units: 'Billions of Dollars',
      data: createMockDataPoints(10, 100)
    });
    
    // Should display units in chart configuration
    const chartElement = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    expect(chartOptions.scales.y.title.text).toContain('Billions of Dollars');
  });

  test('should handle accessibility requirements', () => {
    // REQUIREMENT: Test accessibility features
    // PURPOSE: Verify that chart is accessible to users with disabilities
    // This ensures compliance with accessibility standards
    
    renderInteractiveChart();
    
    // Should have proper ARIA labels and roles
    const chartContainer = screen.getByRole('img', { name: /chart/i });
    expect(chartContainer).toBeInTheDocument();
    
    // Should have keyboard navigation support
    expect(chartContainer).toHaveAttribute('tabindex', '0');
  });

  test('should display chart legend when multiple series', () => {
    // REQUIREMENT: Test legend display for multiple data series
    // PURPOSE: Verify that legend helps distinguish between different data series
    // This supports comparison of original vs revised data
    
    const dataWithMultipleSeries = createMockDataPoints(10, 100);
    renderInteractiveChart({ 
      data: dataWithMultipleSeries,
      showOriginalAndRevised: true 
    });
    
    const chartElement = screen.getByTestId('line-chart');
    const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
    
    // Should have legend configuration
    expect(chartOptions.plugins.legend.display).toBe(true);
  });
});
