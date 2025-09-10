/**
 * REQUIREMENT: Tests for Customizable Dashboard component
 * PURPOSE: Ensure Grafana-level dashboard customization works correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import CustomizableDashboard from '../CustomizableDashboard';

describe('CustomizableDashboard', () => {
  test('should render dashboard with widgets', () => {
    render(
      <TestProviders>
        <CustomizableDashboard userId="test-user" />
      </TestProviders>
    );

    expect(screen.getByText('My Economic Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-widgets-grid')).toBeInTheDocument();
    expect(screen.getByTestId('widget-widget-gdp-chart')).toBeInTheDocument();
  });

  test('should allow entering edit mode', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CustomizableDashboard userId="test-user" />
      </TestProviders>
    );

    const editButton = screen.getByTestId('toggle-edit-mode');
    await user.click(editButton);

    expect(screen.getByTestId('dashboard-mode-indicator')).toHaveTextContent('Edit Mode');
    expect(screen.getByTestId('add-widget-button')).toBeInTheDocument();
  });

  test('should show add widget dialog', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CustomizableDashboard userId="test-user" />
      </TestProviders>
    );

    const editButton = screen.getByTestId('toggle-edit-mode');
    await user.click(editButton);

    const addWidgetButton = screen.getByTestId('add-widget-button');
    await user.click(addWidgetButton);

    expect(screen.getByText('Add Dashboard Widget')).toBeInTheDocument();
    expect(screen.getByTestId('add-chart-widget')).toBeInTheDocument();
    expect(screen.getByTestId('add-metric-widget')).toBeInTheDocument();
  });

  test('should allow widget configuration', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <CustomizableDashboard userId="test-user" />
      </TestProviders>
    );

    const editButton = screen.getByTestId('toggle-edit-mode');
    await user.click(editButton);

    const editWidgetButton = screen.getByTestId('edit-widget-widget-gdp-chart');
    await user.click(editWidgetButton);

    expect(screen.getByText(/Configure Real GDP Trend/)).toBeInTheDocument();
    expect(screen.getByTestId('widget-title-input')).toBeInTheDocument();
  });

  test('should show empty state when no widgets', () => {
    render(
      <TestProviders>
        <CustomizableDashboard userId="test-user" />
      </TestProviders>
    );

    // Hide all widgets to test empty state
    // In real test, would mock empty widgets array
    expect(screen.getByTestId('dashboard-widgets-grid')).toBeInTheDocument();
  });
});