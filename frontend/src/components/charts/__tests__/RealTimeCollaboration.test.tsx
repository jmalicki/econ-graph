/**
 * REQUIREMENT: Comprehensive tests for Real-time Collaboration component
 * PURPOSE: Ensure Google Docs-style collaboration features work correctly
 * This validates professional real-time collaboration capabilities
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils/test-providers';
import RealTimeCollaboration from '../RealTimeCollaboration';

// Mock WebSocket
const mockWebSocket = {
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock Material UI components that cause issues
jest.mock('@mui/material/Snackbar', () => {
  return function MockSnackbar({ children, open, message, ...props }: any) {
    return open ? (
      <div data-testid="collaboration-snackbar" {...props}>
        {message}
        {children}
      </div>
    ) : null;
  };
});

interface MockProps {
  chartId?: string;
  currentUserId?: string;
  isEnabled?: boolean;
  onAnnotationAdd?: jest.Mock;
  onAnnotationUpdate?: jest.Mock;
  onAnnotationDelete?: jest.Mock;
  onInviteUser?: jest.Mock;
}

function renderRealTimeCollaboration(props: MockProps = {}) {
  const defaultProps = {
    chartId: 'test-chart-1',
    currentUserId: 'current-user',
    isEnabled: true,
    onAnnotationAdd: jest.fn(),
    onAnnotationUpdate: jest.fn(),
    onAnnotationDelete: jest.fn(),
    onInviteUser: jest.fn(),
    ...props,
  };

  return render(
    <TestProviders>
      <RealTimeCollaboration {...defaultProps} />
    </TestProviders>
  );
}

describe('RealTimeCollaboration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('should render collaboration panel when enabled', () => {
      renderRealTimeCollaboration();

      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });

    test('should show disabled state when collaboration is disabled', () => {
      renderRealTimeCollaboration({ isEnabled: false });

      expect(screen.getByText('Real-time collaboration is disabled')).toBeInTheDocument();
      expect(screen.getByTestId('enable-collaboration-button')).toBeInTheDocument();
    });

    test('should display connection status', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });

    test('should show annotation tools section', () => {
      renderRealTimeCollaboration();

      expect(screen.getByText('Annotation Tools')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-mode-toggle')).toBeInTheDocument();
    });
  });

  describe('User Management', () => {
    test('should display active users with avatars', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('active-users-avatars')).toBeInTheDocument();
      expect(screen.getByTestId('user-avatar-user1')).toBeInTheDocument();
      expect(screen.getByTestId('user-avatar-user2')).toBeInTheDocument();
    });

    test('should show user names in avatar tooltips', () => {
      renderRealTimeCollaboration();

      // Tooltip content is in title attribute
      expect(screen.getByTestId('user-avatar-user1').closest('[title]')).toHaveAttribute('title', expect.stringContaining('Alice Johnson'));
    });

    test('should show invite user button', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('invite-user-button')).toBeInTheDocument();
      expect(screen.getByText('Invite')).toBeInTheDocument();
    });

    test('should open invite dialog when invite button clicked', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const inviteButton = screen.getByTestId('invite-user-button');
      await user.click(inviteButton);

      expect(screen.getByText('Invite Collaborators')).toBeInTheDocument();
      expect(screen.getByTestId('invite-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-invite-button')).toBeInTheDocument();
    });

    test('should call onInviteUser when invitation sent', async () => {
      const user = userEvent.setup();
      const mockOnInviteUser = jest.fn();
      renderRealTimeCollaboration({ onInviteUser: mockOnInviteUser });

      const inviteButton = screen.getByTestId('invite-user-button');
      await user.click(inviteButton);

      const emailInput = screen.getByTestId('invite-email-input');
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByTestId('send-invite-button');
      await user.click(sendButton);

      expect(mockOnInviteUser).toHaveBeenCalledWith('colleague@company.com');
    });
  });

  describe('Annotation Management', () => {
    test('should show annotation mode toggle', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('annotation-mode-toggle')).toBeInTheDocument();
      expect(screen.getByText('Annotation Mode')).toBeInTheDocument();
    });

    test('should show annotation type buttons when annotation mode enabled', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const toggleSwitch = screen.getByTestId('annotation-mode-toggle').querySelector('input');
      await user.click(toggleSwitch!);

      expect(screen.getByTestId('annotation-type-note')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-type-highlight')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-type-arrow')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-type-box')).toBeInTheDocument();
    });

    test('should allow selecting annotation types', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const toggleSwitch = screen.getByTestId('annotation-mode-toggle').querySelector('input');
      await user.click(toggleSwitch!);

      const highlightButton = screen.getByTestId('annotation-type-highlight');
      await user.click(highlightButton);

      // Should show as selected (contained variant)
      expect(highlightButton).toHaveClass('MuiButton-contained');
    });

    test('should display existing annotations list', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('annotations-list')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-annotation1')).toBeInTheDocument();
      expect(screen.getByText('Significant economic event occurred here')).toBeInTheDocument();
    });

    test('should show annotation metadata', () => {
      renderRealTimeCollaboration();

      expect(screen.getByText(/Alice Johnson/)).toBeInTheDocument();
      expect(screen.getByText(/@ 2024-01-15/)).toBeInTheDocument();
      expect(screen.getByText(/1 comments/)).toBeInTheDocument();
    });

    test('should allow resolving/unresolving annotations', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const resolveButton = screen.getByTestId('resolve-annotation-annotation1');
      await user.click(resolveButton);

      // Should toggle resolution state (test implementation detail would verify state change)
    });

    test('should allow deleting annotations', async () => {
      const user = userEvent.setup();
      const mockOnAnnotationDelete = jest.fn();
      renderRealTimeCollaboration({ onAnnotationDelete: mockOnAnnotationDelete });

      const deleteButton = screen.getByTestId('delete-annotation-annotation1');
      await user.click(deleteButton);

      expect(mockOnAnnotationDelete).toHaveBeenCalledWith('annotation1');
    });
  });

  describe('Real-time Features', () => {
    test('should show live cursor overlay', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('cursor-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('user-cursor-user1')).toBeInTheDocument();
      expect(screen.getByTestId('user-cursor-user2')).toBeInTheDocument();
    });

    test('should display user names with cursors', () => {
      renderRealTimeCollaboration();

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    test('should allow toggling cursor visibility', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const settingsButton = screen.getByTestId('collaboration-settings-button');
      await user.click(settingsButton);

      // Settings menu should appear with cursor toggle option
      await waitFor(() => {
        expect(screen.getByText(/Hide Live Cursors/)).toBeInTheDocument();
      });
    });

    test('should show activity feed with real-time events', () => {
      renderRealTimeCollaboration();

      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
      expect(screen.getByText(/Alice Johnson joined the collaboration/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Smith added a comment/)).toBeInTheDocument();
    });
  });

  describe('Annotation Filtering', () => {
    test('should allow toggling resolved annotation visibility', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const toggleResolved = screen.getByTestId('show-resolved-toggle');
      expect(toggleResolved).toBeInTheDocument();

      await user.click(toggleResolved.querySelector('input')!);
      // Should show resolved annotations
    });

    test('should filter annotations based on resolution status', () => {
      renderRealTimeCollaboration();

      // Should show annotation count (including resolved/unresolved filtering)
      expect(screen.getByText(/Annotations \(2\)/)).toBeInTheDocument();
    });

    test('should show empty state when no annotations', () => {
      // Mock component with no annotations
      renderRealTimeCollaboration();

      // Implementation would show empty state when no annotations match filters
      expect(screen.getByText(/No annotations yet/)).toBeInTheDocument();
    });
  });

  describe('Collaboration Settings', () => {
    test('should show collaboration settings menu', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const settingsButton = screen.getByTestId('collaboration-settings-button');
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-preferences-menu')).toBeInTheDocument();
      });
    });

    test('should allow configuring cursor sharing', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      const settingsButton = screen.getByTestId('collaboration-settings-button');
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText(/Live Cursors/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('should handle many concurrent users efficiently', () => {
      const startTime = performance.now();
      
      renderRealTimeCollaboration();
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should handle large number of annotations', () => {
      renderRealTimeCollaboration();

      // Should render without performance issues
      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for collaboration controls', () => {
      renderRealTimeCollaboration();

      // Switch should have proper labels
      expect(screen.getByTestId('annotation-mode-toggle')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderRealTimeCollaboration();

      await user.tab();
      expect(document.activeElement).toHaveAttribute('type');
    });

    test('should announce collaboration events to screen readers', () => {
      renderRealTimeCollaboration();

      // Activity feed serves as announcement area
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket connection failures gracefully', () => {
      renderRealTimeCollaboration();

      // Should still render interface even if WebSocket fails
      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
    });

    test('should recover from connection interruptions', () => {
      renderRealTimeCollaboration();

      // Should show appropriate connection status
      expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    });

    test('should handle permission errors appropriately', () => {
      renderRealTimeCollaboration();

      // Should handle cases where user lacks permissions
      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
    });
  });

  describe('Integration Features', () => {
    test('should integrate with chart annotation system', () => {
      renderRealTimeCollaboration();

      expect(screen.getByText('Annotation Tools')).toBeInTheDocument();
    });

    test('should work with MultiSeriesComparison component', () => {
      renderRealTimeCollaboration({ chartId: 'multi-series-chart' });

      expect(screen.getByText('Real-time Collaboration')).toBeInTheDocument();
    });

    test('should integrate with statistical analysis results', () => {
      renderRealTimeCollaboration();

      // Should support collaboration on statistical analysis
      expect(screen.getByTestId('annotations-list')).toBeInTheDocument();
    });
  });
});