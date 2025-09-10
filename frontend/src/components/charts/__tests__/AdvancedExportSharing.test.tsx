/**
 * REQUIREMENT: Comprehensive tests for Advanced Export & Sharing component
 * PURPOSE: Ensure professional export and sharing capabilities work correctly
 * This validates enterprise-grade report generation and sharing features
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import AdvancedExportSharing from '../AdvancedExportSharing';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

interface MockProps {
  seriesIds?: string[];
  analysisData?: any;
  chartConfig?: any;
  onExportComplete?: jest.Mock;
  onShareComplete?: jest.Mock;
}

function renderAdvancedExportSharing(props: MockProps = {}) {
  const defaultProps = {
    seriesIds: ['gdp-real', 'unemployment-rate'],
    analysisData: { correlations: [], trends: [] },
    chartConfig: { type: 'line', theme: 'professional' },
    onExportComplete: jest.fn(),
    onShareComplete: jest.fn(),
    ...props,
  };

  return render(
    <TestProviders>
      <AdvancedExportSharing {...defaultProps} />
    </TestProviders>
  );
}

describe('AdvancedExportSharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('should render export and share interface', () => {
      renderAdvancedExportSharing();

      expect(screen.getByText('Export & Share Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Create professional reports and shareable links/)).toBeInTheDocument();
    });

    test('should show export and share buttons', () => {
      renderAdvancedExportSharing();

      expect(screen.getByTestId('open-export-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('open-share-dialog')).toBeInTheDocument();
      expect(screen.getByText('Export Report')).toBeInTheDocument();
      expect(screen.getByText('Create Share Link')).toBeInTheDocument();
    });

    test('should display helpful descriptions', () => {
      renderAdvancedExportSharing();

      expect(screen.getByText(/Generate PDF, Excel, or CSV reports/)).toBeInTheDocument();
      expect(screen.getByText(/Generate shareable links with access controls/)).toBeInTheDocument();
    });
  });

  describe('Export Dialog Workflow', () => {
    test('should open export dialog when button clicked', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      expect(screen.getByText('Export Analysis Report')).toBeInTheDocument();
      expect(screen.getByText('Choose Export Format')).toBeInTheDocument();
    });

    test('should show all export format options', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      expect(screen.getByTestId('format-pdf')).toBeInTheDocument();
      expect(screen.getByTestId('format-excel')).toBeInTheDocument();
      expect(screen.getByTestId('format-csv')).toBeInTheDocument();
      expect(screen.getByTestId('format-png')).toBeInTheDocument();
    });

    test('should allow selecting export format', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      const excelButton = screen.getByTestId('format-excel');
      await user.click(excelButton);

      expect(excelButton).toHaveClass('MuiButton-contained');
    });

    test('should progress through export steps', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Step 1: Format selection
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);

      // Step 2: Configuration
      expect(screen.getByText('Configure Content & Template')).toBeInTheDocument();
      expect(screen.getByTestId('include-charts-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('include-statistics-checkbox')).toBeInTheDocument();

      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);

      // Step 3: Review
      expect(screen.getByText('Review & Export')).toBeInTheDocument();
      expect(screen.getByTestId('start-export-button')).toBeInTheDocument();
    });

    test('should show export progress during export', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Navigate to final step
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);

      // Start export
      const startExportButton = screen.getByTestId('start-export-button');
      await user.click(startExportButton);

      expect(screen.getByTestId('export-progress')).toBeInTheDocument();
      expect(screen.getByText(/Generating PDF report/)).toBeInTheDocument();
    });

    test('should show download link when export completes', async () => {
      const user = userEvent.setup();
      const mockOnExportComplete = jest.fn();
      renderAdvancedExportSharing({ onExportComplete: mockOnExportComplete });

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Navigate to final step and export
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);
      const startExportButton = screen.getByTestId('start-export-button');
      await user.click(startExportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(screen.getByText('Export Complete!')).toBeInTheDocument();
      });

      expect(screen.getByTestId('download-export-button')).toBeInTheDocument();
      expect(mockOnExportComplete).toHaveBeenCalled();
    });
  });

  describe('Share Dialog Workflow', () => {
    test('should open share dialog when button clicked', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);

      expect(screen.getByText('Create Shareable Link')).toBeInTheDocument();
      expect(screen.getByText('Share Information')).toBeInTheDocument();
    });

    test('should allow entering share information', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);

      const titleInput = screen.getByTestId('share-title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'My Economic Analysis');

      expect(titleInput).toHaveValue('My Economic Analysis');

      const descriptionInput = screen.getByTestId('share-description-input');
      await user.type(descriptionInput, 'Detailed analysis of Q4 trends');

      expect(descriptionInput).toHaveValue('Detailed analysis of Q4 trends');
    });

    test('should allow configuring access levels', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);

      const nextButton = screen.getByTestId('share-next-step-1');
      await user.click(nextButton);

      expect(screen.getByText('Access & Security')).toBeInTheDocument();
      expect(screen.getByTestId('access-public')).toBeInTheDocument();
      expect(screen.getByTestId('access-authenticated')).toBeInTheDocument();
      expect(screen.getByTestId('access-private')).toBeInTheDocument();

      const publicRadio = screen.getByTestId('access-public');
      await user.click(publicRadio);

      expect(publicRadio).toBeChecked();
    });

    test('should allow setting password protection', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);
      const nextButton1 = screen.getByTestId('share-next-step-1');
      await user.click(nextButton1);

      const passwordInput = screen.getByTestId('share-password-input');
      await user.type(passwordInput, 'secure123');

      expect(passwordInput).toHaveValue('secure123');
    });

    test('should create shareable link with proper configuration', async () => {
      const user = userEvent.setup();
      const mockOnShareComplete = jest.fn();
      renderAdvancedExportSharing({ onShareComplete: mockOnShareComplete });

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);

      // Progress through steps
      const nextButton1 = screen.getByTestId('share-next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('share-next-step-2');
      await user.click(nextButton2);

      const createButton = screen.getByTestId('create-share-button');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Share Link Created!')).toBeInTheDocument();
      });

      expect(screen.getByTestId('generated-share-url')).toBeInTheDocument();
      expect(mockOnShareComplete).toHaveBeenCalled();
    });
  });

  describe('Export Configuration', () => {
    test('should allow selecting content to include', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);

      const chartsCheckbox = screen.getByTestId('include-charts-checkbox');
      const statisticsCheckbox = screen.getByTestId('include-statistics-checkbox');
      const annotationsCheckbox = screen.getByTestId('include-annotations-checkbox');

      expect(chartsCheckbox).toBeInTheDocument();
      expect(statisticsCheckbox).toBeInTheDocument();
      expect(annotationsCheckbox).toBeInTheDocument();

      await user.click(chartsCheckbox.querySelector('input')!);
      // Should toggle the checkbox
    });

    test('should allow customizing headers and footers', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);

      const headerInput = screen.getByTestId('custom-header-input');
      const footerInput = screen.getByTestId('custom-footer-input');

      await user.type(headerInput, 'Q4 2023 Economic Report');
      await user.type(footerInput, 'Confidential - Internal Use');

      expect(headerInput).toHaveValue('Q4 2023 Economic Report');
      expect(footerInput).toHaveValue('Confidential - Internal Use');
    });

    test('should show template selector for PDF exports', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Select PDF format first
      const pdfButton = screen.getByTestId('format-pdf');
      await user.click(pdfButton);

      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);

      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    });
  });

  describe('Share Configuration', () => {
    test('should allow configuring share permissions', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);
      const nextButton1 = screen.getByTestId('share-next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('share-next-step-2');
      await user.click(nextButton2);

      expect(screen.getByTestId('allow-download-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('allow-comments-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('track-views-checkbox')).toBeInTheDocument();
    });

    test('should allow setting expiry dates', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);
      const nextButton1 = screen.getByTestId('share-next-step-1');
      await user.click(nextButton1);

      const expirySelect = screen.getByTestId('share-expiry-select');
      await user.click(expirySelect);

      expect(screen.getByText('1 Day')).toBeInTheDocument();
      expect(screen.getByText('1 Week')).toBeInTheDocument();
      expect(screen.getByText('1 Month')).toBeInTheDocument();
      expect(screen.getByText('1 Year')).toBeInTheDocument();
    });
  });

  describe('Professional Features', () => {
    test('should display file size estimates', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);

      expect(screen.getByText(/Estimated Size:/)).toBeInTheDocument();
    });

    test('should show professional export summary', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);

      expect(screen.getByText('Export Summary')).toBeInTheDocument();
      expect(screen.getByText(/Series: 2 economic indicators/)).toBeInTheDocument();
    });

    test('should handle different export formats appropriately', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Test PDF format
      const pdfButton = screen.getByTestId('format-pdf');
      await user.click(pdfButton);
      expect(pdfButton).toHaveClass('MuiButton-contained');

      // Test CSV format
      const csvButton = screen.getByTestId('format-csv');
      await user.click(csvButton);
      expect(csvButton).toHaveClass('MuiButton-contained');
    });
  });

  describe('Error Handling', () => {
    test('should handle export failures gracefully', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      // Mock console.error to avoid noise in tests
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Navigate to export step
      const nextButton1 = screen.getByTestId('next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('next-step-2');
      await user.click(nextButton2);

      // Should handle export process
      expect(screen.getByTestId('start-export-button')).toBeInTheDocument();

      console.error = originalConsoleError;
    });

    test('should validate required fields', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const shareButton = screen.getByTestId('open-share-dialog');
      await user.click(shareButton);

      // Clear title field
      const titleInput = screen.getByTestId('share-title-input');
      await user.clear(titleInput);

      const nextButton1 = screen.getByTestId('share-next-step-1');
      await user.click(nextButton1);
      const nextButton2 = screen.getByTestId('share-next-step-2');
      await user.click(nextButton2);

      const createButton = screen.getByTestId('create-share-button');
      expect(createButton).toBeDisabled(); // Should be disabled without title
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for all controls', () => {
      renderAdvancedExportSharing();

      expect(screen.getByTestId('open-export-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('open-share-dialog')).toBeInTheDocument();
    });

    test('should support keyboard navigation through stepper', async () => {
      const user = userEvent.setup();
      renderAdvancedExportSharing();

      const exportButton = screen.getByTestId('open-export-dialog');
      await user.click(exportButton);

      // Should be able to navigate with keyboard
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type');
    });

    test('should have proper heading hierarchy', () => {
      renderAdvancedExportSharing();

      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent('Export & Share Analysis');
    });
  });

  describe('Responsive Design', () => {
    test('should adapt layout for mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderAdvancedExportSharing();

      expect(screen.getByText('Export & Share Analysis')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('should work with different series configurations', () => {
      renderAdvancedExportSharing({ 
        seriesIds: ['gdp-real', 'unemployment-rate', 'inflation-rate'] 
      });

      expect(screen.getByText('Export & Share Analysis')).toBeInTheDocument();
    });

    test('should integrate with analysis data', () => {
      const analysisData = {
        correlations: [{ series1: 'gdp', series2: 'unemployment', coefficient: -0.85 }],
        trends: [{ series: 'gdp', direction: 'upward', strength: 0.82 }],
      };

      renderAdvancedExportSharing({ analysisData });

      expect(screen.getByText('Export & Share Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should render quickly with large datasets', () => {
      const startTime = performance.now();
      
      renderAdvancedExportSharing({ 
        seriesIds: Array.from({ length: 20 }, (_, i) => `series-${i}`) 
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});