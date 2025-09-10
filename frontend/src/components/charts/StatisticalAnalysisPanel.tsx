/**
 * REQUIREMENT: Professional statistical analysis interface  
 * PURPOSE: Provide Bloomberg Terminal-level statistical analysis capabilities
 * This enables advanced economic research and data analysis workflows
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';

interface StatisticalAnalysisPanelProps {
  seriesIds: string[];
  onExport?: (format: string, analysisType: string) => void;
  onSave?: (analysisName: string, results: any) => void;
}

interface CorrelationResult {
  series1Id: string;
  series2Id: string;
  coefficient: number;
  significance: string;
  pValue: number;
}

interface RegressionResult {
  independentSeries: string;
  dependentSeries: string;
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
}

interface TrendResult {
  seriesId: string;
  direction: 'upward' | 'downward' | 'sideways';
  strength: number;
  slope: number;
  volatility: number;
}

interface StatisticalSummary {
  seriesId: string;
  count: number;
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
}

/**
 * Professional statistical analysis panel with comprehensive analysis tools
 * REQUIREMENT: Enable advanced economic research capabilities
 */
const StatisticalAnalysisPanel: React.FC<StatisticalAnalysisPanelProps> = ({
  seriesIds,
  onExport,
  onSave,
}) => {
  // State management
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeAnalysis, setActiveAnalysis] = React.useState<'correlation' | 'regression' | 'trends' | 'summary'>('correlation');
  const [correlationResults, setCorrelationResults] = React.useState<CorrelationResult[]>([]);
  const [regressionResults, setRegressionResults] = React.useState<RegressionResult[]>([]);
  const [trendResults, setTrendResults] = React.useState<TrendResult[]>([]);
  const [summaryResults, setSummaryResults] = React.useState<StatisticalSummary[]>([]);
  const [selectedSeries1, setSelectedSeries1] = React.useState<string>(seriesIds[0] || '');
  const [selectedSeries2, setSelectedSeries2] = React.useState<string>(seriesIds[1] || '');
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

  // Mock series titles for display
  const seriesTitles: Record<string, string> = {
    'gdp-real': 'Real GDP',
    'unemployment-rate': 'Unemployment Rate', 
    'inflation-rate': 'Inflation Rate',
    'fed-funds-rate': 'Federal Funds Rate',
  };

  // Mock data - in real app would come from GraphQL queries
  const mockCorrelationData: CorrelationResult[] = React.useMemo(() => {
    if (seriesIds.length < 2) return [];
    
    return [
      {
        series1Id: 'gdp-real',
        series2Id: 'unemployment-rate',
        coefficient: -0.85,
        significance: 'Highly significant (p < 0.001)',
        pValue: 0.0001,
      },
      {
        series1Id: 'gdp-real', 
        series2Id: 'fed-funds-rate',
        coefficient: 0.72,
        significance: 'Significant (p < 0.01)',
        pValue: 0.005,
      },
    ];
  }, [seriesIds]);

  const mockRegressionData: RegressionResult[] = React.useMemo(() => [
    {
      independentSeries: 'gdp-real',
      dependentSeries: 'unemployment-rate',
      slope: -0.15,
      intercept: 7.2,
      rSquared: 0.73,
      standardError: 0.24,
    },
  ], []);

  const mockTrendData: TrendResult[] = React.useMemo(() => 
    seriesIds.map(seriesId => ({
      seriesId,
      direction: seriesId === 'gdp-real' ? 'upward' as const : 
                seriesId === 'unemployment-rate' ? 'sideways' as const : 'upward' as const,
      strength: seriesId === 'gdp-real' ? 0.82 : 0.45,
      slope: seriesId === 'gdp-real' ? 0.045 : -0.012,
      volatility: seriesId === 'gdp-real' ? 0.18 : 0.34,
    }))
  , [seriesIds]);

  const mockSummaryData: StatisticalSummary[] = React.useMemo(() =>
    seriesIds.map(seriesId => ({
      seriesId,
      count: 20,
      mean: seriesId === 'gdp-real' ? 25400 : 3.6,
      median: seriesId === 'gdp-real' ? 25350 : 3.5,
      standardDeviation: seriesId === 'gdp-real' ? 450 : 0.3,
      min: seriesId === 'gdp-real' ? 24800 : 3.1,
      max: seriesId === 'gdp-real' ? 26100 : 4.2,
      skewness: 0.12,
      kurtosis: -0.18,
    }))
  , [seriesIds]);

  // Load analysis results
  React.useEffect(() => {
    setCorrelationResults(mockCorrelationData);
    setRegressionResults(mockRegressionData);
    setTrendResults(mockTrendData);
    setSummaryResults(mockSummaryData);
  }, [mockCorrelationData, mockRegressionData, mockTrendData, mockSummaryData]);

  // Get trend icon based on direction
  const getTrendIcon = (direction: string, strength: number) => {
    const color = strength > 0.7 ? 'primary' : strength > 0.4 ? 'warning' : 'action';
    
    switch (direction) {
      case 'upward':
        return <TrendingUpIcon color={color} />;
      case 'downward':
        return <TrendingDownIcon color={color} />;
      default:
        return <TrendingFlatIcon color={color} />;
    }
  };

  // Format correlation coefficient with color coding
  const formatCorrelation = (coefficient: number) => {
    const absCoeff = Math.abs(coefficient);
    const color: 'success' | 'warning' | 'error' = absCoeff > 0.8 ? 'success' : absCoeff > 0.5 ? 'warning' : 'error';
    const strength = absCoeff > 0.8 ? 'Strong' : absCoeff > 0.5 ? 'Moderate' : 'Weak';
    
    return { coefficient, color, strength };
  };

  if (seriesIds.length === 0) {
    return (
      <Alert severity="info">
        Select at least one economic series to begin statistical analysis
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon color="primary" />
                <Typography variant="h5">Statistical Analysis</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Professional-grade statistical tools for {seriesIds.length} series
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setExportDialogOpen(true)}
                  size="small"
                >
                  Export Analysis
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialogOpen(true)}
                  size="small"
                >
                  Save Analysis
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Analysis Type Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analysis Type
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Analysis</InputLabel>
            <Select
              value={activeAnalysis}
              label="Select Analysis"
              onChange={(e) => setActiveAnalysis(e.target.value as any)}
              data-testid="analysis-type-selector"
            >
              <MenuItem value="correlation">Correlation Analysis</MenuItem>
              <MenuItem value="regression">Regression Analysis</MenuItem>
              <MenuItem value="trends">Trend Analysis</MenuItem>
              <MenuItem value="summary">Statistical Summary</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      {activeAnalysis === 'correlation' && (
        <Accordion expanded defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Correlation Analysis</Typography>
            <Typography variant="caption" sx={{ ml: 2 }}>
              {correlationResults.length} correlations calculated
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {seriesIds.length < 2 ? (
              <Alert severity="warning">
                Need at least 2 series for correlation analysis
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table data-testid="correlation-table">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Series 1</strong></TableCell>
                      <TableCell><strong>Series 2</strong></TableCell>
                      <TableCell><strong>Correlation</strong></TableCell>
                      <TableCell><strong>Strength</strong></TableCell>
                      <TableCell><strong>Significance</strong></TableCell>
                      <TableCell><strong>P-Value</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {correlationResults.map((result, index) => {
                      const { coefficient, color, strength } = formatCorrelation(result.coefficient);
                      return (
                        <TableRow key={index} data-testid={`correlation-row-${index}`}>
                          <TableCell>{seriesTitles[result.series1Id] || result.series1Id}</TableCell>
                          <TableCell>{seriesTitles[result.series2Id] || result.series2Id}</TableCell>
                          <TableCell>
                            <Chip
                              label={coefficient.toFixed(3)}
                              color={color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={`${color}.main`}>
                              {strength}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.significance}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(4)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Regression Analysis */}
      {activeAnalysis === 'regression' && (
        <Accordion expanded defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Regression Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {seriesIds.length < 2 ? (
              <Alert severity="warning">
                Need at least 2 series for regression analysis
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Series Selection */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Series for Regression
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Independent Variable (X)</InputLabel>
                    <Select
                      value={selectedSeries1}
                      label="Independent Variable (X)"
                      onChange={(e) => setSelectedSeries1(e.target.value)}
                      data-testid="independent-series-selector"
                    >
                      {seriesIds.map(seriesId => (
                        <MenuItem key={seriesId} value={seriesId}>
                          {seriesTitles[seriesId] || seriesId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dependent Variable (Y)</InputLabel>
                    <Select
                      value={selectedSeries2}
                      label="Dependent Variable (Y)"
                      onChange={(e) => setSelectedSeries2(e.target.value)}
                      data-testid="dependent-series-selector"
                    >
                      {seriesIds.map(seriesId => (
                        <MenuItem key={seriesId} value={seriesId}>
                          {seriesTitles[seriesId] || seriesId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<CalculateIcon />}
                    sx={{ mt: 2 }}
                    data-testid="calculate-regression-button"
                  >
                    Calculate Regression
                  </Button>
                </Grid>

                {/* Regression Results */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Regression Results
                  </Typography>
                  {regressionResults.length > 0 && (
                    <Paper sx={{ p: 2 }} data-testid="regression-results">
                      {regressionResults.map((result, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            <strong>{seriesTitles[result.dependentSeries]}</strong> vs <strong>{seriesTitles[result.independentSeries]}</strong>
                          </Typography>
                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption">Slope (β₁)</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {result.slope.toFixed(4)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption">Intercept (β₀)</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {result.intercept.toFixed(4)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption">R-Squared</Typography>
                              <Chip
                                label={`${(result.rSquared * 100).toFixed(1)}%`}
                                color={result.rSquared > 0.8 ? 'success' : result.rSquared > 0.5 ? 'warning' : 'error'}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption">Std Error</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {result.standardError.toFixed(4)}
                              </Typography>
                            </Grid>
                          </Grid>
                          <Typography variant="caption" color="text.secondary">
                            Equation: Y = {result.slope.toFixed(4)}X + {result.intercept.toFixed(4)}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Grid>
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Trend Analysis */}
      {activeAnalysis === 'trends' && (
        <Accordion expanded defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Trend Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {trendResults.map((result) => (
                <Grid item xs={12} md={6} key={result.seriesId}>
                  <Card variant="outlined" data-testid={`trend-card-${result.seriesId}`}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getTrendIcon(result.direction, result.strength)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {seriesTitles[result.seriesId] || result.seriesId}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption">Direction</Typography>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {result.direction}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Strength</Typography>
                          <Chip
                            label={`${(result.strength * 100).toFixed(1)}%`}
                            color={result.strength > 0.7 ? 'success' : result.strength > 0.4 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Slope</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {result.slope.toFixed(6)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Volatility</Typography>
                          <Typography variant="body2">
                            {(result.volatility * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Statistical Summary */}
      {activeAnalysis === 'summary' && (
        <Accordion expanded defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Descriptive Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper}>
              <Table data-testid="summary-statistics-table">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Series</strong></TableCell>
                    <TableCell><strong>Count</strong></TableCell>
                    <TableCell><strong>Mean</strong></TableCell>
                    <TableCell><strong>Median</strong></TableCell>
                    <TableCell><strong>Std Dev</strong></TableCell>
                    <TableCell><strong>Min</strong></TableCell>
                    <TableCell><strong>Max</strong></TableCell>
                    <TableCell><strong>Skewness</strong></TableCell>
                    <TableCell><strong>Kurtosis</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryResults.map((summary) => (
                    <TableRow key={summary.seriesId} data-testid={`summary-row-${summary.seriesId}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {seriesTitles[summary.seriesId] || summary.seriesId}
                        </Typography>
                      </TableCell>
                      <TableCell>{summary.count}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{summary.mean.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{summary.median.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{summary.standardDeviation.toFixed(2)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{summary.min.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{summary.max.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={summary.skewness.toFixed(3)}
                          color={Math.abs(summary.skewness) < 0.5 ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={summary.kurtosis.toFixed(3)}
                          color={Math.abs(summary.kurtosis) < 1 ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Statistical Analysis</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose export format for your statistical analysis results
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onExport?.('csv', activeAnalysis)}
                data-testid="export-csv-button"
              >
                CSV
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onExport?.('xlsx', activeAnalysis)}
                data-testid="export-excel-button"
              >
                Excel
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onExport?.('pdf', activeAnalysis)}
                data-testid="export-pdf-button"
              >
                PDF Report
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Save Analysis Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Statistical Analysis</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Analysis Name"
            placeholder="My Economic Analysis"
            sx={{ mt: 1 }}
            data-testid="analysis-name-input"
          />
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            This analysis includes:
          </Typography>
          <ul>
            <li>Series: {seriesIds.map(id => seriesTitles[id] || id).join(', ')}</li>
            <li>Analysis Type: {activeAnalysis}</li>
            <li>Results: {
              activeAnalysis === 'correlation' ? `${correlationResults.length} correlations` :
              activeAnalysis === 'trends' ? `${trendResults.length} trend analyses` :
              activeAnalysis === 'summary' ? `${summaryResults.length} statistical summaries` :
              `${regressionResults.length} regression analyses`
            }</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              onSave?.('My Analysis', { 
                type: activeAnalysis, 
                seriesIds, 
                results: activeAnalysis === 'correlation' ? correlationResults : 
                         activeAnalysis === 'trends' ? trendResults :
                         activeAnalysis === 'summary' ? summaryResults : regressionResults
              });
              setSaveDialogOpen(false);
            }}
            data-testid="save-analysis-button"
          >
            Save Analysis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          data-testid="analysis-loading"
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Running statistical analysis...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatisticalAnalysisPanel;