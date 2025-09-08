import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Info, ZoomIn, ZoomOut, RestartAlt } from '@mui/icons-material';
import * as d3 from 'd3';

// Types for the component
interface CountryData {
  id: string;
  name: string;
  isoAlpha2: string;
  isoAlpha3: string;
  latitude: number;
  longitude: number;
  gdpUsd?: number;
  population?: number;
}

interface CorrelationData {
  countryAId: string;
  countryBId: string;
  correlationCoefficient: number;
  pValue?: number;
  countryA: { name: string; isoAlpha2: string };
  countryB: { name: string; isoAlpha2: string };
}

// Sample data for demo purposes
const sampleCountries: CountryData[] = [
  { id: '1', name: 'United States', isoAlpha2: 'US', isoAlpha3: 'USA', latitude: 39.8283, longitude: -98.5795, gdpUsd: 23000000000000, population: 331000000 },
  { id: '2', name: 'China', isoAlpha2: 'CN', isoAlpha3: 'CHN', latitude: 35.8617, longitude: 104.1954, gdpUsd: 17700000000000, population: 1441000000 },
  { id: '3', name: 'Japan', isoAlpha2: 'JP', isoAlpha3: 'JPN', latitude: 36.2048, longitude: 138.2529, gdpUsd: 5000000000000, population: 126000000 },
  { id: '4', name: 'Germany', isoAlpha2: 'DE', isoAlpha3: 'DEU', latitude: 51.1657, longitude: 10.4515, gdpUsd: 4200000000000, population: 83000000 },
  { id: '5', name: 'United Kingdom', isoAlpha2: 'GB', isoAlpha3: 'GBR', latitude: 55.3781, longitude: -3.4360, gdpUsd: 3100000000000, population: 67000000 },
];

const sampleCorrelations: CorrelationData[] = [
  {
    countryAId: '1',
    countryBId: '2',
    correlationCoefficient: 0.75,
    pValue: 0.001,
    countryA: { name: 'United States', isoAlpha2: 'US' },
    countryB: { name: 'China', isoAlpha2: 'CN' }
  },
  {
    countryAId: '1',
    countryBId: '3',
    correlationCoefficient: 0.68,
    pValue: 0.002,
    countryA: { name: 'United States', isoAlpha2: 'US' },
    countryB: { name: 'Japan', isoAlpha2: 'JP' }
  },
  {
    countryAId: '2',
    countryBId: '4',
    correlationCoefficient: 0.62,
    pValue: 0.005,
    countryA: { name: 'China', isoAlpha2: 'CN' },
    countryB: { name: 'Germany', isoAlpha2: 'DE' }
  },
];

const GlobalEconomicNetworkMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('gdp');
  const [minCorrelation, setMinCorrelation] = useState<number>(0.5);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize the map
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 500;
    
    // Set up projection
    const projection = d3.geoNaturalEarth1()
      .scale(130)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create main group
    const g = svg.append('g');

    // Add world map background (simplified)
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f0f8ff');

    // Add countries as circles (simplified for demo)
    const countries = g.selectAll('.country')
      .data(sampleCountries)
      .enter()
      .append('circle')
      .attr('class', 'country')
      .attr('cx', d => projection([d.longitude, d.latitude])?.[0] || 0)
      .attr('cy', d => projection([d.longitude, d.latitude])?.[1] || 0)
      .attr('r', d => Math.sqrt((d.gdpUsd || 0) / 1e12) * 8 + 5)
      .attr('fill', '#4CAF50')
      .attr('stroke', '#2E7D32')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCountry(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt((d.gdpUsd || 0) / 1e12) * 8 + 8)
          .attr('fill', '#66BB6A');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt((d.gdpUsd || 0) / 1e12) * 8 + 5)
          .attr('fill', '#4CAF50');
      });

    // Add country labels
    g.selectAll('.country-label')
      .data(sampleCountries)
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('x', d => (projection([d.longitude, d.latitude])?.[0] || 0) + 15)
      .attr('y', d => (projection([d.longitude, d.latitude])?.[1] || 0) + 5)
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // Add correlation lines
    const filteredCorrelations = sampleCorrelations.filter(
      corr => Math.abs(corr.correlationCoefficient) >= minCorrelation
    );

    g.selectAll('.correlation-line')
      .data(filteredCorrelations)
      .enter()
      .append('line')
      .attr('class', 'correlation-line')
      .attr('x1', d => {
        const country = sampleCountries.find(c => c.id === d.countryAId);
        return projection([country?.longitude || 0, country?.latitude || 0])?.[0] || 0;
      })
      .attr('y1', d => {
        const country = sampleCountries.find(c => c.id === d.countryAId);
        return projection([country?.longitude || 0, country?.latitude || 0])?.[1] || 0;
      })
      .attr('x2', d => {
        const country = sampleCountries.find(c => c.id === d.countryBId);
        return projection([country?.longitude || 0, country?.latitude || 0])?.[0] || 0;
      })
      .attr('y2', d => {
        const country = sampleCountries.find(c => c.id === d.countryBId);
        return projection([country?.longitude || 0, country?.latitude || 0])?.[1] || 0;
      })
      .attr('stroke', d => d.correlationCoefficient > 0 ? '#2196F3' : '#F44336')
      .attr('stroke-width', d => Math.abs(d.correlationCoefficient) * 4)
      .attr('opacity', 0.7);

  }, [minCorrelation, selectedIndicator]);

  const handleIndicatorChange = (event: any) => {
    setSelectedIndicator(event.target.value);
  };

  const handleCorrelationChange = (event: any, newValue: number | number[]) => {
    setMinCorrelation(newValue as number);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🌍 Interactive Global Economic Network Map
        <Tooltip title="Explore economic correlations between countries through an interactive network visualization">
          <IconButton size="small">
            <Info />
          </IconButton>
        </Tooltip>
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Economic Indicator</InputLabel>
              <Select
                value={selectedIndicator}
                label="Economic Indicator"
                onChange={handleIndicatorChange}
              >
                <MenuItem value="gdp">GDP</MenuItem>
                <MenuItem value="inflation">Inflation Rate</MenuItem>
                <MenuItem value="unemployment">Unemployment Rate</MenuItem>
                <MenuItem value="trade">Trade Balance</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Minimum Correlation Threshold: {minCorrelation.toFixed(2)}
            </Typography>
            <Slider
              value={minCorrelation}
              onChange={handleCorrelationChange}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Zoom In">
                <IconButton>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset View">
                <IconButton>
                  <RestartAlt />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Map Visualization */}
      <Paper sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <svg
              ref={svgRef}
              width={800}
              height={500}
              style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}
            />
          </Box>
        )}
      </Paper>

      {/* Selected Country Details */}
      {selectedCountry && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedCountry.name} ({selectedCountry.isoAlpha2})
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>GDP:</strong> ${((selectedCountry.gdpUsd || 0) / 1e12).toFixed(2)}T
              </Typography>
              <Typography variant="body2">
                <strong>Population:</strong> {((selectedCountry.population || 0) / 1e6).toFixed(0)}M
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Latitude:</strong> {selectedCountry.latitude.toFixed(2)}°
              </Typography>
              <Typography variant="body2">
                <strong>Longitude:</strong> {selectedCountry.longitude.toFixed(2)}°
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Legend</Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#4CAF50', borderRadius: '50%' }} />
            <Typography variant="body2">Countries (size = GDP)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 3, backgroundColor: '#2196F3' }} />
            <Typography variant="body2">Positive Correlation</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 3, backgroundColor: '#F44336' }} />
            <Typography variant="body2">Negative Correlation</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default GlobalEconomicNetworkMap;