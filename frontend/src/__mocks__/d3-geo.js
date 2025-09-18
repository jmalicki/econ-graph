// Mock for d3-geo module
export const geoPath = jest.fn(() => ({
  projection: jest.fn(),
  pointRadius: jest.fn(),
}));

export const geoNaturalEarth1 = jest.fn(() => ({
  scale: jest.fn(),
  center: jest.fn(),
  translate: jest.fn(),
}));

export const geoMercator = jest.fn(() => ({
  scale: jest.fn(),
  center: jest.fn(),
  translate: jest.fn(),
}));

export const geoOrthographic = jest.fn(() => ({
  scale: jest.fn(),
  center: jest.fn(),
  translate: jest.fn(),
}));
