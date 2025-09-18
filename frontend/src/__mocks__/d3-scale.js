// Mock for d3-scale module
export const scaleSequential = jest.fn(() => ({
  domain: jest.fn(),
  range: jest.fn(),
}));

export const interpolateViridis = jest.fn();
