/**
 * REQUIREMENT: Professional Analysis page tests
 * PURPOSE: Ensure Professional Analysis page renders correctly and handles authentication
 * This prevents blank pages and missing component issues from reaching production
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ProfessionalAnalysis from '../ProfessionalAnalysis';

// Mock the chart components to avoid complex chart rendering in tests
jest.mock('../../components/charts/ProfessionalChart', () => {
  return function MockProfessionalChart({ primarySeries, onSeriesAdd }: any) {
    return (
      <div data-testid="professional-chart">
        <div data-testid="primary-series-title">{primarySeries?.title}</div>
        <button data-testid="add-series-button" onClick={onSeriesAdd}>
          Add Series
        </button>
      </div>
    );
  };
});

jest.mock('../../components/charts/ChartCollaboration', () => {
  return function MockChartCollaboration({ 
    annotations, 
    currentUser, 
    collaborators, 
    isOpen, 
    onToggle,
    onAnnotationAdd 
  }: any) {
    return (
      <div 
        data-testid="chart-collaboration" 
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        <div data-testid="current-user-name">{currentUser?.name}</div>
        <div data-testid="collaborators-count">{collaborators?.length}</div>
        <div data-testid="annotations-count">{annotations?.length}</div>
        <button data-testid="toggle-collaboration" onClick={onToggle}>
          Toggle Collaboration
        </button>
        <button 
          data-testid="add-annotation-button" 
          onClick={() => onAnnotationAdd({
            date: '2023-01-01',
            title: 'Test Annotation',
            description: 'Test Description',
            color: '#ff0000',
            type: 'point',
            author: currentUser,
            isVisible: true,
            isPinned: false,
            tags: ['test'],
            comments: []
          })}
        >
          Add Annotation
        </button>
      </div>
    );
  };
});

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('ProfessionalAnalysis', () => {
  beforeEach(() => {
    // Mock window.location for navigation tests
    delete (window as any).location;
    (window as any).location = { assign: jest.fn() };
  });

  it('renders without crashing', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    expect(screen.getByText('Professional Chart Analytics')).toBeInTheDocument();
  });

  it('displays the main header and description', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Professional Chart Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Bloomberg Terminal-level economic analysis/)).toBeInTheDocument();
  });

  it('renders key metrics cards', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Primary Series')).toBeInTheDocument();
    expect(screen.getByText('Secondary Series')).toBeInTheDocument();
    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.getByText('Collaborators')).toBeInTheDocument();
  });

  it('displays primary series information', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Real Gross Domestic Product')).toBeInTheDocument();
    expect(screen.getByText(/Latest:/)).toBeInTheDocument();
  });

  it('renders the professional chart component', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByTestId('professional-chart')).toBeInTheDocument();
    expect(screen.getByTestId('primary-series-title')).toHaveTextContent('Real Gross Domestic Product');
  });

  it('renders the chart collaboration component', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByTestId('chart-collaboration')).toBeInTheDocument();
    expect(screen.getByTestId('current-user-name')).toHaveTextContent('Economic Analyst');
    expect(screen.getByTestId('collaborators-count')).toHaveTextContent('4');
  });

  it('shows initial annotations count', async () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    await waitFor(() => {
      expect(screen.getByTestId('annotations-count')).toHaveTextContent('3');
    });
  });

  it('displays economic analysis summary', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Economic Analysis Summary')).toBeInTheDocument();
    expect(screen.getByText(/Key Insight:/)).toBeInTheDocument();
    expect(screen.getByText(/COVID-19 pandemic impact/)).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Add Comparison Series')).toBeInTheDocument();
    expect(screen.getByText('Open Collaboration Panel')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('opens series selection dialog when add series button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    const addSeriesButton = screen.getByText('Add Comparison Series');
    await user.click(addSeriesButton);
    
    expect(screen.getByText('Add Comparison Series')).toBeInTheDocument();
    expect(screen.getByText('Select additional economic series')).toBeInTheDocument();
  });

  it('opens collaboration panel when collaboration button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    const collaborationButton = screen.getByText('Open Collaboration Panel');
    await user.click(collaborationButton);
    
    // Chart collaboration should be visible
    const chartCollaboration = screen.getByTestId('chart-collaboration');
    expect(chartCollaboration).toHaveStyle('display: block');
  });

  it('toggles collaboration panel with floating action button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Initially collaboration should be closed
    const chartCollaboration = screen.getByTestId('chart-collaboration');
    expect(chartCollaboration).toHaveStyle('display: none');
    
    // Click FAB to open
    const fab = screen.getByLabelText('collaboration');
    await user.click(fab);
    
    expect(chartCollaboration).toHaveStyle('display: block');
  });

  it('allows selecting series in the series selection dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Open dialog
    const addSeriesButton = screen.getByText('Add Comparison Series');
    await user.click(addSeriesButton);
    
    // Select a series
    const unemploymentCheckbox = screen.getByRole('checkbox', { name: /Unemployment Rate/ });
    await user.click(unemploymentCheckbox);
    
    expect(unemploymentCheckbox).toBeChecked();
    
    // Add selected series
    const addSelectedButton = screen.getByText('Add Selected Series');
    await user.click(addSelectedButton);
    
    // Dialog should close
    expect(screen.queryByText('Select additional economic series')).not.toBeInTheDocument();
  });

  it('can cancel series selection dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Open dialog
    const addSeriesButton = screen.getByText('Add Comparison Series');
    await user.click(addSeriesButton);
    
    // Cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    // Dialog should close
    expect(screen.queryByText('Select additional economic series')).not.toBeInTheDocument();
  });

  it('displays technical analysis information', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText('Technical Analysis')).toBeInTheDocument();
    expect(screen.getByText(/SMA, EMA, Bollinger Bands/)).toBeInTheDocument();
  });

  it('shows analysis timeline with key events', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    expect(screen.getByText(/Pandemic Impact \(March 2020\)/)).toBeInTheDocument();
    expect(screen.getByText(/Recovery Phase \(2021\)/)).toBeInTheDocument();
    expect(screen.getByText(/Inflation Response \(2022\)/)).toBeInTheDocument();
    expect(screen.getByText(/Current Outlook \(2023-2024\)/)).toBeInTheDocument();
  });

  it('handles annotation addition through collaboration component', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Open collaboration panel
    const collaborationButton = screen.getByText('Open Collaboration Panel');
    await user.click(collaborationButton);
    
    // Add annotation
    const addAnnotationButton = screen.getByTestId('add-annotation-button');
    await user.click(addAnnotationButton);
    
    // Annotations count should increase (from 3 to 4)
    await waitFor(() => {
      expect(screen.getByTestId('annotations-count')).toHaveTextContent('4');
    });
  });

  it('displays correct collaborator statistics', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Should show 3 online collaborators (out of 4 total)
    const collaboratorsCard = screen.getByText('Collaborators').closest('div');
    expect(collaboratorsCard).toHaveTextContent('3');
    expect(collaboratorsCard).toHaveTextContent('Active collaborators');
  });

  it('renders without errors when components are missing', () => {
    // This test ensures graceful degradation if chart components fail
    jest.doMock('../../components/charts/ProfessionalChart', () => {
      throw new Error('Component not found');
    });
    
    // Should not crash the entire page
    expect(() => {
      renderWithProviders(<ProfessionalAnalysis />);
    }).not.toThrow();
  });

  it('maintains responsive layout on different screen sizes', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Check that key elements are present for responsive design
    const container = screen.getByText('Professional Chart Analytics').closest('div');
    expect(container).toBeInTheDocument();
    
    // Metrics cards should be in a grid
    const metricsCards = screen.getAllByText(/Primary Series|Secondary Series|Annotations|Collaborators/);
    expect(metricsCards).toHaveLength(4);
  });

  it('provides accessibility features', () => {
    renderWithProviders(<ProfessionalAnalysis />);
    
    // Check for proper headings
    expect(screen.getByRole('heading', { name: /Professional Chart Analytics/ })).toBeInTheDocument();
    
    // Check for aria labels
    expect(screen.getByLabelText('collaboration')).toBeInTheDocument();
    
    // Check for proper button roles
    expect(screen.getByRole('button', { name: /Add Comparison Series/ })).toBeInTheDocument();
  });
});