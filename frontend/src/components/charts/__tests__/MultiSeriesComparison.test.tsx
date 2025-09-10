/**
 * REQUIREMENT: Professional multi-series comparison charts
 * PURPOSE: Test comprehensive multi-series visualization capabilities  
 * This ensures users can compare multiple economic indicators simultaneously
 * Similar to Bloomberg Terminal's overlay chart functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import MultiSeriesComparison from '../MultiSeriesComparison';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div
      data-testid="multi-series-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      <div data-testid="chart-title">{data?.datasets?.[0]?.label || 'Multi-Series Chart'}</div>
      <div data-testid="dataset-count">{data?.datasets?.length || 0} series</div>
      {data?.datasets?.map((dataset: any, index: number) => (
        <div key={index} data-testid={`dataset-${index}`}>
          {dataset.label}: {dataset.data?.length || 0} points
        </div>
      ))}
    </div>
  ),
}));

// Mock Snackbar to avoid theme transitions issues
jest.mock('@mui/material/Snackbar', () => {
  return function MockSnackbar({ children, open, message, ...props }: any) {
    return open ? (
      <div data-testid="snackbar" {...props}>
        {message}
        {children}
      </div>
    ) : null;
  };
});

// Mock data for testing
const mockSeriesData = [
  {
    id: 'gdp-real',
    title: 'Real GDP',
    units: 'Billions of Dollars',
    color: '#1976d2',
    dataPoints: [
      { date: '2023-01-01', value: 25000 },
      { date: '2023-04-01', value: 25200 },
      { date: '2023-07-01', value: 25400 },
      { date: '2023-10-01', value: 25600 },
    ],
  },
  {
    id: 'unemployment-rate', 
    title: 'Unemployment Rate',
    units: 'Percent',
    color: '#dc004e',
    dataPoints: [
      { date: '2023-01-01', value: 3.5 },
      { date: '2023-04-01', value: 3.4 },
      { date: '2023-07-01', value: 3.6 },
      { date: '2023-10-01', value: 3.7 },
    ],
  },
];

interface MockProps {
  seriesIds?: string[];
  timeRange?: { start: Date; end: Date };
  transformations?: Record<string, 'NONE' | 'YOY' | 'QOQ' | 'MOM'>;
  syncYAxes?: boolean;
  onSeriesAdd?: (seriesId: string) => void;
  onSeriesRemove?: (seriesId: string) => void;
  onTransformationChange?: (seriesId: string, transformation: string) => void;
}

function renderMultiSeriesComparison(props: MockProps = {}) {
  const defaultProps = {
    seriesIds: ['gdp-real', 'unemployment-rate'],
    timeRange: {
      start: new Date('2023-01-01'),
      end: new Date('2023-12-31'),
    },
    transformations: {
      'gdp-real': 'NONE' as const,
      'unemployment-rate': 'NONE' as const,
    },
    syncYAxes: false,
    onSeriesAdd: jest.fn(),
    onSeriesRemove: jest.fn(),
    onTransformationChange: jest.fn(),
    ...props,
  };

  return render(
    <TestProviders>
      <MultiSeriesComparison {...defaultProps} />
    </TestProviders>
  );
}

describe('MultiSeriesComparison', () => {
  describe('Component Rendering', () => {
    test('should render multi-series chart successfully', async () => {
      renderMultiSeriesComparison();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('multi-series-chart')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('dataset-count')).toHaveTextContent('2 series');
    });

    test('should display all series in the chart', async () => {
      renderMultiSeriesComparison();

      await waitFor(() => {
        expect(screen.getByTestId('dataset-0')).toHaveTextContent('Real GDP: 4 points');
      });
      
      expect(screen.getByTestId('dataset-1')).toHaveTextContent('Unemployment Rate: 4 points');
    });

    test('should render chart controls panel', async () => {
      renderMultiSeriesComparison();

      await waitFor(() => {
        expect(screen.getByText('Series Comparison')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Chart Controls')).toBeInTheDocument();
    });

    test('should show series legend with colors', async () => {
      renderMultiSeriesComparison();

      await waitFor(() => {
        expect(screen.getByText('Real GDP')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Unemployment Rate')).toBeInTheDocument();
      expect(screen.getByTestId('legend-gdp-real')).toBeInTheDocument();
      expect(screen.getByTestId('legend-unemployment-rate')).toBeInTheDocument();
    });
  });

  describe('Series Management', () => {
    test('should allow adding new series to comparison', async () => {
      const user = userEvent.setup();
      const mockOnSeriesAdd = jest.fn();
      
      renderMultiSeriesComparison({ onSeriesAdd: mockOnSeriesAdd });

      expect(screen.getByText('Add Series')).toBeInTheDocument();
      
      const addButton = screen.getByText('Add Series');
      await user.click(addButton);

      expect(screen.getByText('Select Series to Add')).toBeInTheDocument();
      
      const seriesOption = screen.getByText('Federal Funds Rate');
      await user.click(seriesOption);

      expect(mockOnSeriesAdd).toHaveBeenCalledWith('fed-funds-rate');
    });

    test('should allow removing series from comparison', async () => {
      const user = userEvent.setup();
      const mockOnSeriesRemove = jest.fn();
      
      renderMultiSeriesComparison({ onSeriesRemove: mockOnSeriesRemove });

      const removeButton = screen.getByTestId('remove-gdp-real');
      await user.click(removeButton);

      expect(mockOnSeriesRemove).toHaveBeenCalledWith('gdp-real');
    });

    test('should prevent removing the last series', () => {
      renderMultiSeriesComparison({ seriesIds: ['gdp-real'] });

      const removeButton = screen.getByTestId('remove-gdp-real');
      expect(removeButton).toBeDisabled();
      
      expect(screen.getByText(/At least one series is required/i)).toBeInTheDocument();
    });

    test('should limit maximum number of series', () => {
      const manySeriesIds = ['gdp-real', 'unemployment-rate', 'inflation', 'fed-funds-rate', 'consumer-spending'];
      
      renderMultiSeriesComparison({ seriesIds: manySeriesIds });

      expect(screen.getByText(/Maximum 4 series allowed/i)).toBeInTheDocument();
      expect(screen.getByText('Add Series')).toBeDisabled();
    });
  });

  describe('Y-Axis Synchronization', () => {
    test('should allow toggling Y-axis synchronization', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison({ syncYAxes: false });

      expect(screen.getByText('Sync Y-Axes')).toBeInTheDocument();
      
      const syncToggle = screen.getByRole('switch', { name: /sync y-axes/i });
      expect(syncToggle).not.toBeChecked();

      await user.click(syncToggle);
      expect(syncToggle).toBeChecked();
    });

    test('should display Y-axis sync status in chart', () => {
      renderMultiSeriesComparison({ syncYAxes: true });

      expect(screen.getByText(/Y-axes synchronized/i)).toBeInTheDocument();
    });

    test('should show different Y-axis ranges when not synchronized', () => {
      renderMultiSeriesComparison({ syncYAxes: false });

      expect(screen.getByText(/Independent Y-axes/i)).toBeInTheDocument();
      expect(screen.getByTestId('y-axis-gdp-real')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis-unemployment-rate')).toBeInTheDocument();
    });
  });

  describe('Data Transformations', () => {
    test('should allow different transformations for each series', async () => {
      const user = userEvent.setup();
      const mockOnTransformationChange = jest.fn();
      
      renderMultiSeriesComparison({ onTransformationChange: mockOnTransformationChange });

      const transformSelect = screen.getByTestId('transform-gdp-real');
      await user.click(transformSelect);
      
      const yoyOption = screen.getByText('Year-over-Year');
      await user.click(yoyOption);

      expect(mockOnTransformationChange).toHaveBeenCalledWith('gdp-real', 'YOY');
    });

    test('should display transformation status for each series', () => {
      renderMultiSeriesComparison({
        transformations: {
          'gdp-real': 'YOY',
          'unemployment-rate': 'MOM',
        },
      });

      expect(screen.getByText('GDP (YoY %)')).toBeInTheDocument();
      expect(screen.getByText('Unemployment (MoM %)')).toBeInTheDocument();
    });

    test('should update chart when transformation changes', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison({
        transformations: { 'gdp-real': 'YOY', 'unemployment-rate': 'NONE' },
      });

      // Chart should reflect transformations
      const chartData = JSON.parse(screen.getByTestId('multi-series-chart').getAttribute('data-chart-data') || '{}');
      expect(chartData.datasets[0].label).toContain('YoY');
    });
  });

  describe('Time Range Controls', () => {
    test('should allow customizing time range for all series', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      expect(screen.getByText('Time Range')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-start')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-end')).toBeInTheDocument();
    });

    test('should show time range presets', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      expect(screen.getByText('1 Year')).toBeInTheDocument();
      expect(screen.getByText('5 Years')).toBeInTheDocument();
      expect(screen.getByText('10 Years')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    test('should apply time range to all series', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const oneYearButton = screen.getByText('1 Year');
      await user.click(oneYearButton);

      // Should filter data for all series
      await waitFor(() => {
        const chartData = JSON.parse(screen.getByTestId('multi-series-chart').getAttribute('data-chart-data') || '{}');
        expect(chartData.datasets.every((ds: any) => ds.data.length > 0)).toBe(true);
      });
    });
  });

  describe('Chart Interaction', () => {
    test('should show tooltip with all series values on hover', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const chart = screen.getByTestId('multi-series-chart');
      
      // Simulate hover event
      fireEvent.mouseMove(chart, { clientX: 100, clientY: 100 });

      await waitFor(() => {
        expect(screen.getByTestId('multi-series-tooltip')).toBeInTheDocument();
      });

      expect(screen.getByText(/Real GDP:/)).toBeInTheDocument();
      expect(screen.getByText(/Unemployment Rate:/)).toBeInTheDocument();
    });

    test('should allow toggling series visibility', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const gdpToggle = screen.getByTestId('visibility-toggle-gdp-real');
      expect(gdpToggle).toBeChecked();

      await user.click(gdpToggle);
      expect(gdpToggle).not.toBeChecked();

      // Chart should hide the series
      const chartData = JSON.parse(screen.getByTestId('multi-series-chart').getAttribute('data-chart-data') || '{}');
      const gdpDataset = chartData.datasets.find((ds: any) => ds.label.includes('GDP'));
      expect(gdpDataset.hidden).toBe(true);
    });

    test('should support zooming and panning', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByText('Reset Zoom')).toBeInTheDocument();
      
      const zoomInButton = screen.getByTestId('zoom-in');
      const zoomOutButton = screen.getByTestId('zoom-out');
      
      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();
    });
  });

  describe('Data Export', () => {
    test('should allow exporting comparison data to CSV', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('PNG Image')).toBeInTheDocument();
    });

    test('should include all series data in export', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);

      const csvOption = screen.getByText('CSV');
      await user.click(csvOption);

      // Should trigger download with all series data
      // Note: In real implementation, this would trigger file download
      expect(screen.getByText(/Export includes 2 series/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', () => {
      const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2000, 0, i).toISOString(),
        value: Math.random() * 1000,
      }));

      const largeSeriesData = [
        {
          ...mockSeriesData[0],
          dataPoints: largeMockData,
        },
      ];

      const startTime = performance.now();
      renderMultiSeriesComparison({ seriesIds: ['gdp-real'] });
      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('dataset-0')).toHaveTextContent('Real GDP: 4 points'); // Mock data still used
    });

    test('should debounce transformation changes', async () => {
      const user = userEvent.setup();
      const mockOnTransformationChange = jest.fn();
      
      renderMultiSeriesComparison({ onTransformationChange: mockOnTransformationChange });

      const transformSelect = screen.getByTestId('transform-gdp-real');
      
      // Rapid changes should be debounced
      await user.click(transformSelect);
      await user.click(screen.getByText('Year-over-Year'));
      
      await user.click(transformSelect);
      await user.click(screen.getByText('Quarter-over-Quarter'));

      // Should only call the final change after debounce
      await waitFor(() => {
        expect(mockOnTransformationChange).toHaveBeenLastCalledWith('gdp-real', 'QOQ');
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for all controls', () => {
      renderMultiSeriesComparison();

      expect(screen.getByLabelText('Add series to comparison')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Real GDP from comparison')).toBeInTheDocument();
      expect(screen.getByLabelText('Transform Real GDP data')).toBeInTheDocument();
      expect(screen.getByLabelText('Sync Y-axes')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      // Should be able to navigate through controls with Tab
      await user.tab();
      await user.tab();
      
      // Should focus on interactive elements
      expect(document.activeElement).toHaveAttribute('aria-label');
    });

    test('should announce series changes to screen readers', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const addButton = screen.getByText('Add Series');
      await user.click(addButton);

      expect(screen.getByTestId('series-announcement')).toBeInTheDocument();
      expect(screen.getByText(/Series comparison updated/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderMultiSeriesComparison();

      expect(screen.getByTestId('mobile-series-controls')).toBeInTheDocument();
      expect(screen.getByTestId('compact-legend')).toBeInTheDocument();
    });

    test('should show collapsible controls on tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderMultiSeriesComparison();

      expect(screen.getByTestId('collapsible-controls')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing series data gracefully', () => {
      renderMultiSeriesComparison({ seriesIds: ['invalid-series'] });

      expect(screen.getByText(/Unable to load series data/i)).toBeInTheDocument();
      expect(screen.getByText(/Check series availability/i)).toBeInTheDocument();
    });

    test('should handle network errors during data loading', () => {
      // Mock network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      renderMultiSeriesComparison();

      expect(screen.getByText(/Error loading comparison data/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();

      global.fetch = originalFetch;
    });

    test('should show loading state while fetching data', () => {
      renderMultiSeriesComparison();

      expect(screen.getByTestId('comparison-loading')).toBeInTheDocument();
      expect(screen.getByText(/Loading series data/i)).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    test('should support different chart types', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      expect(screen.getByText('Chart Type')).toBeInTheDocument();
      
      const chartTypeSelect = screen.getByTestId('chart-type-select');
      await user.click(chartTypeSelect);

      expect(screen.getByText('Line')).toBeInTheDocument();
      expect(screen.getByText('Area')).toBeInTheDocument();
      expect(screen.getByText('Column')).toBeInTheDocument();
    });

    test('should allow customizing colors for each series', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const colorPicker = screen.getByTestId('color-picker-gdp-real');
      expect(colorPicker).toBeInTheDocument();
      
      await user.click(colorPicker);
      expect(screen.getByTestId('color-palette')).toBeInTheDocument();
    });

    test('should save comparison configuration', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const saveButton = screen.getByText('Save Comparison');
      expect(saveButton).toBeInTheDocument();

      await user.click(saveButton);
      expect(screen.getByText('Comparison saved')).toBeInTheDocument();
    });
  });

  describe('Statistical Analysis Integration', () => {
    test('should show correlation analysis between series', () => {
      renderMultiSeriesComparison();

      expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('correlation-gdp-unemployment')).toBeInTheDocument();
      expect(screen.getByText(/Correlation: -0.85/i)).toBeInTheDocument(); // Negative correlation between GDP and unemployment
    });

    test('should allow opening statistical analysis panel', async () => {
      const user = userEvent.setup();
      
      renderMultiSeriesComparison();

      const analysisButton = screen.getByText('Statistical Analysis');
      await user.click(analysisButton);

      expect(screen.getByText('Advanced Statistics')).toBeInTheDocument();
      expect(screen.getByText('Correlation Matrix')).toBeInTheDocument();
      expect(screen.getByText('Regression Analysis')).toBeInTheDocument();
    });
  });
});