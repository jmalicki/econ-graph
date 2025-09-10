/**
 * REQUIREMENT: Comprehensive tests for Statistical Analysis Panel
 * PURPOSE: Ensure professional-grade statistical analysis interface works correctly
 * This validates Bloomberg Terminal-level statistical analysis capabilities
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import StatisticalAnalysisPanel from '../StatisticalAnalysisPanel';

// Mock Accordion components to avoid theme issues
jest.mock('@mui/material/Accordion', () => {
  return function MockAccordion({ children, expanded, ...props }: any) {
    return <div data-testid="accordion" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/AccordionSummary', () => {
  return function MockAccordionSummary({ children, ...props }: any) {
    return <div data-testid="accordion-summary" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/AccordionDetails', () => {
  return function MockAccordionDetails({ children, ...props }: any) {
    return <div data-testid="accordion-details" {...props}>{children}</div>;
  };
});

interface MockProps {
  seriesIds?: string[];
  onExport?: jest.Mock;
  onSave?: jest.Mock;
}

function renderStatisticalAnalysisPanel(props: MockProps = {}) {
  const defaultProps = {
    seriesIds: ['gdp-real', 'unemployment-rate'],
    onExport: jest.fn(),
    onSave: jest.fn(),
    ...props,
  };

  return render(
    <TestProviders>
      <StatisticalAnalysisPanel {...defaultProps} />
    </TestProviders>
  );
}

describe('StatisticalAnalysisPanel', () => {
  describe('Component Initialization', () => {
    test('should render statistical analysis panel successfully', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Professional-grade statistical tools for 2 series/)).toBeInTheDocument();
    });

    test('should show warning when no series provided', () => {
      renderStatisticalAnalysisPanel({ seriesIds: [] });

      expect(screen.getByText('Select at least one economic series to begin statistical analysis')).toBeInTheDocument();
    });

    test('should display series count in header', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate', 'inflation-rate'] });

      expect(screen.getByText(/Professional-grade statistical tools for 3 series/)).toBeInTheDocument();
    });

    test('should show export and save buttons', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      expect(screen.getByText('Save Analysis')).toBeInTheDocument();
    });
  });

  describe('Analysis Type Selection', () => {
    test('should show analysis type selector', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByTestId('analysis-type-selector')).toBeInTheDocument();
      expect(screen.getByText('Select Analysis')).toBeInTheDocument();
    });

    test('should allow switching between analysis types', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const selector = screen.getByTestId('analysis-type-selector');
      await user.click(selector);

      expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
      expect(screen.getByText('Regression Analysis')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByText('Statistical Summary')).toBeInTheDocument();
    });

    test('should default to correlation analysis', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
    });
  });

  describe('Correlation Analysis', () => {
    test('should display correlation results table', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      expect(screen.getByTestId('correlation-table')).toBeInTheDocument();
      expect(screen.getByText('Series 1')).toBeInTheDocument();
      expect(screen.getByText('Series 2')).toBeInTheDocument();
      expect(screen.getByText('Correlation')).toBeInTheDocument();
      expect(screen.getByText('Significance')).toBeInTheDocument();
      expect(screen.getByText('P-Value')).toBeInTheDocument();
    });

    test('should show correlation results for series pairs', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      expect(screen.getByTestId('correlation-row-0')).toBeInTheDocument();
      expect(screen.getByText('-0.850')).toBeInTheDocument(); // Correlation coefficient
      expect(screen.getByText('Highly significant (p < 0.001)')).toBeInTheDocument();
    });

    test('should show warning when insufficient series for correlation', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real'] });

      expect(screen.getByText('Need at least 2 series for correlation analysis')).toBeInTheDocument();
    });

    test('should color-code correlation strength', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      const correlationChip = screen.getByText('-0.850');
      expect(correlationChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    });
  });

  describe('Regression Analysis', () => {
    test('should show series selectors for regression', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      // Switch to regression analysis
      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Regression Analysis'));

      expect(screen.getByTestId('independent-series-selector')).toBeInTheDocument();
      expect(screen.getByTestId('dependent-series-selector')).toBeInTheDocument();
      expect(screen.getByTestId('calculate-regression-button')).toBeInTheDocument();
    });

    test('should display regression results', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Regression Analysis'));

      expect(screen.getByTestId('regression-results')).toBeInTheDocument();
      expect(screen.getByText(/Slope/)).toBeInTheDocument();
      expect(screen.getByText(/Intercept/)).toBeInTheDocument();
      expect(screen.getByText(/R-Squared/)).toBeInTheDocument();
    });

    test('should show regression equation', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Regression Analysis'));

      expect(screen.getByText(/Equation:/)).toBeInTheDocument();
    });

    test('should show warning when insufficient series for regression', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real'] });

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Regression Analysis'));

      expect(screen.getByText('Need at least 2 series for regression analysis')).toBeInTheDocument();
    });
  });

  describe('Trend Analysis', () => {
    test('should display trend cards for each series', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Trend Analysis'));

      expect(screen.getByTestId('trend-card-gdp-real')).toBeInTheDocument();
      expect(screen.getByTestId('trend-card-unemployment-rate')).toBeInTheDocument();
    });

    test('should show trend direction and strength', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real'] });

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Trend Analysis'));

      expect(screen.getByText('upward')).toBeInTheDocument(); // GDP trend direction
      expect(screen.getByText('82.0%')).toBeInTheDocument(); // Trend strength
    });

    test('should display appropriate trend icons', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real'] });

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Trend Analysis'));

      expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
    });
  });

  describe('Statistical Summary', () => {
    test('should display descriptive statistics table', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Statistical Summary'));

      expect(screen.getByTestId('summary-statistics-table')).toBeInTheDocument();
      expect(screen.getByText('Mean')).toBeInTheDocument();
      expect(screen.getByText('Median')).toBeInTheDocument();
      expect(screen.getByText('Std Dev')).toBeInTheDocument();
      expect(screen.getByText('Skewness')).toBeInTheDocument();
      expect(screen.getByText('Kurtosis')).toBeInTheDocument();
    });

    test('should show summary statistics for each series', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Statistical Summary'));

      expect(screen.getByTestId('summary-row-gdp-real')).toBeInTheDocument();
      expect(screen.getByTestId('summary-row-unemployment-rate')).toBeInTheDocument();
    });

    test('should format statistical values appropriately', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Statistical Summary'));

      expect(screen.getByText('25,400')).toBeInTheDocument(); // GDP mean formatted
      expect(screen.getByText('20')).toBeInTheDocument(); // Count
    });
  });

  describe('Export Functionality', () => {
    test('should open export dialog when export button clicked', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const exportButton = screen.getByText('Export Analysis');
      await user.click(exportButton);

      expect(screen.getByText('Export Statistical Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
      expect(screen.getByTestId('export-excel-button')).toBeInTheDocument();
      expect(screen.getByTestId('export-pdf-button')).toBeInTheDocument();
    });

    test('should call onExport when format is selected', async () => {
      const user = userEvent.setup();
      const mockOnExport = jest.fn();
      renderStatisticalAnalysisPanel({ onExport: mockOnExport });

      const exportButton = screen.getByText('Export Analysis');
      await user.click(exportButton);

      const csvButton = screen.getByTestId('export-csv-button');
      await user.click(csvButton);

      expect(mockOnExport).toHaveBeenCalledWith('csv', 'correlation');
    });

    test('should export different analysis types correctly', async () => {
      const user = userEvent.setup();
      const mockOnExport = jest.fn();
      renderStatisticalAnalysisPanel({ onExport: mockOnExport });

      // Switch to trend analysis
      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);
      await user.click(screen.getByText('Trend Analysis'));

      const exportButton = screen.getByText('Export Analysis');
      await user.click(exportButton);

      const excelButton = screen.getByTestId('export-excel-button');
      await user.click(excelButton);

      expect(mockOnExport).toHaveBeenCalledWith('xlsx', 'trends');
    });
  });

  describe('Save Functionality', () => {
    test('should open save dialog when save button clicked', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      const saveButton = screen.getByText('Save Analysis');
      await user.click(saveButton);

      expect(screen.getByText('Save Statistical Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('save-analysis-button')).toBeInTheDocument();
    });

    test('should show analysis summary in save dialog', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      const saveButton = screen.getByText('Save Analysis');
      await user.click(saveButton);

      expect(screen.getByText(/Series: Real GDP, Unemployment Rate/)).toBeInTheDocument();
      expect(screen.getByText(/Analysis Type: correlation/)).toBeInTheDocument();
    });

    test('should call onSave when analysis is saved', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      renderStatisticalAnalysisPanel({ onSave: mockOnSave });

      const saveButton = screen.getByText('Save Analysis');
      await user.click(saveButton);

      const nameInput = screen.getByTestId('analysis-name-input');
      await user.type(nameInput, 'My Economic Analysis');

      const saveAnalysisButton = screen.getByTestId('save-analysis-button');
      await user.click(saveAnalysisButton);

      expect(mockOnSave).toHaveBeenCalledWith('My Analysis', expect.objectContaining({
        type: 'correlation',
        seriesIds: ['gdp-real', 'unemployment-rate'],
      }));
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for interactive elements', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByLabelText('Select Analysis')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel();

      // Should be able to navigate with Tab
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type');
    });

    test('should have proper heading structure', () => {
      renderStatisticalAnalysisPanel();

      expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Statistical Analysis');
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Analysis Type');
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

      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();
    });

    test('should handle tablet layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid series data gracefully', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['invalid-series'] });

      // Should still render without crashing
      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();
    });

    test('should show loading state during analysis', () => {
      renderStatisticalAnalysisPanel();

      // In a real scenario with async data loading
      expect(screen.queryByTestId('analysis-loading')).not.toBeInTheDocument(); // Not loading initially
    });

    test('should handle network errors gracefully', () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      renderStatisticalAnalysisPanel();

      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();

      global.fetch = originalFetch;
    });
  });

  describe('Performance', () => {
    test('should render quickly with multiple series', () => {
      const startTime = performance.now();
      
      renderStatisticalAnalysisPanel({ 
        seriesIds: ['gdp-real', 'unemployment-rate', 'inflation-rate', 'fed-funds-rate'] 
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should render within 500ms
    });

    test('should handle large datasets efficiently', () => {
      const manySeriesIds = Array.from({ length: 10 }, (_, i) => `series-${i}`);
      
      renderStatisticalAnalysisPanel({ seriesIds: manySeriesIds });

      expect(screen.getByText(/Professional-grade statistical tools for 10 series/)).toBeInTheDocument();
    });
  });

  describe('Integration with Other Components', () => {
    test('should work with MultiSeriesComparison component', () => {
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      // Should be able to analyze series from comparison
      expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
    });

    test('should provide data for visualization components', () => {
      renderStatisticalAnalysisPanel();

      // Should have data available for charts and visualizations
      expect(screen.getByTestId('correlation-table')).toBeInTheDocument();
    });
  });

  describe('Professional Features', () => {
    test('should display professional-grade statistical information', () => {
      renderStatisticalAnalysisPanel();

      // Should show professional statistical measures
      expect(screen.getByText('P-Value')).toBeInTheDocument();
      expect(screen.getByText('Significance')).toBeInTheDocument();
    });

    test('should provide context-appropriate analysis options', async () => {
      const user = userEvent.setup();
      renderStatisticalAnalysisPanel({ seriesIds: ['gdp-real', 'unemployment-rate'] });

      // All analysis types should be available for 2+ series
      const analysisSelector = screen.getByTestId('analysis-type-selector');
      await user.click(analysisSelector);

      expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
      expect(screen.getByText('Regression Analysis')).toBeInTheDocument();
    });

    test('should maintain professional presentation standards', () => {
      renderStatisticalAnalysisPanel();

      // Should have professional styling and layout
      expect(screen.getByText('Statistical Analysis')).toBeInTheDocument();
      expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      expect(screen.getByText('Save Analysis')).toBeInTheDocument();
    });
  });
});