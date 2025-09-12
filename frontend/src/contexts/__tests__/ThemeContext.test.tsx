/**
 * REQUIREMENT: Test theme context functionality
 * PURPOSE: Verify theme switching and persistence works correctly
 * This ensures user preferences are properly managed and applied
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { AuthProvider } from '../AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the theme context
const TestComponent: React.FC = () => {
  const { currentTheme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{currentTheme}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
    </div>
  );
};

// Wrapper component that provides both contexts
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('should initialize with light theme by default', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('should load theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('should toggle theme correctly', async () => {
    localStorageMock.getItem.mockReturnValue('light');

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should set theme to light', async () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    act(() => {
      screen.getByTestId('set-light').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should set theme to dark', async () => {
    localStorageMock.getItem.mockReturnValue('light');

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    act(() => {
      screen.getByTestId('set-dark').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
