const d3Mock = {
  // D3-geo mocks
  geoPath: jest.fn(() => ({
    projection: jest.fn(),
    pointRadius: jest.fn(),
  })),
  geoNaturalEarth1: jest.fn(() => ({
    scale: jest.fn(),
    center: jest.fn(),
    translate: jest.fn(),
  })),
  geoMercator: jest.fn(() => ({
    scale: jest.fn(),
    center: jest.fn(),
    translate: jest.fn(),
  })),
  geoOrthographic: jest.fn(() => ({
    scale: jest.fn(),
    center: jest.fn(),
    translate: jest.fn(),
  })),

  // D3-zoom mocks
  zoom: jest.fn(() => ({
    scaleExtent: jest.fn(),
    on: jest.fn(),
  })),

  // D3-scale mocks
  scaleSequential: jest.fn(() => ({
    domain: jest.fn(),
    range: jest.fn(),
  })),
  interpolateViridis: jest.fn(),

  // D3-array mocks
  range: jest.fn(),

  // D3-selection mocks
  select: jest.fn(),
  selectAll: jest.fn(),
};

export default d3Mock;
