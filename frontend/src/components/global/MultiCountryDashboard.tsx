import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CompareArrows,
  Delete,
  Add,
  Info,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

// GraphQL queries
const GET_COUNTRIES_WITH_ECONOMIC_DATA = gql`
  query GetCountriesWithEconomicData {
    countriesWithEconomicData {
      country {
        id
        name
        isoCode
        region
        currencyCode
        gdpUsd
      }
      latestGdp
      latestGdpGrowth
      latestInflation
      latestUnemployment
      economicHealthScore
      tradePartners {
        country {
          name
          isoCode
        }
        tradeValueUsd
        relationshipType
      }
    }
  }
`;

// Mock time series data (in production, this would come from GraphQL)
const generateMockTimeSeriesData = (countryCode: string, indicator: string) => {
  const months = [
    '2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06',
    '2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12',
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  ];

  const baseValues: Record<string, Record<string, number>> = {
    'GDP': {
      'USA': 25000, 'CHN': 17500, 'JPN': 5000, 'DEU': 4200, 'GBR': 3100,
      'FRA': 2900, 'IND': 3700, 'ITA': 2100, 'BRA': 2000, 'CAN': 2100,
    },
    'Inflation': {
      'USA': 3.2, 'CHN': 2.1, 'JPN': 1.8, 'DEU': 2.4, 'GBR': 4.1,
      'FRA': 2.9, 'IND': 5.8, 'ITA': 3.5, 'BRA': 4.7, 'CAN': 2.8,
    },
    'Unemployment': {
      'USA': 3.7, 'CHN': 5.2, 'JPN': 2.6, 'DEU': 3.1, 'GBR': 4.2,
      'FRA': 7.3, 'IND': 6.1, 'ITA': 8.2, 'BRA': 9.3, 'CAN': 5.1,
    },
  };

  const baseValue = baseValues[indicator]?.[countryCode] || 100;
  
  return months.map((month, index) => {
    const randomVariation = (Math.random() - 0.5) * 0.2;
    const trendFactor = indicator === 'GDP' ? 1 + (index * 0.005) : 1;
    const seasonalFactor = 1 + Math.sin(index * Math.PI / 6) * 0.05;
    
    return {
      date: month,
      value: baseValue * trendFactor * seasonalFactor * (1 + randomVariation),
    };
  });
};

// Types
interface CountryData {
  id: string;
  name: string;
  isoCode: string;
  region: string;
  currencyCode?: string;
  gdpUsd?: string;
  latestGdp?: string;
  latestGdpGrowth?: string;
  latestInflation?: string;
  latestUnemployment?: string;
  economicHealthScore?: number;
  tradePartners?: Array<{
    country: { name: string; isoCode: string };
    tradeValueUsd: string;
    relationshipType: string;
  }>;
}

interface TimeSeriesPoint {
  date: string;
  value: number;
}

// Component
const MultiCountryDashboard: React.FC = () => {
  const [selectedCountries, setSelectedCountries] = useState<CountryData[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('GDP');
  const [syncCharts, setSyncCharts] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  const { data, loading, error } = useQuery(GET_COUNTRIES_WITH_ECONOMIC_DATA);

  const availableCountries: CountryData[] = data?.countriesWithEconomicData?.map((item: any) => ({
    id: item.country.id,
    name: item.country.name,
    isoCode: item.country.isoCode,
    region: item.country.region,
    currencyCode: item.country.currencyCode,
    gdpUsd: item.country.gdpUsd,
    latestGdp: item.latestGdp,
    latestGdpGrowth: item.latestGdpGrowth,
    latestInflation: item.latestInflation,
    latestUnemployment: item.latestUnemployment,
    economicHealthScore: item.economicHealthScore,
    tradePartners: item.tradePartners,
  })) || [];

  // Initialize with major economies
  useEffect(() => {
    if (availableCountries.length > 0 && selectedCountries.length === 0) {
      const majorEconomies = availableCountries
        .filter(country => ['USA', 'CHN', 'JPN', 'DEU', 'GBR'].includes(country.isoCode))
        .slice(0, 3);
      setSelectedCountries(majorEconomies);
    }
  }, [availableCountries]);

  const handleAddCountry = (country: CountryData | null) => {
    if (country && !selectedCountries.find(c => c.id === country.id)) {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleRemoveCountry = (countryId: string) => {
    setSelectedCountries(selectedCountries.filter(c => c.id !== countryId));
  };

  const getIndicatorColor = (countryIndex: number) => {
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    return colors[countryIndex % colors.length];
  };

  const getTrendIcon = (value?: string, threshold = 0) => {
    if (!value) return <TrendingFlat />;
    const numValue = parseFloat(value);
    if (numValue > threshold) return <TrendingUp color="success" />;
    if (numValue < threshold) return <TrendingDown color="error" />;
    return <TrendingFlat color="warning" />;
  };

  const formatValue = (value?: string, type = 'number') => {
    if (!value) return 'N/A';
    const numValue = parseFloat(value);
    
    switch (type) {
      case 'currency':
        return `$${numValue.toLocaleString()}B`;
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      default:
        return numValue.toLocaleString();
    }
  };

  const generateChartData = () => {
    if (selectedCountries.length === 0) return null;

    const timeSeriesData = selectedCountries.map(country =>
      generateMockTimeSeriesData(country.isoCode, selectedIndicator)
    );

    const labels = timeSeriesData[0]?.map(point => point.date) || [];

    const datasets = selectedCountries.map((country, index) => ({
      label: country.name,
      data: timeSeriesData[index]?.map(point => point.value) || [],
      borderColor: getIndicatorColor(index),
      backgroundColor: getIndicatorColor(index) + '20',
      fill: false,
      tension: 0.4,
    }));

    return { labels, datasets };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedIndicator} Comparison Across Countries`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: selectedIndicator === 'GDP' ? 'Billion USD' : 
                selectedIndicator === 'Inflation' ? 'Percentage' :
                selectedIndicator === 'Unemployment' ? 'Percentage' : 'Value',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time Period',
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading country data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load country data: {error.message}
      </Alert>
    );
  }

  const chartData = generateChartData();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Multi-Country Economic Dashboard
        <Tooltip title="Compare economic indicators across multiple countries in real-time">
          <IconButton size="small">
            <Info />
          </IconButton>
        </Tooltip>
      </Typography>

      {/* Country Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Selected Countries ({selectedCountries.length}/10)
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Autocomplete
            sx={{ minWidth: 250 }}
            options={availableCountries}
            getOptionLabel={(option) => `${option.name} (${option.isoCode})`}
            groupBy={(option) => option.region}
            onChange={(_, value) => handleAddCountry(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Country"
                placeholder="Search countries..."
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {option.name} ({option.isoCode})
                  </Typography>
                  <Chip
                    label={option.region}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </li>
            )}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selectedCountries.map((country, index) => (
            <Chip
              key={country.id}
              label={`${country.name} (${country.isoCode})`}
              onDelete={() => handleRemoveCountry(country.id)}
              color="primary"
              variant="outlined"
              sx={{
                borderColor: getIndicatorColor(index),
                color: getIndicatorColor(index),
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="GDP" onClick={() => setSelectedIndicator('GDP')} />
            <Tab label="Inflation" onClick={() => setSelectedIndicator('Inflation')} />
            <Tab label="Unemployment" onClick={() => setSelectedIndicator('Unemployment')} />
            <Tab label="Trade" onClick={() => setSelectedIndicator('Trade')} />
          </Tabs>

          <FormControlLabel
            control={
              <Switch
                checked={syncCharts}
                onChange={(e) => setSyncCharts(e.target.checked)}
              />
            }
            label="Sync Charts"
          />
        </Box>
      </Paper>

      {selectedCountries.length === 0 ? (
        <Alert severity="info">
          Please select countries to compare their economic indicators.
        </Alert>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {selectedCountries.map((country, index) => (
              <Grid item xs={12} md={6} lg={4} key={country.id}>
                <Card sx={{ height: '100%', border: `2px solid ${getIndicatorColor(index)}20` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: getIndicatorColor(index) }}>
                        {country.name}
                      </Typography>
                      <Chip
                        label={country.region}
                        size="small"
                        sx={{ bgcolor: getIndicatorColor(index) + '20' }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            GDP
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {getTrendIcon(country.latestGdpGrowth)}
                            <Typography variant="h6">
                              {formatValue(country.latestGdp, 'currency')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            Growth: {formatValue(country.latestGdpGrowth, 'percentage')}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Inflation
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {getTrendIcon(country.latestInflation, 2)}
                            <Typography variant="h6">
                              {formatValue(country.latestInflation, 'percentage')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Unemployment
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {getTrendIcon(country.latestUnemployment, 5)}
                            <Typography variant="h6">
                              {formatValue(country.latestUnemployment, 'percentage')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="textSecondary">
                            Health Score
                          </Typography>
                          <Typography variant="h6" sx={{
                            color: (country.economicHealthScore || 0) > 70 ? 'success.main' :
                                   (country.economicHealthScore || 0) > 50 ? 'warning.main' : 'error.main'
                          }}>
                            {(country.economicHealthScore || 0).toFixed(1)}/100
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Top Trade Partners */}
                    {country.tradePartners && country.tradePartners.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary" gutterBottom>
                          Top Trade Partners:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {country.tradePartners.slice(0, 3).map((partner, idx) => (
                            <Chip
                              key={idx}
                              label={partner.country.isoCode}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Time Series Chart */}
          <Paper sx={{ p: 2, height: 500 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareArrows />
              {selectedIndicator} Trends Comparison
            </Typography>
            
            {chartData && (
              <Box sx={{ height: 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            )}
          </Paper>

          {/* Correlation Matrix (placeholder) */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Economic Correlation Matrix
            </Typography>
            <Alert severity="info">
              Correlation matrix showing relationships between selected countries' {selectedIndicator.toLowerCase()} indicators will be displayed here.
              This feature calculates Pearson correlation coefficients between country pairs.
            </Alert>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MultiCountryDashboard;
