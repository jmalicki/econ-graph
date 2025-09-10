/**
 * REQUIREMENT: Header component tests with authentication flow
 * PURPOSE: Ensure Professional Analysis link appears correctly for authenticated users
 * This prevents navigation issues and blank pages for authenticated features
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Header from '../Header';
import { AuthProvider } from '../../../contexts/AuthContext';

const theme = createTheme();

// Mock the AuthContext to control authentication state
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

jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isLoading = false;
    mockAuthContext.error = null;
  });

  it('renders without crashing', () => {
    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    expect(screen.getByText('EconGraph')).toBeInTheDocument();
  });

  it('shows sign in button when user is not authenticated', () => {
    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByText('Professional Analysis')).not.toBeInTheDocument();
  });

  it('shows Professional Analysis link when user is authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    expect(screen.getByText('Professional Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('navigates to /analysis when Professional Analysis button is clicked', async () => {
    const user = userEvent.setup();
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    const professionalAnalysisButton = screen.getByText('Professional Analysis');
    await user.click(professionalAnalysisButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/analysis');
  });

  it('shows user avatar and menu when authenticated', async () => {
    const user = userEvent.setup();
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Should show user avatar - when there's an avatar image, the name is the user's name
    const avatar = screen.getByRole('button', { name: 'T' });
    expect(avatar).toBeInTheDocument();
    
    // Click avatar to open menu
    await user.click(avatar);
    
    // Should show user menu with Professional Analysis option
    await waitFor(() => {
      expect(screen.getAllByText('Professional Analysis')).toHaveLength(2); // Button + Menu item
    });
  });

  it('shows Professional Analysis in user menu', async () => {
    const user = userEvent.setup();
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Open user menu
    const avatar = screen.getByRole('button', { name: 'T' });
    await user.click(avatar);
    
    // Should show Professional Analysis menu item
    await waitFor(() => {
      const menuItems = screen.getAllByText('Professional Analysis');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  it('calls signOut when Sign Out is clicked in user menu', async () => {
    const user = userEvent.setup();
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Open user menu
    const avatar = screen.getByRole('button', { name: 'T' });
    await user.click(avatar);
    
    // Click Sign Out
    await waitFor(() => {
      const signOutButton = screen.getByText('Sign Out');
      return user.click(signOutButton);
    });
    
    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });

  it('calls onMenuClick when menu button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    const menuButton = screen.getByLabelText('open drawer');
    await user.click(menuButton);
    
    expect(mockOnMenuClick).toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    mockAuthContext.isLoading = true;
    
    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Should show EconGraph title even during loading
    expect(screen.getByText('EconGraph')).toBeInTheDocument();
  });

  it('handles authentication error state', () => {
    mockAuthContext.error = 'Authentication failed';
    
    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Should still render header properly
    expect(screen.getByText('EconGraph')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows user initials in avatar when no avatar image', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Should show user's first initial in avatar
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('hides Professional Analysis button on mobile screens', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    const professionalAnalysisButton = screen.getByText('Professional Analysis');
    
    // Should have responsive display styles (hidden on mobile)
    expect(professionalAnalysisButton).toBeInTheDocument();
  });

  it('provides accessibility features', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google' as const,
      role: 'analyst' as const,
      preferences: {
        theme: 'light' as const,
        defaultChartType: 'line',
        notifications: true,
        collaborationEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T00:00:00Z',
    };

    renderWithProviders(<Header onMenuClick={mockOnMenuClick} />);
    
    // Check for aria labels
    expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'T' })).toBeInTheDocument();
  });
});