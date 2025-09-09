/**
 * REQUIREMENT: Comprehensive unit tests for authentication dialog
 * PURPOSE: Test LoginDialog component behavior including error handling and user interactions
 * This ensures proper authentication flow and error message visibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginDialog from '../LoginDialog';
import { AuthProvider } from '../../../contexts/AuthContext';

// Note: ResizeObserver is mocked in setupTests.ts using resize-observer-polyfill

// Set up Facebook App ID for testing
process.env.REACT_APP_FACEBOOK_APP_ID = 'test-facebook-app-id';

// Mock the auth context
const mockAuthContext = {
  signInWithGoogle: jest.fn(),
  signInWithFacebook: jest.fn(),
  signInWithEmail: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  refreshUser: jest.fn(),
  clearError: jest.fn(),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null as string | null,
};

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
}));

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

describe('LoginDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.error = null;
    mockAuthContext.isLoading = false;
  });

  it('renders login dialog when open', () => {
    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to EconGraph')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    expect(screen.getAllByText('Sign In')).toHaveLength(2); // Tab and button
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <LoginDialog open={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.queryByText('Welcome to EconGraph')).not.toBeInTheDocument();
  });

  it('shows error message when authentication fails', async () => {
    const errorMessage = 'Invalid email or password';
    mockAuthContext.error = errorMessage;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('stays open when email authentication fails', async () => {
    const errorMessage = 'Invalid email or password';
    mockAuthContext.signInWithEmail.mockRejectedValue(new Error(errorMessage));
    mockAuthContext.error = errorMessage;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill in email and password
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    // Click sign in button (get the form button, not the tab)
    const signInButtons = screen.getAllByText('Sign In');
    const formButton = signInButtons.find(button => button.getAttribute('type') === 'button');
    fireEvent.click(formButton!);

    await waitFor(() => {
      expect(mockAuthContext.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Dialog should still be open and show error
    expect(screen.getByText('Welcome to EconGraph')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('stays open when Google authentication fails', async () => {
    const errorMessage = 'Google authentication failed';
    mockAuthContext.signInWithGoogle.mockRejectedValue(new Error(errorMessage));
    mockAuthContext.error = errorMessage;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Click Google sign in button
    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled();
    });

    // Dialog should still be open and show error
    expect(screen.getByText('Welcome to EconGraph')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('stays open when Facebook authentication fails', async () => {
    const errorMessage = 'Facebook authentication failed';
    mockAuthContext.signInWithFacebook.mockRejectedValue(new Error(errorMessage));
    mockAuthContext.error = errorMessage;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Click Facebook sign in button
    fireEvent.click(screen.getByText('Continue with Facebook'));

    await waitFor(() => {
      expect(mockAuthContext.signInWithFacebook).toHaveBeenCalled();
    });

    // Dialog should still be open and show error
    expect(screen.getByText('Welcome to EconGraph')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes dialog when email authentication succeeds', async () => {
    mockAuthContext.signInWithEmail.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill in email and password
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

    // Click sign in button (get the form button, not the tab)
    const signInButtons = screen.getAllByText('Sign In');
    const formButton = signInButtons.find(button => button.getAttribute('type') === 'button');
    fireEvent.click(formButton!);

    await waitFor(() => {
      expect(mockAuthContext.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Dialog should close and success callback should be called
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('closes dialog when Google authentication succeeds', async () => {
    mockAuthContext.signInWithGoogle.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Click Google sign in button
    fireEvent.click(screen.getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled();
    });

    // Dialog should close and success callback should be called
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('closes dialog when Facebook authentication succeeds', async () => {
    mockAuthContext.signInWithFacebook.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Click Facebook sign in button
    fireEvent.click(screen.getByText('Continue with Facebook'));

    await waitFor(() => {
      expect(mockAuthContext.signInWithFacebook).toHaveBeenCalled();
    });

    // Dialog should close and success callback should be called
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('shows loading state during authentication', () => {
    mockAuthContext.isLoading = true;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Buttons should be disabled during loading
    expect(screen.getByText('Continue with Google')).toBeDisabled();
    expect(screen.getByText('Continue with Facebook')).toBeDisabled();
    // Get the form button (not the tab) and check if it's disabled
    const signInButtons = screen.getAllByText('Sign In');
    const formButton = signInButtons.find(button => button.getAttribute('type') === 'button');
    expect(formButton).toBeDisabled();
  });

  it('clears error when user switches tabs', () => {
    mockAuthContext.error = 'Some error';

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Switch to sign up tab
    fireEvent.click(screen.getByText('Sign Up'));

    expect(mockAuthContext.clearError).toHaveBeenCalled();
  });

  it('clears error when user starts typing', () => {
    mockAuthContext.error = 'Some error';

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Start typing in email field
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test' } });

    expect(mockAuthContext.clearError).toHaveBeenCalled();
  });

  it('validates form fields before submission', async () => {
    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Try to submit without filling fields
    const signInButtons = screen.getAllByText('Sign In');
    const formButton = signInButtons.find(button => button.getAttribute('type') === 'button');
    fireEvent.click(formButton!);

    // Should show validation errors
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    // Authentication should not be called
    expect(mockAuthContext.signInWithEmail).not.toHaveBeenCalled();
  });

  it('shows sign up form when sign up tab is selected', () => {
    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Switch to sign up tab
    fireEvent.click(screen.getByText('Sign Up'));

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('stays open when sign up fails', async () => {
    const errorMessage = 'Registration failed';
    mockAuthContext.signUp.mockRejectedValue(new Error(errorMessage));
    mockAuthContext.error = errorMessage;

    render(
      <TestWrapper>
        <LoginDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Switch to sign up tab
    fireEvent.click(screen.getByText('Sign Up'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    // Click create account button
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
    });

    // Dialog should still be open and show error
    expect(screen.getByText('Welcome to EconGraph')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
