import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Info, ZoomIn, ZoomOut, RestartAlt } from '@mui/icons-material';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL queries
const GET_CORRELATION_NETWORK = gql`
  query GetCorrelationNetwork($indicatorCategory: IndicatorCategoryType!, $minCorrelation: Float) {
    correlationNetwork(indicatorCategory: $indicatorCategory, minCorrelation: $minCorrelation) {
      country {
        id
        name
        isoCode
        latitude
        longitude
        region
        gdpUsd
      }
      connections {
        targetCountry {
          id
          name
          isoCode
          latitude
          longitude
        }
        correlationCoefficient
        connectionStrength
        significanceLevel
      }
      centralityScore
      clusterId
    }
  }
`;

const GET_COUNTRIES_WITH_ECONOMIC_DATA = gql`
  query GetCountriesWithEconomicData {
    countriesWithEconomicData {
      country {
        id
        name
        isoCode
        latitude
        longitude
        region
        gdpUsd
        currencyCode
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

// Types
interface CountryNode {
  id: string;
  name: string;
  isoCode: string;
  latitude: number;
  longitude: number;
  region: string;
  gdpUsd?: string;
  centralityScore?: number;
  economicHealthScore?: number;
  connections: ConnectionEdge[];
}

interface ConnectionEdge {
  source: CountryNode;
  target: CountryNode;
  correlationCoefficient: number;
  connectionStrength: number;
  significanceLevel: number;
}

interface MapDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

// Component props
interface GlobalEconomicNetworkMapProps {
  height?: number;
  interactive?: boolean;
}

const GlobalEconomicNetworkMap: React.FC<GlobalEconomicNetworkMapProps> = ({
  height = 600,
  interactive = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedIndicator, setSelectedIndicator] = useState<string>('GDP');
  const [minCorrelation, setMinCorrelation] = useState<number>(0.3);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<MapDimensions>({
    width: 1000,
    height,
    margin: { top: 20, right: 20, bottom: 40, left: 20 },
  });

  // GraphQL queries
  const {
    data: networkData,
    loading: networkLoading,
    error: networkError,
  } = useQuery(GET_CORRELATION_NETWORK, {
    variables: {
      indicatorCategory: selectedIndicator,
      minCorrelation,
    },
    skip: !selectedIndicator,
  });

  const {
    data: countriesData,
    loading: countriesLoading,
    error: countriesError,
  } = useQuery(GET_COUNTRIES_WITH_ECONOMIC_DATA);

  // World map data (simplified for demo - in production, load from TopoJSON)
  const [worldData, setWorldData] = useState<any>(null);

  // Load world map data
  useEffect(() => {
    // In a real implementation, you'd load actual TopoJSON data
    // For now, we'll create a simplified version
    const mockWorldData = {
      type: 'FeatureCollection',
      features: [
        // Simplified country boundaries - in production, use actual TopoJSON
        {
          type: 'Feature',
          properties: { NAME: 'United States', ISO_A3: 'USA' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-125, 48], [-125, 25], [-66, 25], [-66, 48], [-125, 48]
            ]]
          }
        },
        // Add more countries as needed
      ]
    };
    setWorldData(mockWorldData);
  }, []);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setDimensions(prev => ({
          ...prev,
          width: Math.max(800, containerWidth - 40),
        }));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create the map visualization
  useEffect(() => {
    if (!svgRef.current || !networkData || !worldData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const { width, height: svgHeight, margin } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(150)
      .translate([innerWidth / 2, innerHeight / 2]);

    const path = d3.geoPath().projection(projection);

    // Create zoom behavior
    const zoom = d3.zoom<SVGGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Draw world map background
    g.append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(worldData.features)
      .join('path')
      .attr('d', path)
      .attr('fill', '#f0f0f0')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 0.5);

    // Process network data
    const countries: CountryNode[] = networkData.correlationNetwork.map((node: any) => ({
      id: node.country.id,
      name: node.country.name,
      isoCode: node.country.isoCode,
      latitude: parseFloat(node.country.latitude || '0'),
      longitude: parseFloat(node.country.longitude || '0'),
      region: node.country.region,
      gdpUsd: node.country.gdpUsd,
      centralityScore: node.centralityScore,
      connections: node.connections.map((conn: any) => ({
        target: {
          id: conn.targetCountry.id,
          name: conn.targetCountry.name,
          isoCode: conn.targetCountry.isoCode,
          latitude: parseFloat(conn.targetCountry.latitude || '0'),
          longitude: parseFloat(conn.targetCountry.longitude || '0'),
        },
        correlationCoefficient: conn.correlationCoefficient,
        connectionStrength: conn.connectionStrength,
        significanceLevel: conn.significanceLevel,
      })),
    }));

    // Create scales
    const centralityScale = d3
      .scaleLinear()
      .domain(d3.extent(countries, d => d.centralityScore || 0) as [number, number])
      .range([3, 15]);

    const healthColorScale = d3
      .scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 100]);

    // Draw connections if enabled
    if (showConnections) {
      const connections: ConnectionEdge[] = [];
      countries.forEach(country => {
        country.connections.forEach(conn => {
          const sourcePos = projection([country.longitude, country.latitude]);
          const targetPos = projection([conn.target.longitude, conn.target.latitude]);
          
          if (sourcePos && targetPos) {
            connections.push({
              source: country,
              target: conn.target as CountryNode,
              correlationCoefficient: conn.correlationCoefficient,
              connectionStrength: conn.connectionStrength,
              significanceLevel: conn.significanceLevel,
            });
          }
        });
      });

      // Connection strength scale
      const connectionOpacityScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0.1, 0.8]);

      // Draw connection lines
      g.append('g')
        .attr('class', 'connections')
        .selectAll('line')
        .data(connections)
        .join('line')
        .attr('x1', d => {
          const pos = projection([d.source.longitude, d.source.latitude]);
          return pos ? pos[0] : 0;
        })
        .attr('y1', d => {
          const pos = projection([d.source.longitude, d.source.latitude]);
          return pos ? pos[1] : 0;
        })
        .attr('x2', d => {
          const pos = projection([d.target.longitude, d.target.latitude]);
          return pos ? pos[0] : 0;
        })
        .attr('y2', d => {
          const pos = projection([d.target.longitude, d.target.latitude]);
          return pos ? pos[1] : 0;
        })
        .attr('stroke', d => d.correlationCoefficient > 0 ? '#4caf50' : '#f44336')
        .attr('stroke-width', d => Math.abs(d.correlationCoefficient) * 3)
        .attr('opacity', d => connectionOpacityScale(d.connectionStrength))
        .attr('stroke-dasharray', d => d.significanceLevel > 0.05 ? '3,3' : 'none');
    }

    // Draw country nodes
    const countryNodes = g
      .append('g')
      .attr('class', 'country-nodes')
      .selectAll('circle')
      .data(countries)
      .join('circle')
      .attr('cx', d => {
        const pos = projection([d.longitude, d.latitude]);
        return pos ? pos[0] : 0;
      })
      .attr('cy', d => {
        const pos = projection([d.longitude, d.latitude]);
        return pos ? pos[1] : 0;
      })
      .attr('r', d => centralityScale(d.centralityScore || 0))
      .attr('fill', d => {
        // Use economic health score if available from countries data
        const countryData = countriesData?.countriesWithEconomicData.find(
          (c: any) => c.country.isoCode === d.isoCode
        );
        const healthScore = countryData?.economicHealthScore || 50;
        return healthColorScale(healthScore);
      })
      .attr('stroke', '#333')
      .attr('stroke-width', d => selectedCountry === d.id ? 3 : 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCountry(selectedCountry === d.id ? null : d.id);
      })
      .on('mouseover', function(event, d) {
        // Show tooltip
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', centralityScale(d.centralityScore || 0) * 1.5);

        // Create tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'map-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('pointer-events', 'none')
          .style('opacity', 0);

        const countryData = countriesData?.countriesWithEconomicData.find(
          (c: any) => c.country.isoCode === d.isoCode
        );

        tooltip.html(`
          <strong>${d.name}</strong><br/>
          Region: ${d.region}<br/>
          Centrality Score: ${(d.centralityScore || 0).toFixed(3)}<br/>
          ${countryData ? `
            GDP: $${parseFloat(countryData.latestGdp || '0').toLocaleString()}B<br/>
            Health Score: ${(countryData.economicHealthScore || 0).toFixed(1)}/100<br/>
            Connections: ${d.connections.length}
          ` : ''}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', centralityScale(d.centralityScore || 0));

        d3.selectAll('.map-tooltip').remove();
      });

    // Add country labels for major economies
    g.append('g')
      .attr('class', 'country-labels')
      .selectAll('text')
      .data(countries.filter(d => (d.centralityScore || 0) > 0.1))
      .join('text')
      .attr('x', d => {
        const pos = projection([d.longitude, d.latitude]);
        return pos ? pos[0] : 0;
      })
      .attr('y', d => {
        const pos = projection([d.longitude, d.latitude]);
        return pos ? pos[1] - centralityScale(d.centralityScore || 0) - 5 : 0;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')
      .attr('paint-order', 'stroke')
      .text(d => d.name);

    // Add zoom controls
    const zoomControls = svg
      .append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${width - 80}, 20)`);

    // Zoom in button
    zoomControls
      .append('rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(
          zoom.scaleBy as any, 1.5
        );
      });

    zoomControls
      .append('text')
      .attr('x', 15)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('+')
      .style('pointer-events', 'none');

    // Zoom out button
    zoomControls
      .append('rect')
      .attr('y', 35)
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(
          zoom.scaleBy as any, 0.67
        );
      });

    zoomControls
      .append('text')
      .attr('x', 15)
      .attr('y', 55)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('−')
      .style('pointer-events', 'none');

    // Reset zoom button
    zoomControls
      .append('rect')
      .attr('y', 70)
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(500).call(
          zoom.transform as any,
          d3.zoomIdentity
        );
      });

    zoomControls
      .append('text')
      .attr('x', 15)
      .attr('y', 90)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('⌂')
      .style('pointer-events', 'none');

  }, [networkData, worldData, dimensions, showConnections, selectedCountry, countriesData]);

  if (networkLoading || countriesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading global economic network...
        </Typography>
      </Box>
    );
  }

  if (networkError || countriesError) {
    return (
      <Alert severity="error">
        Failed to load global economic network data: {networkError?.message || countriesError?.message}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          🌍 Global Economic Network Analysis
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Economic Indicator</InputLabel>
          <Select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value)}
            label="Economic Indicator"
          >
            <MenuItem value="GDP">GDP Growth</MenuItem>
            <MenuItem value="Trade">Trade Flows</MenuItem>
            <MenuItem value="Employment">Employment</MenuItem>
            <MenuItem value="Inflation">Inflation</MenuItem>
            <MenuItem value="Financial">Financial Markets</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption" gutterBottom>
            Min Correlation: {minCorrelation.toFixed(2)}
          </Typography>
          <Slider
            value={minCorrelation}
            onChange={(_, value) => setMinCorrelation(value as number)}
            min={0}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
            />
          }
          label="Show Connections"
        />

        <Tooltip title="Node size = Economic centrality. Color = Economic health (red=poor, green=strong). Green lines = positive correlation, red = negative.">
          <IconButton size="small">
            <Info />
          </IconButton>
        </Tooltip>
      </Box>

      <Box ref={containerRef} sx={{ width: '100%', height: height - 100 }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ border: '1px solid #e0e0e0', borderRadius: 4 }}
        />
      </Box>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">Legend:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 2, bgcolor: '#4caf50' }} />
            <Typography variant="caption">Positive Correlation</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 2, bgcolor: '#f44336' }} />
            <Typography variant="caption">Negative Correlation</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="caption">Strong Economy</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
            <Typography variant="caption">Weak Economy</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default GlobalEconomicNetworkMap;
