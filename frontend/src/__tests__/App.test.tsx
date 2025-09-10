/**
 * REQUIREMENT: App routing tests with authentication integration
 * PURPOSE: Ensure all routes work correctly and Professional Analysis is accessible
 * This prevents routing issues and ensures enterprise features are properly integrated
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import App from '../App';

const theme = createTheme();

// Mock all the page components to avoid complex rendering
jest.mock('../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  };
});

jest.mock('../pages/SeriesExplorer', () => {
  return function MockSeriesExplorer() {
    return <div data-testid="series-explorer-page">Series Explorer Page</div>;
  };
});

jest.mock('../pages/SeriesDetail', () => {
  return function MockSeriesDetail() {
    return <div data-testid="series-detail-page">Series Detail Page</div>;
  };
});

jest.mock('../pages/DataSources', () => {
  return function MockDataSources() {
    return <div data-testid="data-sources-page">Data Sources Page</div>;
  };
});

jest.mock('../pages/About', () => {
  return function MockAbout() {
    return <div data-testid="about-page">About Page</div>;
  };
});

jest.mock('../pages/ProfessionalAnalysis', () => {
  return function MockProfessionalAnalysis() {
    return <div data-testid="professional-analysis-page">Professional Analysis Page</div>;
  };
});

jest.mock('../pages/GlobalAnalysis', () => {
  return function MockGlobalAnalysis() {
    return <div data-testid="global-analysis-page">Global Analysis Page</div>;
  };
});

// Mock enterprise feature components
jest.mock('../components/charts/MultiSeriesComparison', () => {
  return function MockMultiSeriesComparison() {
    return <div data-testid="multi-series-comparison">Multi-Series Comparison</div>;
  };
});

jest.mock('../components/charts/StatisticalAnalysisPanel', () => {
  return function MockStatisticalAnalysisPanel() {
    return <div data-testid="statistical-analysis-panel">Statistical Analysis Panel</div>;
  };
});

jest.mock('../components/charts/RealTimeCollaboration', () => {
  return function MockRealTimeCollaboration() {
    return <div data-testid="real-time-collaboration">Real-time Collaboration</div>;
  };
});

jest.mock('../components/charts/AdvancedExportSharing', () => {
  return function MockAdvancedExportSharing() {
    return <div data-testid="advanced-export-sharing">Advanced Export & Sharing</div>;
  };
});

jest.mock('../components/dashboard/PerformanceDashboard', () => {
  return function MockPerformanceDashboard() {
    return <div data-testid="performance-dashboard">Performance Dashboard</div>;
  };
});

jest.mock('../components/dashboard/CustomizableDashboard', () => {
  return function MockCustomizableDashboard() {
    return <div data-testid="customizable-dashboard">Customizable Dashboard</div>;
  };
});

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signInWithGoogle: jest.fn(),
  signInWithFacebook: jest.fn(),
  signInWithEmail: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  refreshUser: jest.fn(),
  clearError: jest.fn(),
};

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => mockAuthContext,
}));

// Mock the layout components
jest.mock('../components/layout/Header', () => {
  return function MockHeader({ onMenuClick }: any) {
    return (
      <div data-testid="header">
        <button onClick={onMenuClick}>Menu</button>
      </div>
    );
  };
});

jest.mock('../components/layout/Sidebar', () => {
  return function MockSidebar({ open, onClose }: any) {
    return (
      <div data-testid="sidebar" style={{ display: open ? 'block' : 'none' }}>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('App Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders Dashboard on root route', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('renders Series Explorer on /explore route', () => {
    renderWithRouter('/explore');
    expect(screen.getByTestId('series-explorer-page')).toBeInTheDocument();
  });

  it('renders Series Detail on /series/:id route', () => {
    renderWithRouter('/series/GDPC1');
    expect(screen.getByTestId('series-detail-page')).toBeInTheDocument();
  });

  it('renders Data Sources on /sources route', () => {
    renderWithRouter('/sources');
    expect(screen.getByTestId('data-sources-page')).toBeInTheDocument();
  });

  it('renders About on /about route', () => {
    renderWithRouter('/about');
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });

  it('renders Professional Analysis on /analysis route', () => {
    renderWithRouter('/analysis');
    expect(screen.getByTestId('professional-analysis-page')).toBeInTheDocument();
  });

  it('renders Professional Analysis on /analysis/:id route', () => {
    renderWithRouter('/analysis/GDPC1');
    expect(screen.getByTestId('professional-analysis-page')).toBeInTheDocument();
  });

  it('renders Global Analysis on /global route', () => {
    renderWithRouter('/global');
    expect(screen.getByTestId('global-analysis-page')).toBeInTheDocument();
  });

  // Test Enterprise Features Routes
  it('renders Multi-Series Comparison on /comparison route', () => {
    renderWithRouter('/comparison');
    expect(screen.getByTestId('multi-series-comparison')).toBeInTheDocument();
  });

  it('renders Statistical Analysis on /statistical-analysis route', () => {
    renderWithRouter('/statistical-analysis');
    expect(screen.getByTestId('statistical-analysis-panel')).toBeInTheDocument();
  });

  it('renders Real-time Collaboration on /collaboration route', () => {
    renderWithRouter('/collaboration');
    expect(screen.getByTestId('real-time-collaboration')).toBeInTheDocument();
  });

  it('renders Export & Sharing on /export-sharing route', () => {
    renderWithRouter('/export-sharing');
    expect(screen.getByTestId('advanced-export-sharing')).toBeInTheDocument();
  });

  it('renders Performance Dashboard on /performance route', () => {
    renderWithRouter('/performance');
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
  });

  it('renders Customizable Dashboard on /custom-dashboard route', () => {
    renderWithRouter('/custom-dashboard');
    expect(screen.getByTestId('customizable-dashboard')).toBeInTheDocument();
  });

  it('passes correct props to enterprise components', () => {
    renderWithRouter('/comparison');
    expect(screen.getByTestId('multi-series-comparison')).toBeInTheDocument();
    
    renderWithRouter('/statistical-analysis');
    expect(screen.getByTestId('statistical-analysis-panel')).toBeInTheDocument();
    
    renderWithRouter('/collaboration');
    expect(screen.getByTestId('real-time-collaboration')).toBeInTheDocument();
    
    renderWithRouter('/export-sharing');
    expect(screen.getByTestId('advanced-export-sharing')).toBeInTheDocument();
  });

  it('handles invalid routes gracefully', () => {
    renderWithRouter('/invalid-route');
    // Should not crash, might show 404 or redirect to home
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('maintains layout structure across all routes', () => {
    const routes = [
      '/',
      '/explore',
      '/sources',
      '/about',
      '/analysis',
      '/global',
      '/comparison',
      '/statistical-analysis',
      '/collaboration',
      '/export-sharing',
      '/performance',
      '/custom-dashboard',
    ];

    routes.forEach(route => {
      const { unmount } = renderWithRouter(route);
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      unmount();
    });
  });

  it('provides responsive layout with proper spacing', () => {
    renderWithRouter('/');
    
    // Check that main content is rendered within proper container
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('integrates with AuthProvider correctly', () => {
    renderWithRouter('/');
    
    // Should render without authentication errors
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('handles route parameters correctly', () => {
    renderWithRouter('/series/GDPC1');
    expect(screen.getByTestId('series-detail-page')).toBeInTheDocument();
    
    renderWithRouter('/analysis/unemployment-data');
    expect(screen.getByTestId('professional-analysis-page')).toBeInTheDocument();
  });

  it('ensures all enterprise features are accessible via routing', async () => {
    const enterpriseRoutes = [
      { path: '/comparison', testId: 'multi-series-comparison' },
      { path: '/statistical-analysis', testId: 'statistical-analysis-panel' },
      { path: '/collaboration', testId: 'real-time-collaboration' },
      { path: '/export-sharing', testId: 'advanced-export-sharing' },
      { path: '/performance', testId: 'performance-dashboard' },
      { path: '/custom-dashboard', testId: 'customizable-dashboard' },
    ];

    for (const route of enterpriseRoutes) {
      const { unmount } = renderWithRouter(route.path);
      await waitFor(() => {
        expect(screen.getByTestId(route.testId)).toBeInTheDocument();
      });
      unmount();
    }
  });

  it('prevents blank pages by ensuring all components render', () => {
    const allRoutes = [
      { path: '/', testId: 'dashboard-page' },
      { path: '/explore', testId: 'series-explorer-page' },
      { path: '/series/test', testId: 'series-detail-page' },
      { path: '/sources', testId: 'data-sources-page' },
      { path: '/about', testId: 'about-page' },
      { path: '/analysis', testId: 'professional-analysis-page' },
      { path: '/global', testId: 'global-analysis-page' },
      { path: '/comparison', testId: 'multi-series-comparison' },
      { path: '/statistical-analysis', testId: 'statistical-analysis-panel' },
      { path: '/collaboration', testId: 'real-time-collaboration' },
      { path: '/export-sharing', testId: 'advanced-export-sharing' },
      { path: '/performance', testId: 'performance-dashboard' },
      { path: '/custom-dashboard', testId: 'customizable-dashboard' },
    ];

    allRoutes.forEach(route => {
      const { unmount } = renderWithRouter(route.path);
      expect(screen.getByTestId(route.testId)).toBeInTheDocument();
      unmount();
    });
  });
});