// REQUIREMENT: Comprehensive unit tests for Dashboard page component
// PURPOSE: Test dashboard layout, widgets, and data aggregation
// This ensures the main overview interface provides accurate system information

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../test-utils/test-providers';
import Dashboard from '../Dashboard';

function renderDashboard() {
  return render(
    <TestProviders>
      <Dashboard />
    </TestProviders>
  );
}

describe('Dashboard', () => {
  test('should render dashboard layout successfully', () => {
    // REQUIREMENT: Test basic dashboard rendering and layout
    // PURPOSE: Verify that dashboard displays main overview information
    // This ensures users can access system status and key metrics
    
    renderDashboard();
    
    // Verify main dashboard elements
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/overview/i)).toBeInTheDocument();
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
  });

  test('should display system statistics', async () => {
    // REQUIREMENT: Test system statistics display
    // PURPOSE: Verify that key system metrics are shown to administrators
    // This provides visibility into system health and usage
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/total series/i)).toBeInTheDocument();
      expect(screen.getByText(/data sources/i)).toBeInTheDocument();
      expect(screen.getByText(/data points/i)).toBeInTheDocument();
    });
    
    // Should show actual numbers
    expect(screen.getByText(/1,234/)).toBeInTheDocument(); // Example count
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  test('should show crawler status information', async () => {
    // REQUIREMENT: Test crawler status monitoring display
    // PURPOSE: Verify that crawler health and progress are visible
    // This supports operational monitoring of data collection
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/crawler status/i)).toBeInTheDocument();
    });
    
    // Should show crawler metrics
    expect(screen.getByText(/running/i)).toBeInTheDocument();
    expect(screen.getByText(/150 total jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/120 completed/i)).toBeInTheDocument();
    expect(screen.getByText(/25 pending/i)).toBeInTheDocument();
  });

  test('should display recent search activity', async () => {
    // REQUIREMENT: Test recent activity display
    // PURPOSE: Verify that recent user searches are shown for insights
    // This helps understand system usage patterns
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
    });
    
    // Should show search queries and timestamps
    expect(screen.getByText(/gdp growth/i)).toBeInTheDocument();
    expect(screen.getByText(/unemployment rate/i)).toBeInTheDocument();
    expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument();
  });

  test('should show popular series information', async () => {
    // REQUIREMENT: Test popular series display
    // PURPOSE: Verify that frequently accessed series are highlighted
    // This helps users discover commonly used economic indicators
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/popular series/i)).toBeInTheDocument();
    });
    
    // Should show popular series with access counts
    expect(screen.getByText(/real gdp/i)).toBeInTheDocument();
    expect(screen.getByText(/unemployment rate/i)).toBeInTheDocument();
    expect(screen.getByText(/1,234 views/i)).toBeInTheDocument();
  });

  test('should display data quality metrics', async () => {
    // REQUIREMENT: Test data quality monitoring display
    // PURPOSE: Verify that data quality indicators are shown
    // This ensures transparency about data reliability
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/data quality/i)).toBeInTheDocument();
    });
    
    // Should show quality metrics
    expect(screen.getByText(/98.5% uptime/i)).toBeInTheDocument();
    expect(screen.getByText(/99.2% accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/2 failed updates/i)).toBeInTheDocument();
  });

  test('should show quick access navigation', () => {
    // REQUIREMENT: Test quick access navigation elements
    // PURPOSE: Verify that users can quickly navigate to key features
    // This improves user productivity and system discoverability
    
    renderDashboard();
    
    // Should show quick action buttons
    expect(screen.getByText(/explore series/i)).toBeInTheDocument();
    expect(screen.getByText(/view sources/i)).toBeInTheDocument();
    expect(screen.getByText(/system health/i)).toBeInTheDocument();
    
    // Should show search shortcut
    expect(screen.getByPlaceholderText(/quick search/i)).toBeInTheDocument();
  });

  test('should handle quick search functionality', async () => {
    // REQUIREMENT: Test dashboard quick search feature
    // PURPOSE: Verify that users can search directly from dashboard
    // This provides convenient access to search without navigation
    
    const user = userEvent.setup();
    renderDashboard();
    
    const quickSearch = screen.getByPlaceholderText(/quick search/i);
    
    // Type search query
    await user.type(quickSearch, 'GDP');
    
    // Should show search suggestions or redirect
    await waitFor(() => {
      expect(screen.getByText(/gross domestic product/i)).toBeInTheDocument();
    });
  });

  test('should display system alerts and notifications', async () => {
    // REQUIREMENT: Test system alerts display
    // PURPOSE: Verify that important system messages are shown
    // This ensures administrators are informed of critical issues
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/system alerts/i)).toBeInTheDocument();
    });
    
    // Should show different alert types
    expect(screen.getByText(/info/i)).toBeInTheDocument();
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    
    // Should show alert messages
    expect(screen.getByText(/scheduled maintenance/i)).toBeInTheDocument();
  });

  test('should show data freshness indicators', async () => {
    // REQUIREMENT: Test data freshness monitoring
    // PURPOSE: Verify that data age and update status are visible
    // This helps users understand data currency and reliability
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/data freshness/i)).toBeInTheDocument();
    });
    
    // Should show last update times
    expect(screen.getByText(/updated 2 hours ago/i)).toBeInTheDocument();
    expect(screen.getByText(/next update in 4 hours/i)).toBeInTheDocument();
    
    // Should show freshness indicators
    expect(screen.getByText(/fresh/i)).toBeInTheDocument();
    expect(screen.getByText(/stale/i)).toBeInTheDocument();
  });

  test('should handle dashboard widget interactions', async () => {
    // REQUIREMENT: Test widget interactivity
    // PURPOSE: Verify that dashboard widgets respond to user interactions
    // This enables detailed exploration from overview information
    
    const user = userEvent.setup();
    renderDashboard();
    
    // Click on series count widget
    const seriesWidget = screen.getByText(/total series/i);
    await user.click(seriesWidget);
    
    // Should show detailed breakdown or navigate
    await waitFor(() => {
      expect(screen.getByText(/series breakdown/i)).toBeInTheDocument();
    });
  });

  test('should display performance metrics', async () => {
    // REQUIREMENT: Test performance metrics display
    // PURPOSE: Verify that system performance indicators are shown
    // This supports system monitoring and optimization
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/performance/i)).toBeInTheDocument();
    });
    
    // Should show response time metrics
    expect(screen.getByText(/avg response time/i)).toBeInTheDocument();
    expect(screen.getByText(/245ms/i)).toBeInTheDocument();
    
    // Should show throughput metrics
    expect(screen.getByText(/requests per minute/i)).toBeInTheDocument();
    expect(screen.getByText(/1,234/i)).toBeInTheDocument();
  });

  test('should show data source health status', async () => {
    // REQUIREMENT: Test data source monitoring display
    // PURPOSE: Verify that external data source health is visible
    // This enables proactive monitoring of data collection issues
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/data sources/i)).toBeInTheDocument();
    });
    
    // Should show source status indicators
    expect(screen.getByText(/federal reserve/i)).toBeInTheDocument();
    expect(screen.getByText(/online/i)).toBeInTheDocument();
    expect(screen.getByText(/bureau of labor/i)).toBeInTheDocument();
    
    // Should show health indicators
    expect(screen.getByTestId('health-indicator-good')).toBeInTheDocument();
    expect(screen.getByTestId('health-indicator-warning')).toBeInTheDocument();
  });

  test('should display usage analytics', async () => {
    // REQUIREMENT: Test usage analytics display
    // PURPOSE: Verify that system usage patterns are shown
    // This provides insights for system optimization and planning
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/usage analytics/i)).toBeInTheDocument();
    });
    
    // Should show usage charts or metrics
    expect(screen.getByText(/daily active users/i)).toBeInTheDocument();
    expect(screen.getByText(/search volume/i)).toBeInTheDocument();
    expect(screen.getByText(/data downloads/i)).toBeInTheDocument();
  });

  test('should handle refresh functionality', async () => {
    // REQUIREMENT: Test dashboard refresh capability
    // PURPOSE: Verify that users can update dashboard information
    // This ensures access to current system status
    
    const user = userEvent.setup();
    renderDashboard();
    
    const refreshButton = screen.getByLabelText(/refresh dashboard/i);
    await user.click(refreshButton);
    
    // Should show loading state during refresh
    expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
    
    // Should update timestamps after refresh
    await waitFor(() => {
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });
  });

  test('should show responsive layout on different screen sizes', () => {
    // REQUIREMENT: Test responsive dashboard layout
    // PURPOSE: Verify that dashboard adapts to different screen sizes
    // This ensures accessibility across devices
    
    // Mock different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768, // Tablet width
    });
    
    renderDashboard();
    
    // Should adapt layout for smaller screens
    expect(screen.getByTestId('dashboard-mobile-layout')).toBeInTheDocument();
  });

  test('should handle error states gracefully', async () => {
    // REQUIREMENT: Test error handling in dashboard widgets
    // PURPOSE: Verify that widget errors don't break the entire dashboard
    // This ensures robust user experience even with partial failures
    
    renderDashboard();
    
    // Should show error state for failed widgets
    await waitFor(() => {
      expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
    });
    
    // Should show retry options
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
    
    // Other widgets should still function
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('should display customization options', async () => {
    // REQUIREMENT: Test dashboard customization features
    // PURPOSE: Verify that users can personalize their dashboard
    // This improves user experience and productivity
    
    const user = userEvent.setup();
    renderDashboard();
    
    const customizeButton = screen.getByText(/customize/i);
    await user.click(customizeButton);
    
    // Should show customization panel
    expect(screen.getByText(/dashboard settings/i)).toBeInTheDocument();
    expect(screen.getByText(/widget preferences/i)).toBeInTheDocument();
    
    // Should allow widget toggling
    const widgetToggle = screen.getByLabelText(/show crawler status/i);
    await user.click(widgetToggle);
    
    expect(widgetToggle).not.toBeChecked();
  });
});
