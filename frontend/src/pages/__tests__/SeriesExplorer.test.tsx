// REQUIREMENT: Comprehensive unit tests for SeriesExplorer page component
// PURPOSE: Test search functionality, filtering, and user interactions
// This ensures the main series discovery interface works correctly

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../test-utils/test-providers';
import { SeriesExplorer } from '../SeriesExplorer';
import { mockSearchResults, mockDataSources, mockSuggestions } from '../../test-utils/mocks/data';

function renderSeriesExplorer() {
  return render(
    <TestProviders>
      <SeriesExplorer />
    </TestProviders>
  );
}

describe('SeriesExplorer', () => {
  test('should render search interface successfully', () => {
    // REQUIREMENT: Test basic page rendering and search interface
    // PURPOSE: Verify that users can access the search functionality
    // This ensures the primary discovery interface is available
    
    renderSeriesExplorer();
    
    // Verify main elements are present
    expect(screen.getByRole('heading', { name: /series explorer/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search economic series/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('should perform search when user types query', async () => {
    // REQUIREMENT: Test search functionality with user input
    // PURPOSE: Verify that search is triggered by user input
    // This tests the core search workflow
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    
    // Type search query
    await user.type(searchInput, 'GDP growth');
    
    // Verify input value
    expect(searchInput).toHaveValue('GDP growth');
    
    // Search should be triggered automatically (debounced)
    await waitFor(() => {
      expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });
  });

  test('should display search results', async () => {
    // REQUIREMENT: Test search results display
    // PURPOSE: Verify that search results are shown to users
    // This ensures users can see and interact with search results
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'GDP');
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText(/real gross domestic product/i)).toBeInTheDocument();
    });
    
    // Verify result elements
    expect(screen.getByText(/gdpc1/i)).toBeInTheDocument(); // External ID
    expect(screen.getByText(/quarterly/i)).toBeInTheDocument(); // Frequency
  });

  test('should show search suggestions while typing', async () => {
    // REQUIREMENT: Test autocomplete suggestions functionality
    // PURPOSE: Verify that users get helpful suggestions while typing
    // This improves search discoverability and user experience
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    
    // Type partial query to trigger suggestions
    await user.type(searchInput, 'GDP');
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText(/gross domestic product/i)).toBeInTheDocument();
    });
    
    // Should show suggestion types and confidence
    expect(screen.getByText(/completion/i)).toBeInTheDocument();
  });

  test('should apply search filters', async () => {
    // REQUIREMENT: Test search filtering functionality
    // PURPOSE: Verify that users can refine search results with filters
    // This supports focused discovery of relevant series
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Open filters panel
    const filtersButton = screen.getByText(/filters/i);
    await user.click(filtersButton);
    
    // Apply data source filter
    const sourceFilter = screen.getByLabelText(/data source/i);
    await user.click(sourceFilter);
    await user.click(screen.getByText(/federal reserve/i));
    
    // Apply frequency filter
    const frequencyFilter = screen.getByLabelText(/frequency/i);
    await user.click(frequencyFilter);
    await user.click(screen.getByText(/monthly/i));
    
    // Verify filters are applied
    expect(screen.getByDisplayValue(/federal reserve/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/monthly/i)).toBeInTheDocument();
  });

  test('should handle sorting options', async () => {
    // REQUIREMENT: Test result sorting functionality
    // PURPOSE: Verify that users can sort results by different criteria
    // This helps users find the most relevant or recent series
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Perform search first
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'economic');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    });
    
    // Change sort order
    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.click(sortSelect);
    await user.click(screen.getByText(/title/i));
    
    // Verify sort option is selected
    expect(screen.getByDisplayValue(/title/i)).toBeInTheDocument();
  });

  test('should display relevance scores for search results', async () => {
    // REQUIREMENT: Test relevance score display
    // PURPOSE: Verify that users can see how relevant each result is
    // This helps users understand search quality and result ranking
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'GDP');
    
    await waitFor(() => {
      expect(screen.getByText(/relevance/i)).toBeInTheDocument();
    });
    
    // Should show relevance scores
    expect(screen.getByText(/95%/i)).toBeInTheDocument(); // High relevance
    expect(screen.getByText(/88%/i)).toBeInTheDocument(); // Lower relevance
  });

  test('should show spelling correction suggestions', async () => {
    // REQUIREMENT: Test spelling correction functionality
    // PURPOSE: Verify that users get helpful corrections for typos
    // This improves search success rate despite spelling errors
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    
    // Type query with spelling error
    await user.type(searchInput, 'unemploymnt'); // Missing 'e'
    
    await waitFor(() => {
      expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
      expect(screen.getByText(/unemployment/i)).toBeInTheDocument();
    });
    
    // Should allow clicking on suggestion
    const suggestion = screen.getByText(/unemployment/i);
    await user.click(suggestion);
    
    expect(searchInput).toHaveValue('unemployment');
  });

  test('should handle empty search results', async () => {
    // REQUIREMENT: Test empty results handling
    // PURPOSE: Verify appropriate messaging when no results are found
    // This provides helpful feedback for unsuccessful searches
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'nonexistent-economic-series-xyz');
    
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
    
    // Should suggest alternative actions
    expect(screen.getByText(/try different keywords/i)).toBeInTheDocument();
    expect(screen.getByText(/check spelling/i)).toBeInTheDocument();
  });

  test('should navigate to series detail on click', async () => {
    // REQUIREMENT: Test navigation to series detail page
    // PURPOSE: Verify that users can access detailed series information
    // This enables deeper exploration of specific series
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Perform search
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'GDP');
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/real gross domestic product/i)).toBeInTheDocument();
    });
    
    // Click on result
    const resultLink = screen.getByText(/real gross domestic product/i);
    await user.click(resultLink);
    
    // Should navigate to detail page (this would be tested with router mocking)
    expect(resultLink.closest('a')).toHaveAttribute('href', '/series/test-series-1');
  });

  test('should show advanced search options', async () => {
    // REQUIREMENT: Test advanced search functionality
    // PURPOSE: Verify that power users can access advanced search features
    // This supports sophisticated search scenarios
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Open advanced search
    const advancedButton = screen.getByText(/advanced search/i);
    await user.click(advancedButton);
    
    // Should show advanced options
    expect(screen.getByLabelText(/similarity threshold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include inactive series/i)).toBeInTheDocument();
    
    // Test similarity threshold adjustment
    const thresholdSlider = screen.getByLabelText(/similarity threshold/i);
    fireEvent.change(thresholdSlider, { target: { value: '0.5' } });
    
    expect(thresholdSlider).toHaveValue('0.5');
  });

  test('should handle search pagination', async () => {
    // REQUIREMENT: Test search result pagination
    // PURPOSE: Verify that users can navigate through large result sets
    // This ensures scalability for comprehensive searches
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Perform search that returns many results
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'economic');
    
    await waitFor(() => {
      expect(screen.getByText(/showing 1-50 of/i)).toBeInTheDocument();
    });
    
    // Navigate to next page
    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);
    
    // Should show next page
    expect(screen.getByText(/showing 51-100 of/i)).toBeInTheDocument();
  });

  test('should save and restore search preferences', async () => {
    // REQUIREMENT: Test search preference persistence
    // PURPOSE: Verify that user preferences are remembered across sessions
    // This improves user experience by maintaining preferred settings
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Set preferences
    const filtersButton = screen.getByText(/filters/i);
    await user.click(filtersButton);
    
    const sourceFilter = screen.getByLabelText(/data source/i);
    await user.click(sourceFilter);
    await user.click(screen.getByText(/federal reserve/i));
    
    // Preferences should be saved to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'searchPreferences',
      expect.stringContaining('federal reserve')
    );
  });

  test('should show search statistics', async () => {
    // REQUIREMENT: Test search statistics display
    // PURPOSE: Verify that users can see search performance metrics
    // This provides transparency about search quality and coverage
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'GDP');
    
    await waitFor(() => {
      expect(screen.getByText(/found 3 results in \d+ms/i)).toBeInTheDocument();
    });
    
    // Should show fuzzy matching indicator when applicable
    expect(screen.getByText(/includes fuzzy matches/i)).toBeInTheDocument();
  });

  test('should handle keyboard shortcuts', async () => {
    // REQUIREMENT: Test keyboard accessibility and shortcuts
    // PURPOSE: Verify that power users can navigate efficiently with keyboard
    // This improves accessibility and user productivity
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    
    // Test Ctrl+K to focus search (common shortcut)
    await user.keyboard('{Control>}k{/Control}');
    expect(searchInput).toHaveFocus();
    
    // Test Escape to clear search
    await user.type(searchInput, 'test query');
    await user.keyboard('{Escape}');
    expect(searchInput).toHaveValue('');
  });

  test('should show data source information in results', async () => {
    // REQUIREMENT: Test data source attribution in results
    // PURPOSE: Verify that users can see where data comes from
    // This ensures transparency and helps users assess data quality
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'GDP');
    
    await waitFor(() => {
      expect(screen.getByText(/federal reserve economic data/i)).toBeInTheDocument();
    });
    
    // Should show data source badges or indicators
    expect(screen.getByText(/fred/i)).toBeInTheDocument();
    expect(screen.getByText(/quarterly/i)).toBeInTheDocument();
  });

  test('should handle search export functionality', async () => {
    // REQUIREMENT: Test search result export
    // PURPOSE: Verify that users can export search results for external use
    // This supports data portability and integration workflows
    
    const user = userEvent.setup();
    renderSeriesExplorer();
    
    // Perform search
    const searchInput = screen.getByPlaceholderText(/search economic series/i);
    await user.type(searchInput, 'economic');
    
    await waitFor(() => {
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    });
    
    // Find and click export button
    const exportButton = screen.getByText(/export results/i);
    await user.click(exportButton);
    
    // Should show export options
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
    expect(screen.getByText(/json/i)).toBeInTheDocument();
  });
});
