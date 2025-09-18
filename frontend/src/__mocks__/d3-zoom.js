// Mock for d3-zoom module
export const zoom = jest.fn(() => ({
  scaleExtent: jest.fn(),
  on: jest.fn(),
}));
